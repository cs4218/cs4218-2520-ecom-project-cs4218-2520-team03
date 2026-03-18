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

let mongoServer;
let admin;
let adminToken;
let category;

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
  admin = await userModel.create({
    name: "Admin User",
    email: "admin-update-details@test.com",
    password: "plain-password",
    phone: "12345678",
    address: "Admin Address",
    answer: "blue",
    role: 1,
  });

  adminToken = JWT.sign({ _id: admin._id }, process.env.JWT_SECRET);

  category = await categoryModel.create({
    name: "Electronics",
    slug: "electronics",
  });
});

describe("Integration tests for Admin Product Update", () => {
  test("updated product details are returned by product details API", async () => {
    const product = await productModel.create({
      name: "Old Headphones",
      slug: "old-headphones",
      description: "Old wired headphones",
      price: 50,
      category: category._id,
      quantity: 10,
      shipping: true,
      photo: {
        data: Buffer.from("fake-image-data"),
        contentType: "image/png",
      },
    });

    const updateRes = await request(app)
      .put(`/api/v1/product/update-product/${product._id}`)
      .set("authorization", adminToken)
      .field("name", "Wireless Headphones Pro")
      .field("description", "Upgraded noise-cancelling headphones")
      .field("price", "99")
      .field("category", category._id.toString())
      .field("quantity", "25")
      .field("shipping", "true");

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.success).toBe(true);
    expect(updateRes.body.products.slug).toBe("wireless-headphones-pro");

    const detailsRes = await request(app)
      .get("/api/v1/product/get-product/wireless-headphones-pro");

    expect(detailsRes.status).toBe(200);
    expect(detailsRes.body.success).toBe(true);
    expect(detailsRes.body.product.name).toBe("Wireless Headphones Pro");
    expect(detailsRes.body.product.description).toBe(
      "Upgraded noise-cancelling headphones",
    );
    expect(detailsRes.body.product.price).toBe(99);
    expect(detailsRes.body.product.quantity).toBe(25);
    expect(detailsRes.body.product.category.name).toBe("Electronics");
  });
  test("updated product is returned by search API", async () => {
    const product = await productModel.create({
      name: "Basic Mouse",
      slug: "basic-mouse",
      description: "Standard office mouse",
      price: 20,
      category: category._id,
      quantity: 30,
      shipping: true,
      photo: {
        data: Buffer.from("fake-image-data"),
        contentType: "image/png",
      },
    });

    const updateRes = await request(app)
      .put(`/api/v1/product/update-product/${product._id}`)
      .set("authorization", adminToken)
      .field("name", "Gaming Mouse X")
      .field("description", "RGB precision sensor for esports players")
      .field("price", "45")
      .field("category", category._id.toString())
      .field("quantity", "35")
      .field("shipping", "true");

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.success).toBe(true);

    const searchByNameRes = await request(app)
      .get("/api/v1/product/search/gaming");

    expect(searchByNameRes.status).toBe(200);
    expect(searchByNameRes.body).toHaveLength(1);
    expect(searchByNameRes.body[0].name).toBe("Gaming Mouse X");

    const searchByDescriptionRes = await request(app)
      .get("/api/v1/product/search/esports");

    expect(searchByDescriptionRes.status).toBe(200);
    expect(searchByDescriptionRes.body).toHaveLength(1);
    expect(searchByDescriptionRes.body[0].description).toBe(
      "RGB precision sensor for esports players",
    );
  });
});
