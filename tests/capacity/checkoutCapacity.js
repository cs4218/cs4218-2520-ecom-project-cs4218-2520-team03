// Trinh Hoai Song Thu, A0266248W
import http from 'k6/http';
import { check, sleep, fail } from 'k6';
import { SharedArray } from 'k6/data';

export const options = {
  scenarios: {
    checkout_capacity: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '1m', target: 10 },
        { duration: '2m', target: 25 },
        { duration: '4m', target: 50 },
        { duration: '2m', target: 0 },
      ],
      gracefulRampDown: '30s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<10000'],
    http_req_failed: ['rate==0'],
  },
};

const BASE_URL = 'http://localhost:3000';
const DUMMY_PASSWORD = 'Password123!';
const PAYMENT_NONCE = 'fake-valid-nonce';
const PRODUCT_SLUG_PREFIX = 'capacityproduct';
const PRODUCT_LIST_PATH = '/api/v1/product/get-product?perPage=20';
const LOGIN_PATH = '/api/v1/auth/login';
const BRAINTREE_TOKEN_PATH = '/api/v1/product/braintree/token';
const PAYMENT_PATH = '/api/v1/product/braintree/payment';

const users = new SharedArray('capacity-users', function () {
  return Array.from({ length: 300 }, (_, i) => ({
    email: `logincapacity_${i + 1}@test.com`,
    password: DUMMY_PASSWORD,
  }));
});

let vuToken = null;

function jsonHeaders(token) {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  if (token) {
    const rawToken = token.replace('Bearer ', '');
    headers['Authorization'] = rawToken;
  }

  return { headers, timeout: '15s' };
}

function login(user) {
  const res = http.post(
    `${BASE_URL}${LOGIN_PATH}`,
    JSON.stringify({ email: user.email, password: user.password }),
    jsonHeaders()
  );

  const ok = check(res, { 'login status 200': (r) => r.status === 200 });

  if (!ok) {
    fail(`Login failed for ${user.email}: ${res.status} - ${res.body}`);
  }

  const body = res.json();
  const token = body?.token || body?.data?.token || (body?.user && body?.token);
  
  if (!token) {
    fail(`No token found in response for ${user.email}`);
  }
  return token;
}

function getOrLogin(user) {
  if (!vuToken) {
    vuToken = login(user);
  }
  return vuToken;
}

function loadProducts() {
  const res = http.get(`${BASE_URL}${PRODUCT_LIST_PATH}`, jsonHeaders());
  
  if (res.status !== 200) {
    fail(`Product fetch failed: ${res.status}`);
  }

  const body = res.json();
  const rawProducts = body?.products || body?.data || body;

  if (!Array.isArray(rawProducts)) {
    fail(`Expected array of products, got: ${typeof rawProducts}`);
  }

  const filtered = rawProducts
    .filter((p) => p?.slug?.startsWith(PRODUCT_SLUG_PREFIX))
    .sort((a, b) => a.slug.localeCompare(b.slug));

  if (filtered.length < 10) {
    fail(`Found only ${filtered.length} products with prefix ${PRODUCT_SLUG_PREFIX}`);
  }

  return filtered.slice(0, 10);
}

function cartItem(product, quantity) {
  return {
    _id: product._id,
    name: product.name,
    description: product.description,
    price: product.price,
    quantity: quantity,
    shipping: product.shipping,
    slug: product.slug,
  };
}

function buildOrderTemplates(products) {
  return [
    [cartItem(products[0], 1)],
    [cartItem(products[1], 1)],
    [cartItem(products[2], 2)],
    [cartItem(products[3], 1), cartItem(products[4], 1)],
    [cartItem(products[5], 2), cartItem(products[6], 1)],
    [cartItem(products[7], 1), cartItem(products[8], 1), cartItem(products[9], 1)],
    [cartItem(products[0], 3)],
    [cartItem(products[1], 1), cartItem(products[3], 2)],
    [cartItem(products[2], 1), cartItem(products[5], 1), cartItem(products[7], 2)],
    [cartItem(products[4], 2), cartItem(products[6], 2)],
  ];
}

export function setup() {
  const products = loadProducts();
  const orderTemplates = buildOrderTemplates(products);
  return { orderTemplates };
}

export default function (data) {
  const user = users[(__VU - 1) % users.length];
  let token = getOrLogin(user);
  const braintreeTokenRes = http.get(`${BASE_URL}${BRAINTREE_TOKEN_PATH}`, jsonHeaders(token));
  
  if (braintreeTokenRes.status === 401) {
    console.warn(`Token expired for VU ${__VU}, re-logging...`);
    vuToken = login(user);
    token = vuToken;
  }

  check(braintreeTokenRes, {
    'braintree token status 200': (r) => r.status === 200,
  });

  // Prepare Order
  const idx = (__VU + __ITER) % data.orderTemplates.length;
  const cart = data.orderTemplates[idx];

  // Checkout
  const payload = JSON.stringify({
    nonce: PAYMENT_NONCE,
    cart: cart,
  });

  const res = http.post(`${BASE_URL}${PAYMENT_PATH}`, payload, jsonHeaders(token));

  const ok = check(res, {
    'payment status 200': (r) => r.status === 200,
    'payment not 401': (r) => r.status !== 401,
  });

  if (!ok) {
    console.error(`VU ${__VU} Payment Error: ${res.status} - ${res.body}`);
  }

  sleep(1);
}