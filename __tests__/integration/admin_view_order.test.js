import request from "supertest";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import path from "path";
import fs from "fs";
import { MongoMemoryServer } from "mongodb-memory-server";

import app from "../../app.js";
import User from "../../models/userModel.js";
import Category from "../../models/categoryModel.js";
import Product from "../../models/productModel.js";
import Order from "../../models/orderModel.js";
import { describe } from "node:test";

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
  await Category.deleteMany({});
  await Product.deleteMany({});

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

// helper to create a product to purchase (requires admin)
async function createCategoryAndProduct(adminToken) {
  // create category
  const categoryRes = await request(app)
    .post("/api/v1/category/create-category")
    .set("Authorization", adminToken)
    .send({ name: "Test Category" });
  expect(categoryRes.statusCode).toBe(201);
  const categoryId = categoryRes.body.category._id;

  // create a product with photo using multipart form-data
  const photoPath = path.join(process.cwd(), "client/public/images/a1.png");
  expect(fs.existsSync(photoPath)).toBe(true);

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

  expect(productRes.statusCode).toBe(201);
  const product = productRes.body.products;
  const productId = product?._id;
  return { productId, product };
}

describe("Admin view order integration flow", () => {
  test("user place an order -> user log out -> admin log in -> check updated orders in all orders", async () => {
    // 1) login admin to seed product
    const adminLogin = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "admin@test.com", password: "Admin@123" });
    expect(adminLogin.statusCode).toBe(200);
    const adminToken = adminLogin.body.token;

    const { product } = await createCategoryAndProduct(adminToken);
    

    // 2) user login
    const userLogin = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "johndoe@gmail.com", password: "User@123" });
    expect(userLogin.statusCode).toBe(200);
    const userToken = userLogin.body.token;

    // 3) Get braintree token (will hit sandbox, we only need 200 or token structure)
    const btTokenRes = await request(app).get(
      "/api/v1/product/braintree/token",
    );
    expect([200, 500]).toContain(btTokenRes.statusCode);

    // 4) Create order by calling payment endpoint with a fake nonce and cart containing the product
    const paymentRes = await request(app)
      .post("/api/v1/product/braintree/payment")
      .set("Authorization", userToken)
      .send({ nonce: "fake-valid-nonce", cart: [
        { _id: product._id, name: product.name, description: product.description, price: product.price },
      ] });

    // The real controller talks to braintree; depending on env vars it may fail. Accept 200 or 500. If 500, insert an order directly to continue flow validation.
    expect(paymentRes.statusCode).toBe(200);

    // 5) user should have an order (either via successful payment or mock insert)
    const userOrders = await request(app)
      .get("/api/v1/auth/orders")
      .set("Authorization", userToken);
    expect(userOrders.statusCode).toBe(200);
    // authController returns array directly
    expect(Array.isArray(userOrders.body)).toBe(true);
    expect(userOrders.body.length).toBeGreaterThan(0);

    // 6) admin logs in and views all orders
    const adminLogin2 = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "admin@test.com", password: "Admin@123" });
    const adminToken2 = adminLogin2.body.token;

    const allOrders = await request(app)
      .get("/api/v1/auth/all-orders")
      .set("Authorization", adminToken2);
    expect(allOrders.statusCode).toBe(200);
    expect(Array.isArray(allOrders.body)).toBe(true);
    // ensure at least one order belongs to the user
    const hasUserOrder = allOrders.body.some(
      (o) => o?.buyer && o.buyer._id === userLogin.body.user._id,
    );
    expect(hasUserOrder).toBe(true);
  });


  test("user place an order -> user log out -> admin log in -> validate product stock decreases", async () => {
    // 1) login admin to seed product
    const adminLogin = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "admin@test.com", password: "Admin@123" });
    expect(adminLogin.statusCode).toBe(200);
    const adminToken = adminLogin.body.token;

    const { product } = await createCategoryAndProduct(adminToken);

    // 2) user login
    const userLogin = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "johndoe@gmail.com", password: "User@123" });
    expect(userLogin.statusCode).toBe(200);
    const userToken = userLogin.body.token;

    // 3) Get braintree token (will hit sandbox, we only need 200 or token structure)
    const btTokenRes = await request(app).get(
      "/api/v1/product/braintree/token",
    );
    expect([200, 500]).toContain(btTokenRes.statusCode);

    // 4) Create order by calling payment endpoint with a fake nonce and cart containing the product
    const paymentRes = await request(app)
      .post("/api/v1/product/braintree/payment")
      .set("Authorization", userToken)
      .send({ nonce: "fake-valid-nonce", cart: [
        { _id: product._id, name: product.name, description: product.description, price: product.price },
      ] });

    // The real controller talks to braintree; depending on env vars it may fail. Accept 200 or 500. If 500, insert an order directly to continue flow validation.
    expect(paymentRes.statusCode).toBe(200);

    // 5) user should have an order (either via successful payment or mock insert)
    const userOrders = await request(app)
      .get("/api/v1/auth/orders")
      .set("Authorization", userToken);
    expect(userOrders.statusCode).toBe(200);
    // authController returns array directly
    expect(Array.isArray(userOrders.body)).toBe(true);
    expect(userOrders.body.length).toBeGreaterThan(0);

    // 6) admin logs in and views all orders
    const adminLogin2 = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "admin@test.com", password: "Admin@123" });
    const adminToken2 = adminLogin2.body.token;

    const allProducts = await request(app)
      .get("/api/v1/product/get-product")
      .set("Authorization", adminToken2);
    expect(allProducts.statusCode).toBe(200);
    expect(Array.isArray(allProducts.body.products)).toBe(true);
    const updatedProduct = allProducts.body.products.find((p) => p._id === product._id);
    expect(updatedProduct).toBeDefined();
    expect(updatedProduct.quantity).toBe(9);
  });
});


describe()