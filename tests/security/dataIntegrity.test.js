// Sun Zihan, A0259581R
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../../server.js";
import userModel from "../../models/userModel.js";

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

describe("Security Testing - Data Integrity & Response Auditing", () => {
  
  it("should encrypt passwords with bcrypt and not store plain text", async () => {
    const plainPassword = "password123";
    await request(app)
      .post("/api/v1/auth/register")
      .send({
        name: "Audit User",
        email: "audit@test.com",
        password: plainPassword,
        phone: "12345678",
        address: "Test Lane",
        answer: "green"
      });

    const user = await userModel.findOne({ email: "audit@test.com" });
    
    // Assert: Password is NOT plain text
    expect(user.password).not.toBe(plainPassword);
    // Assert: Password follows Bcrypt format ($2b$10$...)
    expect(user.password).toMatch(/^\$2[ayb]\$10\$.+/); 
  });

  it("should strip sensitive fields from the Login response", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "audit@test.com", password: "password123" });

    // Assert: Fields are stripped
    expect(res.body.user).not.toHaveProperty("password");
    expect(res.body.user).not.toHaveProperty("answer");
    // Assert: Necessary metadata is present
    expect(res.body.user).toHaveProperty("role");
  });

  it("should strip sensitive fields from the Profile Update response", async () => {
    // 1. Get Token
    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "audit@test.com", password: "password123" });
    const token = loginRes.body.token;

    // 2. Update Profile
    const res = await request(app)
      .put("/api/v1/auth/profile")
      .set("Authorization", token)
      .send({ name: "Updated Audit" });

    // Assert: Response Auditing applied
    expect(res.body.updatedUser).not.toHaveProperty("password");
    expect(res.body.updatedUser).not.toHaveProperty("answer");
  });
});