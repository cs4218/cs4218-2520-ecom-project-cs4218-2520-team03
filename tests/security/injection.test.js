// Sun Zihan, A0259581R

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
  it("should reject NoSQL operator injection in the login fields", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: { "$gt": "" }, password: { "$gt": "" } });
    expect(res.status).not.toBe(200);
  });

  it("should reject NoSQL injection in the forgot-password answer", async () => {
    const res = await request(app)
      .post("/api/v1/auth/forgot-password")
      .send({ email: "test@example.com", answer: { "$ne": "wrong" }, newPassword: "new" });
    expect(res.status).not.toBe(200);
  });

  it("should sanitize XSS payloads in registration", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({
        name: "<script>alert('xss')</script>",
        email: "xss@test.com",
        password: "password123",
        phone: "12345678",
        address: "Test",
        answer: "blue"
      });
    if (res.status === 201) {
       expect(res.body.user.name).not.toBe("<script>alert('xss')</script>");
    }
  });

  it("should return generic error messages and not leak database internals", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: ["invalid"], password: "123" });

    const responseBody = JSON.stringify(res.body);
    const forbiddenDetails = ["mongodb", "mongoose", "stack", "at line", "cast to string"];

    forbiddenDetails.forEach(detail => {
      expect(responseBody.toLowerCase()).not.toContain(detail);
    });
  });
});