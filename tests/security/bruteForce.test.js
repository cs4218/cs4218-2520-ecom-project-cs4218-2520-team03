// Sun Zihan, A0259581R
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../../server.js";

let mongoServer;

beforeAll(async () => {
  await mongoose.disconnect();
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("Security Testing - Automated Brute Force and Rate Limiting", () => {
    const loginUrl = "/api/v1/auth/login";
    const dictionary = ["123456", "password", "qwerty", "admin", "petname1"];
  
    it("should block a high-frequency dictionary attack", async () => {
      for (const commonPassword of dictionary) {
        await request(app)
          .post(loginUrl)
          .set('x-test-rate-limit', 'true')
          .send({ email: "victim@test.com", password: commonPassword });
      }
  
      // Next attempt (6th attempt) must be blocked regardless of the password used
      const res = await request(app)
        .post(loginUrl)
        .set('x-test-rate-limit', 'true')
        .send({ email: "victim@test.com", password: "last_attempt" });
  
      expect(res.status).toBe(429);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Too many login attempts");
    });
  
    it("should maintain the cooling-off period after the limit is reached", async () => {
      for (let i = 0; i <= 5; i++) {
        await request(app)
          .post(loginUrl)
          .set('x-test-rate-limit', 'true')
          .send({ email: "victim@test.com", password: "wrong" });
      }
  
      const res = await request(app)
        .post(loginUrl)
        .set('x-test-rate-limit', 'true')
        .send({ email: "victim@test.com", password: "wrong" });
  
      expect(res.status).toBe(429);
    });
  });