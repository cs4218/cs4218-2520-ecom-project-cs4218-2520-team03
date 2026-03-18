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

describe("Integration tests for Admin Product Delete", () => {
  test("deletes a product and removes it from the product listing", async () => {
    const admin = await userModel.create({
      name: "Admin User",
      email: "admin-delete@test.com",
      password: "plain-password",
      phone: "12345678",
      address: "Admin Address",
      answer: "purple",
      role: 1,
    });

    const adminToken = JWT.sign({ _id: admin._id }, process.env.JWT_SECRET);

    const category = await categoryModel.create({
      name: "Home Appliances",
      slug: "home-appliances",
    });

    const deletedProduct = await productModel.create({
      name: "Old Blender",
      slug: "old-blender",
      description: "To be deleted",
      price: 80,
      category: category._id,
      quantity: 4,
      shipping: true,
      photo: {
        data: Buffer.from("fake-image-data"),
        contentType: "image/png",
      },
    });

    await productModel.create({
      name: "Rice Cooker",
      slug: "rice-cooker",
      description: "Should remain in listing",
      price: 120,
      category: category._id,
      quantity: 6,
      shipping: true,
      photo: {
        data: Buffer.from("fake-image-data"),
        contentType: "image/png",
      },
    });

    const deleteRes = await request(app)
      .delete(`/api/v1/product/delete-product/${deletedProduct._id}`)
      .set("Authorization", adminToken);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.success).toBe(true);
    const listRes = await request(app)
      .get("/api/v1/product/get-product?page=1&perPage=12");

    expect(listRes.status).toBe(200);
    expect(listRes.body.success).toBe(true);
    expect(listRes.body.total).toBe(1);
    expect(listRes.body.products).toHaveLength(1);
    expect(listRes.body.products[0].name).toBe("Rice Cooker");
    expect(
      listRes.body.products.some(
        (product) => product._id.toString() === deletedProduct._id.toString(),
      ),
    ).toBe(false);
  });
});