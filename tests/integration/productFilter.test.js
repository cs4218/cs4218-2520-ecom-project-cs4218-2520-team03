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
let clothing;

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

    books = await categoryModel.create({ name: "Books", slug: "books" });
    electronics = await categoryModel.create({ name: "Electronics", slug: "electronics" });
    clothing = await categoryModel.create({ name: "Clothing", slug: "clothing" });
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

describe("Backend integration tests for homepage product filters", () => {
    it("returns only products from one selected category", async () => {
        await createProduct({ name: "Book A", price: 20, category: books._id });
        await createProduct({ name: "Book B", price: 59, category: books._id });
        await createProduct({ name: "Laptop", price: 900, category: electronics._id });

        const res = await request(app)
            .post("/api/v1/product/product-filters")
            .send({
                checked: [books._id.toString()],
                radio: [],
            });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);

        const names = res.body.products.map((p) => p.name).sort();
        expect(names).toEqual(["Book A", "Book B"]);
    });

    it("returns products from multiple selected categories", async () => {
        await createProduct({ name: "Book A", price: 20, category: books._id });
        await createProduct({ name: "Laptop", price: 900, category: electronics._id });
        await createProduct({ name: "Shirt", price: 40, category: clothing._id });

        const res = await request(app)
            .post("/api/v1/product/product-filters")
            .send({
                checked: [books._id.toString(), electronics._id.toString()],
                radio: [],
            });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);

        const names = res.body.products.map((p) => p.name).sort();
        expect(names).toEqual(["Book A", "Laptop"]);
    });

    it("returns only products within the selected price range", async () => {
        await createProduct({ name: "Book A", price: 20, category: books._id });
        await createProduct({ name: "Book B", price: 59, category: books._id });
        await createProduct({ name: "Laptop", price: 900, category: electronics._id });
        await createProduct({ name: "Shirt", price: 40, category: clothing._id });

        const res = await request(app)
            .post("/api/v1/product/product-filters")
            .send({
                checked: [],
                radio: [40, 59],
            });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);

        const names = res.body.products.map((p) => p.name).sort();
        expect(names).toEqual(["Book B", "Shirt"]);
    });

    it("returns only products satisfying both category and price filters", async () => {
        await createProduct({ name: "Book A", price: 20, category: books._id });
        await createProduct({ name: "Book B", price: 59, category: books._id });
        await createProduct({ name: "Shirt", price: 40, category: clothing._id });

        const res = await request(app)
            .post("/api/v1/product/product-filters")
            .send({
                checked: [books._id.toString()],
                radio: [40, 59],
            });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);

        expect(res.body.products).toHaveLength(1);
        expect(res.body.products[0].name).toBe("Book B");
    });

    it("returns all products when no filters are selected", async () => {
        await createProduct({ name: "Book A", price: 20, category: books._id });
        await createProduct({ name: "Book B", price: 59, category: books._id });
        await createProduct({ name: "Laptop", price: 900, category: electronics._id });
        await createProduct({ name: "Shirt", price: 40, category: clothing._id });

        const res = await request(app)
            .post("/api/v1/product/product-filters")
            .send({
                checked: [],
                radio: [],
            });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);

        const names = res.body.products.map((p) => p.name).sort();
        expect(names).toEqual(["Book A", "Book B", "Laptop", "Shirt"]);
    });
});