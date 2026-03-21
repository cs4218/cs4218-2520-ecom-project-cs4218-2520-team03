// Chen Peiran, A0257826R
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../../server.js";
import categoryModel from "../../models/categoryModel.js";
import productModel from "../../models/productModel.js";

let mongoServer;
let books;
let electronics;

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
    category,
    description = "Test description",
    quantity = 10,
    shipping = true,
}) => {
    return await productModel.create({
        name,
        slug: name.toLowerCase().replace(/\s+/g, "-"),
        description,
        price,
        category,
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

    books = await categoryModel.create({ name: "Books", slug: "books" });
    electronics = await categoryModel.create({ name: "Electronics", slug: "electronics" });

    await createProduct({
        name: "Book A",
        price: 20,
        category: books._id,
    });

    await createProduct({
        name: "Book B",
        price: 50,
        category: books._id,
    });

    await createProduct({
        name: "Laptop",
        price: 900,
        category: electronics._id,
    });
});

describe("Backend integration tests for header category dropdown", () => {
    it("returns the correct category for a valid slug", async () => {
        const res = await request(app)
            .get("/api/v1/category/single-category/books");

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.category.name).toBe("Books");
        expect(res.body.category.slug).toBe("books");
    });

    it("returns only products belonging to the requested category slug", async () => {
        const res = await request(app)
            .get("/api/v1/product/product-category/books");

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.category.name).toBe("Books");

        const names = res.body.products.map((p) => p.name).sort();
        expect(names).toEqual(["Book A", "Book B"]);
    });

    it("returns an empty category for an invalid single-category slug", async () => {
        const res = await request(app)
            .get("/api/v1/category/single-category/fashion");

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.category).toBe(null);
    });

    it("returns 404 when requesting products for an invalid category slug", async () => {
        const res = await request(app)
            .get("/api/v1/product/product-category/fashion");

        expect(res.status).toBe(404);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("Category not found");
    });
});