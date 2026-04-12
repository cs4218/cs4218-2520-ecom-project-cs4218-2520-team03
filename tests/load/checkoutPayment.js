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

const LOGIN_EMAIL = "user@gmail.com";
const LOGIN_PASSWORD = "123456";

export default function () {
    const loginPayload = JSON.stringify({
        email: LOGIN_EMAIL,
        password: LOGIN_PASSWORD,
    });

    const loginRes = http.post(
        `${BASE_URL}/api/v1/auth/login`,
        loginPayload,
        {
            headers: { "Content-Type": "application/json" },
        }
    );

    check(loginRes, {
        "login status 200": (r) => r.status === 200,
    });

    const token = loginRes.json("token");

    const authHeaders = {
        headers: {
            "Content-Type": "application/json",
            Authorization: token,
        },
    };

    const btTokenRes = http.get(
        `${BASE_URL}/api/v1/product/braintree/token`,
        authHeaders
    );

    check(btTokenRes, {
        "braintree token status 200": (r) => r.status === 200,
    });

    const productListRes = http.get(`${BASE_URL}/api/v1/product/product-list/1`);

    check(productListRes, {
        "product list status 200": (r) => r.status === 200,
    });

    const firstProduct = productListRes.json("products")[0];

    const paymentPayload = JSON.stringify({
        nonce: "fake-valid-nonce",
        cart: [firstProduct],
    });

    const paymentRes = http.post(
        `${BASE_URL}/api/v1/product/braintree/payment`,
        paymentPayload,
        authHeaders
    );

    check(paymentRes, {
        "payment status 200": (r) => r.status === 200,
    });

    sleep(1);
}