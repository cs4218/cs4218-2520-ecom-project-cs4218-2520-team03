// Sun Zihan, A0259581R
import { jest } from "@jest/globals";

// Mock the payment controller so it never tries to load Braintree
jest.mock("../../controllers/paymentController.js", () => ({
  braintreeTokenController: jest.fn(),
  brainTreePaymentController: jest.fn(),
}));

import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../../server.js";
import userModel from "../../models/userModel.js";

let mongoServer;

beforeAll(async () => {
  await mongoose.disconnect(); 
  
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  await mongoose.connect(uri);
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
  await mongoServer.stop();
});

describe("Integration Tests: Profile and Security Persistence", () => {
  let userToken;
  let testUser;

  const initialUser = {
    name: "Original Name",
    email: "test@example.com",
    password: "password123",
    phone: "12345678",
    address: "Initial Address",
    answer: "Secret",
  };

  it("should successfully register a user and persist credentials for login", async () => {
    await request(app).post("/api/v1/auth/register").send(initialUser);
    
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: initialUser.email, password: initialUser.password });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    userToken = res.body.token; 
    testUser = res.body.user;
  });

  it("should validate that requireSignIn permits access and handles partial profile updates", async () => {
    const blockedRes = await request(app)
      .put("/api/v1/auth/profile")
      .send({ address: "New Address" });
    expect(blockedRes.status).toBe(401);

    const updateRes = await request(app)
      .put("/api/v1/auth/profile")
      .set("Authorization", userToken)
      .send({ address: "Updated Address Only" });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.updatedUser.address).toBe("Updated Address Only");
    
    const dbUser = await userModel.findById(testUser._id);
    expect(dbUser.name).toBe(initialUser.name);
  });

  it("should update userModel via forgotPassword and sync with loginController", async () => {
    const newPassword = "newlyResetPassword456";

    const resetRes = await request(app)
      .post("/api/v1/auth/forgot-password")
      .send({
        email: initialUser.email,
        answer: initialUser.answer,
        newPassword: newPassword,
      });

    expect(resetRes.status).toBe(200);

    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: initialUser.email,
        password: newPassword,
      });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
  });

  it("should synchronize profile password updates with subsequent login attempts", async () => {
    const profilePassword = "profileUpdatePassword789";

    await request(app)
      .put("/api/v1/auth/profile")
      .set("Authorization", userToken)
      .send({ password: profilePassword });

    const finalLogin = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: initialUser.email,
        password: profilePassword,
      });

    expect(finalLogin.status).toBe(200);
    expect(finalLogin.body.user.name).toBe(initialUser.name);
  });

  it("should use isAdmin middleware to block non-admin users from admin routes", async () => {
    const res = await request(app)
      .get("/api/v1/auth/admin-auth")
      .set("Authorization", userToken); 
    
    expect(res.status).toBe(401);
    expect(res.body.message).toBe("UnAuthorized Access");
  });
  
  it("should return 401 status when loginController receives invalid credentials", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "test@example.com", password: "wrongpassword" });
  
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});