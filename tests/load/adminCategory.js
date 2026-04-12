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

const BASE_URL = __ENV.BASE_URL || "http://localhost:6060";
const ADMIN_EMAIL = "admin@gmail.com";
const ADMIN_PASSWORD = "123456";

export default function () {
    const loginRes = http.post(
        `${BASE_URL}/api/v1/auth/login`,
        JSON.stringify({
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD,
        }),
        {
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
        }
    );

    check(loginRes, {
        "admin login status 200": (r) => r.status === 200,
    });

    const token = loginRes.json("token");

    const authHeaders = {
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: token,
        },
    };

    const uniqueId = `${__VU}_${__ITER}_${Date.now()}`;
    const categoryName = `Load Category ${uniqueId}`;
    const updatedCategoryName = `Updated Load Category ${uniqueId}`;

    const createRes = http.post(
        `${BASE_URL}/api/v1/category/create-category`,
        JSON.stringify({ name: categoryName }),
        authHeaders
    );

    check(createRes, {
        "create category status 201": (r) => r.status === 201,
    });

    const categoryId = createRes.json("category._id");

    const updateRes = http.put(
        `${BASE_URL}/api/v1/category/update-category/${categoryId}`,
        JSON.stringify({ name: updatedCategoryName }),
        authHeaders
    );

    check(updateRes, {
        "update category status 200": (r) => r.status === 200,
    });

    const listRes = http.get(
        `${BASE_URL}/api/v1/category/get-category`,
        authHeaders
    );

    check(listRes, {
        "get category list status 200": (r) => r.status === 200,
    });

    const deleteRes = http.del(
        `${BASE_URL}/api/v1/category/delete-category/${categoryId}`,
        null,
        authHeaders
    );

    check(deleteRes, {
        "delete category status 200": (r) => r.status === 200,
    });

    sleep(1);
}