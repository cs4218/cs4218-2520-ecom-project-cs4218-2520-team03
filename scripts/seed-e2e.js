import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import bcrypt from "bcrypt";
import slugify from "slugify";

import userModel from "../models/userModel.js";
import categoryModel from "../models/categoryModel.js";
import productModel from "../models/productModel.js";

if (!process.env.MONGO_URL) {
  throw new Error("MONGO_URL is required");
}

const ONE_BY_ONE_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO9Ww8kAAAAASUVORK5CYII=";

const SEED_USERS = [
  {
    name: "user",
    email: "user@gmail.com",
    password: "123456",
    phone: "12345678",
    address: "123",
    answer: "123",
    role: 0,
  },
  {
    name: "admin",
    email: "admin@gmail.com",
    password: "123456",
    phone: "12345678",
    address: "123",
    answer: "123",
    role: 1,
  },
  {
    name: "CS 4218 Test Account",
    email: "cs4218@test.com",
    password: "cs4218@test.com",
    phone: "12345678",
    address: "123",
    answer: "123",
    role: 1,
  }
];

const SEED_CATEGORIES = [
  "Electronics",
  "Sports",
  "Books",
  "Fitness",
  "Home",
];

const SEED_PRODUCTS = [
  {
    name: "Pocket Notebook",
    slug: "pocket-notebook",
    description: "Seed product for low-price and category filter flows.",
    price: 15,
    categoryName: "Books",
    quantity: 30,
    shipping: false,
  },
  {
    name: "Wireless Mouse Alpha",
    slug: "wireless-mouse-alpha",
    description: "Seed product for search and medium-price filter flows.",
    price: 49,
    categoryName: "Electronics",
    quantity: 15,
    shipping: true,
  },
  {
    name: "Resistance Band Set",
    slug: "resistance-band-set",
    description: "Seed product for fitness and price filter flows.",
    price: 69,
    categoryName: "Fitness",
    quantity: 12,
    shipping: true,
  },
  {
    name: "Desk Lamp Pro",
    slug: "desk-lamp-pro",
    description: "Seed product for home category and upper-mid price flows.",
    price: 89,
    categoryName: "Home",
    quantity: 8,
    shipping: true,
  },
  {
    name: "Smart Watch Ultra",
    slug: "smart-watch-ultra",
    description: "Seed product for 100-plus price range flows.",
    price: 149,
    categoryName: "Electronics",
    quantity: 6,
    shipping: true,
  },
  {
    name: "Expensive Laptop",
    slug: "expensive-laptop",
    description: "Seed product for high-price filter flows.",
    price: 1000,
    categoryName: "Sports",
    quantity: 100,
    shipping: true,
  },
  {
    name: "Sports Bottle Zero",
    slug: "sports-bottle-zero",
    description: "Out-of-stock seed product for stock-state flows.",
    price: 19,
    categoryName: "Sports",
    quantity: 0,
    shipping: true,
  },
  {
    name: "E2E Test Delete Product",
    slug: "e2e-test-delete-product",
    description: "Test product for admin delete",
    price: 88,
    categoryName: "Electronics",
    quantity: 10,
    shipping: true,
  },
  {
    name: "Old E2E Test Update Product",
    slug: "old-e2e-test-update-product",
    description: "Test product for admin update",
    price: 39,
    categoryName: "Electronics",
    quantity: 10,
    shipping: true,
  },
  {
    // Seed this last so it becomes the newest product and appears first
    name: "Test Product",
    slug: "test-product",
    description: "Stable seed product used by Playwright e2e flows.",
    price: 25,
    categoryName: "Sports",
    quantity: 20,
    shipping: true,
  },
];

async function seedUsers() {
  for (const user of SEED_USERS) {
    const hashedPassword = await bcrypt.hash(user.password, 10);

    await userModel.findOneAndUpdate(
      { email: user.email },
      {
        name: user.name,
        email: user.email,
        password: hashedPassword,
        phone: user.phone,
        address: user.address,
        answer: user.answer,
        role: user.role,
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );
  }
}

async function seedCategories() {
  for (const name of SEED_CATEGORIES) {
    await categoryModel.findOneAndUpdate(
      { name },
      {
        name,
        slug: slugify(name, { lower: true, strict: true }),
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );
  }
}

async function seedProducts() {
  const slugs = SEED_PRODUCTS.map((p) => p.slug);

  await productModel.deleteMany({ slug: { $in: slugs } });

  const categories = await categoryModel.find({
    name: { $in: SEED_CATEGORIES },
  });

  const categoryMap = new Map(categories.map((c) => [c.name, c._id]));
  const photoBuffer = Buffer.from(ONE_BY_ONE_PNG_BASE64, "base64");

  for (const product of SEED_PRODUCTS) {
    const categoryId = categoryMap.get(product.categoryName);

    if (!categoryId) {
      throw new Error(`Missing category for product: ${product.name}`);
    }

    await productModel.create({
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: product.price,
      category: categoryId,
      quantity: product.quantity,
      shipping: product.shipping,
      photo: {
        data: photoBuffer,
        contentType: "image/png",
      },
    });
  }
}

async function main() {
  await mongoose.connect(process.env.MONGO_URL);

  await seedUsers();
  await seedCategories();
  await seedProducts();

  console.log("E2E seed complete");
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});