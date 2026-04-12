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
        http_req_duration: ["p(95)<1000"],
        http_req_failed: ["rate<0.01"],
    },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:6060";

export default function () {
    const uniqueId = `${__VU}_${__ITER}_${Date.now()}`;
    const email = `loaduser_${uniqueId}@test.com`;
    const password = "123456";

    const registerPayload = JSON.stringify({
        name: `Load User ${uniqueId}`,
        email: email,
        password: password,
        phone: "12345678",
        address: "123 Load Street",
        answer: "123",
    });

    const registerRes = http.post(
        `${BASE_URL}/api/v1/auth/register`,
        registerPayload,
        {
            headers: { "Content-Type": "application/json" },
        }
    );

    check(registerRes, {
        "register status 201": (r) => r.status === 201,
    });

    const loginPayload = JSON.stringify({
        email: email,
        password: password,
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

    sleep(1);
}