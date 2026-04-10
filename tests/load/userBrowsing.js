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
        http_req_duration: ["p(95)<1000"],
        http_req_failed: ["rate<0.01"],
    },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:6060";

export default function () {
    const responses = http.batch([
        ["GET", `${BASE_URL}/api/v1/category/get-category`],
        ["GET", `${BASE_URL}/api/v1/product/product-count`],
        ["GET", `${BASE_URL}/api/v1/product/product-list/1`],
    ]);

    check(responses[0], {
        "category status 200": (r) => r.status === 200,
    });

    check(responses[1], {
        "product count status 200": (r) => r.status === 200,
    });

    check(responses[2], {
        "product list page 1 status 200": (r) => r.status === 200,
    });

    const page2Res = http.get(`${BASE_URL}/api/v1/product/product-list/2`);
    check(page2Res, {
        "product list page 2 status 200": (r) => r.status === 200,
    });

    const filterPayload = JSON.stringify({
        checked: [],
        radio: [0, 100],
    });

    const filterRes = http.post(
        `${BASE_URL}/api/v1/product/product-filters`,
        filterPayload,
        {
            headers: { "Content-Type": "application/json" },
        }
    );

    check(filterRes, {
        "product filter status 200": (r) => r.status === 200,
    });

    sleep(1);
}