// Trinh Hoai Song Thu, A0266248W
import http from "k6/http";
import { check, sleep } from "k6";

const TOTAL_USERS = 300;
const PASSWORD = "Password123!";

export const options = {
  stages: [
  { duration: "30s", target: 10 },
  { duration: "30s", target: 25 },
  { duration: "30s", target: 50 },
  { duration: "30s", target: 100 },
  { duration: "30s", target: 150 },
  { duration: "30s", target: 170 },
  { duration: "10s", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<2000"],
    http_req_failed: ["rate<0.01"],
  },
};

export default function () {
  // Map each VU to one of the 300 seeded users
  const userId = ((__VU - 1) % TOTAL_USERS) + 1;

  const payload = JSON.stringify({
    email: `logincapacity_${userId}@test.com`,
    password: PASSWORD,
  });

  const params = {
    headers: {
      "Content-Type": "application/json",
    },
  };

  const res = http.post(
    "http://localhost:3000/api/v1/auth/login",
    payload,
    params
  );

  const ok = check(res, {
    "status is 200": (r) => r.status === 200,
    "response contains token": (r) => {
      try {
        const body = JSON.parse(r.body);
        return Boolean(
          body.token ||
          body.accessToken ||
          body.jwt ||
          body?.data?.token
        );
      } catch {
        return false;
      }
    },
  });

  if (!ok) {
    console.log(`FAIL status=${res.status} body=${res.body}`);
  }

  sleep(1);
}