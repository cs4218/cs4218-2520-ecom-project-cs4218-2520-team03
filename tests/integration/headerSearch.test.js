// Chen Peiran, A0257826R
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../../server.js";
import categoryModel from "../../models/categoryModel.js";
import productModel from "../../models/productModel.js";

let mongoServer;
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

const createProduct = async ({
    name,
    price,
    description = "Test description",
    quantity = 10,
    shipping = true,
}) => {
    return await productModel.create({
        name,
        slug: name.toLowerCase().replace(/\s+/g, "-"),
        description,
        price,
        category: category._id,
        quantity,
        shipping,
        photo: {
            data: Buffer.from("fake-image-data"),
            contentType: "image/png",
        },
    });
};

beforeEach(async () => {
    await mongoose.connection.db.dropDatabase();

    category = await categoryModel.create({ name: "General", slug: "general" });

    await createProduct({
        name: "Gaming Laptop",
        price: 1500,
        description: "High performance laptop",
    });

    await createProduct({
        name: "Laptop Stand",
        price: 60,
        description: "Stand for laptop users",
    });

    await createProduct({
        name: "Wireless Mouse",
        price: 40,
        description: "Best laptop accessory for travel",
    });

    await createProduct({
        name: "Cookbook",
        price: 25,
        description: "Recipes for beginners",
    });
});

describe("Backend integration tests for header product search", () => {
    it("returns the correct product for an exact matching keyword", async () => {
        const res = await request(app)
            .get("/api/v1/product/search/Gaming Laptop");

        expect(res.status).toBe(200);

        const names = res.body.map((p) => p.name);
        expect(names).toEqual(["Gaming Laptop"]);
    });

    it("returns matching products for a partial keyword", async () => {
        const res = await request(app)
            .get("/api/v1/product/search/lap");

        expect(res.status).toBe(200);

        const names = res.body.map((p) => p.name).sort();
        expect(names).toEqual(["Gaming Laptop", "Laptop Stand", "Wireless Mouse"]);
    });

    it("returns matching products when the keyword appears in the description", async () => {
        const res = await request(app)
            .get("/api/v1/product/search/travel");

        expect(res.status).toBe(200);

        const names = res.body.map((p) => p.name);
        expect(names).toEqual(["Wireless Mouse"]);
    });

    it("returns an empty result when no products match the keyword", async () => {
        const res = await request(app)
            .get("/api/v1/product/search/phone");

        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
    });

    it("does not return unrelated products", async () => {
        const res = await request(app)
            .get("/api/v1/product/search/laptop");

        expect(res.status).toBe(200);

        const names = res.body.map((p) => p.name);
        expect(names).toEqual(["Gaming Laptop", "Laptop Stand", "Wireless Mouse"]);
    });
});