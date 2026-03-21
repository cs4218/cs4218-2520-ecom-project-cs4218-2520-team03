// Trinh Hoai Song Thu, A0266248W
import { jest } from "@jest/globals";

jest.mock("braintree", () => ({
  BraintreeGateway: jest.fn(() => ({
    clientToken: {
      generate: jest.fn((options, callback) => {
        if (callback) return callback(null, { clientToken: "fake_token" });
        return Promise.resolve({ clientToken: "fake_token" });
      }),
    },
    transaction: {
      sale: jest.fn((payload, callback) => {
        const result = {
          success: true,
          transaction: { id: "mock_trans_123" },
        };
        if (callback) return callback(null, result);
        return Promise.resolve(result);
      }),
    },
  })),
  Environment: { Sandbox: "Sandbox", Production: "Production" },
}));

import request from "supertest";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import path from "path";
import fs from "fs";
import { MongoMemoryServer } from "mongodb-memory-server";

import app from "../../server.js";
import User from "../../models/userModel.js";
import Category from "../../models/categoryModel.js";
import Product from "../../models/productModel.js";
import Order from "../../models/orderModel.js";

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
}, 15000);

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
  await Category.deleteMany({});
  await Product.deleteMany({});
  await Order.deleteMany({});

  const hashedAdminPassword = await bcrypt.hash("Admin@123", 10);
  const hashedUserPassword = await bcrypt.hash("User@123", 10);

  await User.create({
    name: "Admin",
    email: "admin@test.com",
    password: hashedAdminPassword,
    phone: "12345678",
    address: "Singapore",
    answer: "football",
    role: 1,
  });

  await User.create({
    name: "John Doe",
    email: "johndoe@gmail.com",
    password: hashedUserPassword,
    phone: "87654321",
    address: "123 User Street",
    answer: "basketball",
    role: 0,
  });
});

async function createCategoryAndProduct(adminToken) {
  const categoryRes = await request(app)
    .post("/api/v1/category/create-category")
    .set("Authorization", adminToken)
    .send({ name: "Test Category" });

  const categoryId = categoryRes.body.category._id;

  // Note: Ensure this path exists or mock the FS read
  const photoPath = path.join(process.cwd(), "client/public/images/a1.png");
  if (!fs.existsSync(photoPath)) {
    // Create a dummy file if it doesn't exist for the test
    fs.mkdirSync(path.dirname(photoPath), { recursive: true });
    fs.writeFileSync(photoPath, "fake image data");
  }

  const productRes = await request(app)
    .post("/api/v1/product/create-product")
    .set("Authorization", adminToken)
    .field("name", "Test Product")
    .field("slug", "test-product")
    .field("description", "A product for integration test")
    .field("price", "25")
    .field("category", categoryId)
    .field("quantity", "10")
    .field("shipping", "true")
    .attach("photo", photoPath);

  return productRes.body.products;
}

describe("Admin view order integration flow", () => {
  test("user place an order -> admin check updated orders", async () => {
    // 1) Admin login
    const adminLogin = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "admin@test.com", password: "Admin@123" });
    const adminToken = adminLogin.body.token;
    const product = await createCategoryAndProduct(adminToken);

    // 2) User login
    const userLogin = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "johndoe@gmail.com", password: "User@123" });
    const userToken = userLogin.body.token;
    const userId = userLogin.body.user._id;

    // 3) Execute Payment
    const btTokenRes = await request(app)
      .get("/api/v1/product/braintree/token")
      .set("Authorization", `Bearer ${userToken}`);
    expect(btTokenRes.statusCode).toBe(200);

    const paymentRes = await request(app)
      .post("/api/v1/product/braintree/payment")
      .set("Authorization", userToken)
      .send({ 
        nonce: "fake-valid-nonce", 
        cart: [{ _id: product._id, name: product.name, description: product.description, price: product.price }] 
      });

    expect(paymentRes.statusCode).toBe(200);

    // 4) Admin views all orders
    const allOrdersRes = await request(app)
      .get("/api/v1/auth/all-orders")
      .set("Authorization", adminToken);

    expect(allOrdersRes.statusCode).toBe(200);
    expect(Array.isArray(allOrdersRes.body)).toBe(true);
    
    const hasOrder = allOrdersRes.body.some(o => o.buyer?._id === userId || o.buyer === userId);
    expect(hasOrder).toBe(true);
  });

  test("user place an order -> validate product stock decreases", async () => {
    const adminLogin = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "admin@test.com", password: "Admin@123" });
    const adminToken = adminLogin.body.token;
    const product = await createCategoryAndProduct(adminToken);

    const userLogin = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "johndoe@gmail.com", password: "User@123" });
    const userToken = userLogin.body.token;

    // 1. Create order
    await request(app)
      .post("/api/v1/product/braintree/payment")
      .set("Authorization", userToken)
      .send({ nonce: "test-nonce", cart: [{ _id: product._id, name: product.name, description: product.description, price: product.price }]  });

    // 2.Verify updated product quantity
    const getProductRes = await request(app).get(`/api/v1/product/get-product/${product.slug}`);
    expect(getProductRes.body.product.quantity).toBe(9);
  });
});