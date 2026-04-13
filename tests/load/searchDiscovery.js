// Chen Peiran, A0257826R
import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
    stages: [
        { duration: "30s", target: 10 },
        { duration: "30s", target: 25 },
        { duration: "30s", target: 50 },
        { duration: "30s", target: 85 },
        { duration: "10s", target: 0 },
    ],
    thresholds: {
        http_req_duration: ["p(95)<1500"],
        http_req_failed: ["rate<0.01"],
    },
};

const BASE_URL = "http://localhost:6060";
const keyword = "book";

export default function () {
    const searchRes = http.get(`${BASE_URL}/api/v1/product/search/${keyword}`);
    check(searchRes, {
        "search status 200": (r) => r.status === 200,
    });

    const firstProduct = searchRes.json()[0];

    const detailRes = http.get(
        `${BASE_URL}/api/v1/product/get-product/${firstProduct.slug}`
    );
    check(detailRes, {
        "product detail status 200": (r) => r.status === 200,
    });

    const product = detailRes.json("product");
    const productId = product._id;
    const categoryId = product.category._id;

    const relatedRes = http.get(
        `${BASE_URL}/api/v1/product/related-product/${productId}/${categoryId}`
    );
    check(relatedRes, {
        "related product status 200": (r) => r.status === 200,
    });

    sleep(1);
}