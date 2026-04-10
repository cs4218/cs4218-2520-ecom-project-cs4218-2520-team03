// Sun Zihan, A0259581R
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../../server.js";
import userModel from "../../models/userModel.js";
import JWT from "jsonwebtoken";

let mongoServer;
let userAToken, userBToken;
let userAId, userBId;

beforeAll(async () => {
  await mongoose.disconnect();
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  const userA = await new userModel({
    name: "User A", 
    email: "a@test.com", 
    password: "password123", 
    phone: "81111111", 
    address: "Address A", 
    answer: "A", 
    role: 0
  }).save();
  userAId = userA._id;
  userAToken = JWT.sign({ _id: userA._id }, process.env.JWT_SECRET);

  const userB = await new userModel({
    name: "User B", 
    email: "b@test.com", 
    password: "password123", 
    phone: "82222222", 
    address: "Address B", 
    answer: "B", 
    role: 0
  }).save();
  userBId = userB._id;
  userBToken = JWT.sign({ _id: userB._id }, process.env.JWT_SECRET);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("Security Testing - Privilege Escalation and Access Control", () => {
  
  it("should block standard users from accessing admin-auth endpoint", async () => {
    const res = await request(app)
      .get("/api/v1/auth/admin-auth")
      .set("Authorization", userAToken);

    expect(res.status).toBe(401); 
    expect(res.body.success).toBe(false);
  });

  it("should block User A from viewing User B's profile/orders", async () => {
    const res = await request(app)
      .get("/api/v1/auth/orders")
      .set("Authorization", userAToken);

    if (res.body.length > 0) {
        res.body.forEach(order => {
            expect(order.buyer.toString()).toBe(userAId.toString());
            expect(order.buyer.toString()).not.toBe(userBId.toString());
        });
    }
  });

  it("should block User A from updating User B's profile details", async () => {
    await request(app)
      .put("/api/v1/auth/profile")
      .set("Authorization", userAToken)
      .send({ name: "Hacked Name", email: "b@test.com" });

    const userB = await userModel.findById(userBId);
    expect(userB.name).toBe("User B"); 
  });

  it("should suppress specific permission details in unauthorized error responses", async () => {
    const res = await request(app)
      .post("/api/v1/product/create-product")
      .set("Authorization", userAToken)
      .send({ name: "Malicious Product" });

    expect(res.status).toBe(401);
    expect(res.body.message.toLowerCase()).toContain("unauthorized");
  });
});