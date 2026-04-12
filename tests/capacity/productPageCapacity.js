// Trinh Hoai Song Thu, A0266248W
import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = "http://localhost:6060";
const TOTAL_PRODUCTS = 10;
const PRODUCT_PREFIX = "capacityproduct";

export const options = {
  stages: [
    { duration: "30s", target: 10 },
    { duration: "30s", target: 25 },
    { duration: "30s", target: 40 },
    { duration: "10s", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<1000"],
    http_req_failed: ["rate<0.01"],
    "http_req_duration{endpoint:get_product}": ["p(95)<1000"],
    "http_req_duration{endpoint:related_product}": ["p(95)<1000"],
  },
};

export default function () {
  const productId = ((__VU - 1 + __ITER) % TOTAL_PRODUCTS) + 1;
  const slug = `${PRODUCT_PREFIX}-${productId}`;

  const productRes = http.get(
    `${BASE_URL}/api/v1/product/get-product/${slug}`,
    {
      tags: { endpoint: "get_product" },
    }
  );

  const productOk = check(productRes, {
    "get product status 200": (r) => r.status === 200,
    "get product has valid body": (r) => {
      try {
        const body = JSON.parse(r.body);
        return Boolean(body?.product?._id && body?.product?.category?._id);
      } catch {
        return false;
      }
    },
  });

  if (!productOk) {
    console.log(
      `GET PRODUCT FAIL slug=${slug} status=${productRes.status} body=${productRes.body}`
    );
    sleep(1);
    return;
  }

  const productBody = JSON.parse(productRes.body);
  const pid = productBody.product._id;
  const cid = productBody.product.category._id;

  const relatedRes = http.get(
    `${BASE_URL}/api/v1/product/related-product/${pid}/${cid}`,
    {
      tags: { endpoint: "related_product" },
    }
  );

  const relatedOk = check(relatedRes, {
    "related product status 200": (r) => r.status === 200,
  });

  if (!relatedOk) {
    console.log(
      `RELATED FAIL slug=${slug} pid=${pid} cid=${cid} status=${relatedRes.status} body=${relatedRes.body}`
    );
  }

  sleep(1);
}