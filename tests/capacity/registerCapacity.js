// Trinh Hoai Song Thu, A0266248W
// Remember to run `node capacityData.js cleanup-users` after the test to remove test users from the database
import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "30s", target: 10 },
    { duration: "30s", target: 25 },
    { duration: "30s", target: 50 },
    { duration: "30s", target: 100 },
    { duration: "30s", target: 180 },
  ],

  thresholds: {
    http_req_duration: ["p(95)<2000"], 
    http_req_failed: ["rate<0.01"], 
  },
};

export default function () {

  // unique user generation to avoid DB uniqueness conflict
  const unique = `${__VU}-${__ITER}-${Date.now()}`;

  const payload = JSON.stringify({
    name: `User ${unique}`,
    email: `capacitytest_${unique}@test.com`,
    password: "Password123!",
    phone: "12345678",
    address: {
      street: "Test Street",
      city: "Test City",
      zip: "12345"
    },
    answer: "test-answer",
  });

  const params = {
    headers: {
      "Content-Type": "application/json",
    },
  };

  const res = http.post(
    "http://localhost:3000/api/v1/auth/register",
    payload,
    params
  );

  check(res, {
    "status is success": (r) => r.status === 200 || r.status === 201,
  });

  sleep(1);
}