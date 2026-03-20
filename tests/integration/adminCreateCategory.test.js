// Trinh Hoai Song Thu, A0266248W
import request from "supertest";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { MongoMemoryServer } from "mongodb-memory-server";

import app from "../../server.js";
import User from "../../models/userModel.js";
import Category from "../../models/categoryModel.js";
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

  const hashedPassword = await bcrypt.hash("Admin@123", 10);

  await User.create({
    name: "Admin",
    email: "admin@test.com",
    password: hashedPassword,
    phone: "12345678",
    address: "Singapore",
    answer: "football",
    role: 1,
  });
});

describe("Admin category integration flow: positive", () => {
  test("Login with admin -> Create Category -> Validate category display on category list", async () => {
    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: "admin@test.com",
        password: "Admin@123",
      });

    expect(loginRes.statusCode).toBe(200);
    expect(loginRes.body.token).toBeDefined();

    const token = loginRes.body.token;
    const categoryName = "Electronics";

    const createRes = await request(app)
      .post("/api/v1/category/create-category")
      .set("Authorization", token)
      .send({
        name: categoryName,
      });

    expect(createRes.statusCode).toBe(201);
    expect(createRes.body.success).toBe(true);

    const listRes = await request(app)
      .get("/api/v1/category/get-category");

    expect(listRes.statusCode).toBe(200);
    expect(listRes.body.success).toBe(true);

    const categories = listRes.body.category || [];
    expect(categories.some((c) => c.name === categoryName)).toBe(true);
  });
});

describe("Admin category integration flow: negative", () => {
    test("Login with admin -> Create Category with empty name -> Validate error response", async () => {
       const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: "admin@test.com",
        password: "Admin@123",
      });

    expect(loginRes.statusCode).toBe(200);
    expect(loginRes.body.token).toBeDefined();

    const token = loginRes.body.token;
    const categoryName = "";
    const createRes = await request(app)
      .post("/api/v1/category/create-category")
      .set("Authorization", token)
      .send({
        name: categoryName,
      });

    expect(createRes.statusCode).toBe(400);
    expect(createRes.body.success).toBe(false);
    expect(createRes.body.message).toBe("Name is required");
    });

    test("Login with admin -> Create Category with duplicate name -> Validate error response", async () => {
       const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: "admin@test.com",
        password: "Admin@123",
      });

    expect(loginRes.statusCode).toBe(200);
    expect(loginRes.body.token).toBeDefined();

    const token = loginRes.body.token;
    const categoryName = "Electronics";

    const createRes1 = await request(app)
      .post("/api/v1/category/create-category")
      .set("Authorization", token)
      .send({
        name: categoryName,
      });

    expect(createRes1.statusCode).toBe(201);
    expect(createRes1.body.success).toBe(true);

    const createRes2 = await request(app)
      .post("/api/v1/category/create-category")
      .set("Authorization", token)
      .send({
        name: categoryName,
      });

    expect(createRes2.statusCode).toBe(409);
    expect(createRes2.body.success).toBe(false);
    expect(createRes2.body.message).toBe("Category Already Exists");
  });
});

describe("Admin category update flow", () => {
  test("Login with admin -> Create Category -> Update Category with empty name -> Validate error response", async () => {
    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: "admin@test.com",
        password: "Admin@123",
      });
    expect(loginRes.statusCode).toBe(200);
    expect(loginRes.body.token).toBeDefined();

    const token = loginRes.body.token;
    const categoryName = "Books";
    
    const createRes = await request(app)
      .post("/api/v1/category/create-category")
      .set("Authorization", token)
      .send({
        name: categoryName,
      });

    expect(createRes.statusCode).toBe(201);
    expect(createRes.body.success).toBe(true);

    const categoryId = createRes.body.category._id;

    const updateRes = await request(app)
      .put(`/api/v1/category/update-category/${categoryId}`)
      .set("Authorization", token)
      .send({
        name: "",
      });

    expect(updateRes.statusCode).toBe(400);
    expect(updateRes.body.success).toBe(false);
    expect(updateRes.body.message).toBe("Name is required");
  });

  test("Login with admin -> Create Category -> Update Category with valid name -> Validate updated category", async () => {
    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: "admin@test.com",
        password: "Admin@123",
      });
    expect(loginRes.statusCode).toBe(200);
    expect(loginRes.body.token).toBeDefined();

    const token = loginRes.body.token;
    const categoryName = "Clothing";
    
    const createRes = await request(app)
      .post("/api/v1/category/create-category")
      .set("Authorization", token)
      .send({
        name: categoryName,
      });

    expect(createRes.statusCode).toBe(201);
    expect(createRes.body.success).toBe(true);

    const categoryId = createRes.body.category._id;
    const updatedName = "Apparel";

    const updateRes = await request(app)
      .put(`/api/v1/category/update-category/${categoryId}`)
      .set("Authorization", token)
      .send({
        name: updatedName,
      });

    expect(updateRes.statusCode).toBe(200);
    expect(updateRes.body.success).toBe(true);
    expect(updateRes.body.category.name).toBe(updatedName); 
});
});

describe("Admin category delete flow", () => {
  test("Login with admin -> Create Category -> Delete Category -> Validate success response -> Validate category is removed from category list", async () => {
    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: "admin@test.com",
        password: "Admin@123",
      });
    expect(loginRes.statusCode).toBe(200);
    expect(loginRes.body.token).toBeDefined();

    const token = loginRes.body.token;
    const categoryName = "Toys";

    const createRes = await request(app)
      .post("/api/v1/category/create-category")
      .set("Authorization", token)
      .send({
        name: categoryName,
      });

    expect(createRes.statusCode).toBe(201);
    expect(createRes.body.success).toBe(true);

    const categoryId = createRes.body.category._id;

    const deleteRes = await request(app)
      .delete(`/api/v1/category/delete-category/${categoryId}`)
      .set("Authorization", token);

    expect(deleteRes.statusCode).toBe(200);
    expect(deleteRes.body.success).toBe(true);
    expect(deleteRes.body.message).toBe("Categry Deleted Successfully");

    const listRes = await request(app)
      .get("/api/v1/category/get-category");

    expect(listRes.statusCode).toBe(200);
    expect(listRes.body.success).toBe(true);

    const categories = listRes.body.category || [];
    expect(categories.some((c) => c._id === categoryId)).toBe(false);
  });
  
}); 
