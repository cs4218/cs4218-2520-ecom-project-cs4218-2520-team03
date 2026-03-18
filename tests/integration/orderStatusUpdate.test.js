// Chen Zhiruo A0256855N
import { jest } from "@jest/globals";
import request from "supertest";
import mongoose from "mongoose";
import JWT from "jsonwebtoken";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../../server.js";
import userModel from "../../models/userModel.js";
import categoryModel from "../../models/categoryModel.js";
import productModel from "../../models/productModel.js";
import orderModel from "../../models/orderModel.js";

let mongoServer;

beforeAll(async () => {
  await mongoose.disconnect();
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
});

beforeEach(async () => {
  await mongoose.connection.db.dropDatabase();
});

describe("Integration Test for Order Status Update", () => {
  test("updates an order status as admin and retrieves the updated status as buyer", async () => {
    const admin = await userModel.create({
      name: "Admin User",
      email: "admin-order@test.com",
      password: "plain-password",
      phone: "12345678",
      address: "Admin Address",
      answer: "red",
      role: 1,
    });

    const buyer = await userModel.create({
      name: "Buyer User",
      email: "buyer-order@test.com",
      password: "plain-password",
      phone: "87654321",
      address: "Buyer Address",
      answer: "yellow",
      role: 0,
    });

    const adminToken = JWT.sign({ _id: admin._id }, process.env.JWT_SECRET);
    const buyerToken = JWT.sign({ _id: buyer._id }, process.env.JWT_SECRET);

    const category = await categoryModel.create({
      name: "Laptops",
      slug: "laptops",
    });

    const product = await productModel.create({
      name: "Ultrabook 14",
      slug: "ultrabook-14",
      description: "Lightweight laptop",
      price: 1200,
      category: category._id,
      quantity: 5,
      shipping: true,
      photo: {
        data: Buffer.from("fake-image-data"),
        contentType: "image/png",
      },
    });

    const order = await orderModel.create({
      products: [product._id],
      buyer: buyer._id,
      payment: { transactionId: "txn_123" },
      status: "Not Process",
    });

    const updateRes = await request(app)
      .put(`/api/v1/auth/order-status/${order._id}`)
      .set("Authorization", adminToken)
      .send({ status: "Shipped" });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.status).toBe("Shipped");

    const buyerOrdersRes = await request(app)
      .get("/api/v1/auth/orders")
      .set("Authorization", buyerToken);

    expect(buyerOrdersRes.status).toBe(200);
    expect(buyerOrdersRes.body).toHaveLength(1);
    expect(buyerOrdersRes.body[0]._id.toString()).toBe(order._id.toString());
    expect(buyerOrdersRes.body[0].status).toBe("Shipped");
    expect(buyerOrdersRes.body[0].buyer.name).toBe("Buyer User");
    expect(buyerOrdersRes.body[0].products).toHaveLength(1);
    expect(buyerOrdersRes.body[0].products[0].name).toBe("Ultrabook 14");
  });
});