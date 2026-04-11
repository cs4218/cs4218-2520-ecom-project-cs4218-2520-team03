// Chen Zhiruo A0256855N
import http from 'k6/http';
import exec from 'k6/execution';
import { Trend, Rate } from 'k6/metrics';
import { check, fail } from 'k6';

const BASE_URL = 'http://localhost:6060';
const LEVELS = [70, 80, 90, 95, 98, 100];
const HOLD_SECONDS = 180;
const RECOVERY_SECONDS = 45;
const RECOVERY_VUS = 5;

const LOGIN_PATH = '/api/v1/auth/login';
const PRODUCT_LIST_PATH = '/api/v1/product/get-product?perPage=20';
const PAYMENT_PATH = '/api/v1/product/braintree/payment';

const USER_EMAIL = 'user@gmail.com';
const USER_PASSWORD = '123456';
const PAYMENT_NONCE = 'fake-valid-nonce';

const SCENARIO_NAMES = [...LEVELS.map((v) => `vus_${String(v).padStart(3, '0')}`), 'recovery'];

const paymentResponseMetrics = {};
const paymentFailRates = {};

for (const name of SCENARIO_NAMES) {
  paymentResponseMetrics[name] = new Trend(`payment_response_time_${name}`);
  paymentFailRates[name] = new Rate(`payment_failed_${name}`);
}

let vuToken = null;

export const options = {
  scenarios: buildSequentialScenarios(),
  summaryTrendStats: ['med', 'p(95)', 'p(99)'],
};

function buildSequentialScenarios() {
  const scenarios = {};
  let offset = 0;

  for (const vus of LEVELS) {
    const name = `vus_${String(vus).padStart(3, '0')}`;
    scenarios[name] = {
      executor: 'constant-vus',
      exec: 'paymentStress',
      vus: vus,
      duration: `${HOLD_SECONDS}s`,
      gracefulStop: '20s',
      startTime: `${offset}s`,
    };
    offset += HOLD_SECONDS;
  }

  scenarios.recovery = {
    executor: 'constant-vus',
    exec: 'paymentStress',
    vus: RECOVERY_VUS,
    duration: `${RECOVERY_SECONDS}s`,
    gracefulStop: '5s',
    startTime: `${offset}s`,
  };

  return scenarios;
}

function jsonHeaders(token) {
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  if (token) {
    headers.Authorization = token;
  }

  return {
    headers,
    timeout: '15s',
  };
}

function safeJson(res) {
  try {
    return res.json();
  } catch (e) {
    return null;
  }
}

function login() {
  const res = http.post(
    `${BASE_URL}${LOGIN_PATH}`,
    JSON.stringify({
      email: USER_EMAIL,
      password: USER_PASSWORD,
    }),
    jsonHeaders()
  );

  const body = safeJson(res);

  const ok = check(res, {
    'login status is 200': (r) => r.status === 200,
    'login token exists': () => !!body?.token,
  });

  if (!ok) {
    fail(`Login failed: ${res.status} - ${res.body}`);
  }

  return body.token;
}

function getOrLogin() {
  if (!vuToken) {
    vuToken = login();
  }
  return vuToken;
}

function loadProduct() {
  const res = http.get(`${BASE_URL}${PRODUCT_LIST_PATH}`, jsonHeaders());

  const body = safeJson(res);
  const products = body?.products || [];

  const ok = check(res, {
    'product list status is 200': (r) => r.status === 200,
    'products array exists': () => Array.isArray(products),
    'at least one product exists': () => products.length > 0,
  });

  if (!ok) {
    fail(`Could not load products for payment test: ${res.status} - ${res.body}`);
  }

  const product = products[0];

  return {
    _id: product._id,
    name: product.name,
    description: product.description,
    price: product.price,
    quantity: 1,
    shipping: product.shipping,
    slug: product.slug,
  };
}

export function setup() {
  const product = loadProduct();
  return { cart: [product] };
}

export function paymentStress(data) {
  const currentScenario = exec.scenario.name;
  let token = getOrLogin();

  let res = http.post(
    `${BASE_URL}${PAYMENT_PATH}`,
    JSON.stringify({
      nonce: PAYMENT_NONCE,
      cart: data.cart,
    }),
    jsonHeaders(token)
  );

  if (res.status === 401) {
    vuToken = login();
    token = vuToken;

    res = http.post(
      `${BASE_URL}${PAYMENT_PATH}`,
      JSON.stringify({
        nonce: PAYMENT_NONCE,
        cart: data.cart,
      }),
      jsonHeaders(token)
    );
  }

  paymentResponseMetrics[currentScenario].add(res.timings.duration);

  const body = safeJson(res);
  const ok = check(res, {
    'payment status is 200': (r) => r.status === 200,
    'payment ok is true': () => body?.ok === true,
    'payment not 401': (r) => r.status !== 401,
  });

  paymentFailRates[currentScenario].add(!ok);
}