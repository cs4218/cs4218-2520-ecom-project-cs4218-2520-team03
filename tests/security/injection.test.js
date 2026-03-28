// Sun Zihan, A0259581R 
// Story: Security Testing - Injection & Input Hardening

import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../../server.js";
import userModel from "../../models/userModel.js";
import { hashPassword } from "../../helpers/authHelper.js";

let mongoServer;

beforeAll(async () => {
  await mongoose.disconnect();
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  const hashedPassword = await hashPassword("password123");
  await new userModel({
    name: "Test User",
    email: "test@example.com",
    password: hashedPassword,
    phone: "12345678",
    address: "123 Safety St",
    answer: "blue",
  }).save();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("Security Testing - Injection & Input Hardening", () => {
  
  /**
   * TEST 1: NoSQL Injection via Object Injection in Login
   * Attackers use {"$gt": ""} to try and bypass the email/password check.
   */
  it("should reject NoSQL operator injection in the login fields", async () => {
    const maliciousPayload = {
      email: { "$gt": "" }, 
      password: { "$gt": "" }
    };

    const res = await request(app)
      .post("/api/v1/auth/login")
      .send(maliciousPayload);

    expect(res.status).not.toBe(200);
  });

  /**
   * TEST 2: NoSQL Injection in Forgot Password
   * Testing if an attacker can reset a password by injecting objects into 'answer'.
   */
  it("should reject NoSQL injection in the forgot-password security answer", async () => {
    const maliciousPayload = {
      email: "test@example.com",
      answer: { "$ne": "wrong-answer" },
      newPassword: "hackedPassword123"
    };

    const res = await request(app)
      .post("/api/v1/auth/forgot-password")
      .send(maliciousPayload);

    expect(res.status).not.toBe(200);
  });

  /**
   * TEST 3: Cross-Site Scripting (XSS) in Registration
   * Ensuring raw script tags are not accepted/stored as-is.
   */
  it("should sanitize or reject XSS payloads in registration fields", async () => {
    const xssPayload = {
      name: "<script>alert('xss')</script>",
      email: "xss-tester@test.com",
      password: "password123",
      phone: "87654321",
      address: "Malicious Lane",
      answer: "football"
    };

    const res = await request(app)
      .post("/api/v1/auth/register")
      .send(xssPayload);

    if (res.status === 201) {
       expect(res.body.user.name).not.toBe("<script>alert('xss')</script>");
    }
  });

  /**
   * TEST 4: Information Leakage via Error Messages
   * Ensuring the server doesn't send back MongoDB/Mongoose internal details.
   */
  it("should return generic error messages and not leak database internals", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: ["invalid-array-type"], password: "123" });

    const responseBody = JSON.stringify(res.body);
    const forbiddenDetails = ["mongodb", "mongoose", "stack", "at line", "cast to string"];

    forbiddenDetails.forEach(detail => {
      expect(responseBody.toLowerCase()).not.toContain(detail);
    });
  });
});