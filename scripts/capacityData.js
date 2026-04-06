// Trinh Hoai Song Thu, A0266248W
// This script is used to seed and cleanup test data for capacity testing.
// It can seed 300 users for login tests and 10 products for home page tests.
// Usage:
//   node capacityData.js seed-users
//   node capacityData.js cleanup-users
//   node capacityData.js seed-products
//   node capacityData.js cleanup-products

import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcrypt";

import User from "../models/userModel.js";
import Product from "../models/productModel.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URL;

const TOTAL_USERS = 300;
const PASSWORD_PLAIN = "Password123!";

const TOTAL_PRODUCTS = 10;
const PRODUCT_PREFIX = "capacityproduct";

async function connectDB() {
  if (!MONGO_URI) {
    throw new Error("Missing MONGO_URL in .env");
  }
  await mongoose.connect(MONGO_URI);
}

async function disconnectDB() {
  await mongoose.disconnect();
}

async function seedUsers() {
  await connectDB();

  try {
    const hashedPassword = await bcrypt.hash(PASSWORD_PLAIN, 10);

    const users = Array.from({ length: TOTAL_USERS }, (_, i) => ({
      name: `Capacity Test User ${i + 1}`,
      email: `logincapacity_${i + 1}@test.com`,
      password: hashedPassword,
      phone: "12345678",
      address: {
        street: "Test Street",
        city: "Singapore",
        zip: "123456",
      },
      answer: "test-answer",
      role: 1,
    }));

    const result = await User.insertMany(users, { ordered: false });

    console.log(`Inserted ${result.length} test users`);
    console.log(`Password: ${PASSWORD_PLAIN}`);
  } catch (err) {
    console.error("User seeding failed:", err.message);
  } finally {
    await disconnectDB();
  }
}

async function cleanupUsers() {
  await connectDB();

  try {
    const result = await User.deleteMany({
      email: { $regex: "^capacitytest_" },
    });

    console.log(`Deleted ${result.deletedCount} test users`);
  } catch (err) {
    console.error("User cleanup failed:", err.message);
  } finally {
    await disconnectDB();
  }
}

async function seedProducts() {
  await connectDB();

  try {
    // get any existing category
    const categoryDoc = await mongoose.connection.db
      .collection("categories")
      .findOne({}, { projection: { _id: 1 } });

    if (!categoryDoc) {
      throw new Error(
        "No category found in DB. Please create a category first."
      );
    }

    const categoryId = categoryDoc._id;

    // tiny placeholder image
    const photoBuffer = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9WlH0pQAAAAASUVORK5CYII=",
      "base64"
    );

    const products = Array.from({ length: TOTAL_PRODUCTS }, (_, i) => ({
      name: `Capacity Product ${i + 1}`,
      slug: `${PRODUCT_PREFIX}-${i + 1}`,
      description: "Product used for capacity testing.",
      price: 10 + i,
      category: categoryId,
      quantity: 100,
      photo: {
        data: photoBuffer,
        contentType: "image/png",
      },
      shipping: true,
    }));

    const result = await Product.insertMany(products, { ordered: false });

    console.log(`Inserted ${result.length} capacity test products`);
  } catch (err) {
    console.error("Product seeding failed:", err.message);
  } finally {
    await disconnectDB();
  }
}


async function cleanupProducts() {
  await connectDB();

  try {
    const result = await Product.deleteMany({
      slug: { $regex: `^${PRODUCT_PREFIX}-` },
    });

    console.log(`Deleted ${result.deletedCount} test products`);
  } catch (err) {
    console.error("Product cleanup failed:", err.message);
  } finally {
    await disconnectDB();
  }
}

const command = process.argv[2];

switch (command) {
  case "seed-users":
    seedUsers();
    break;

  case "cleanup-users":
    cleanupUsers();
    break;

  case "seed-products":
    seedProducts();
    break;

  case "cleanup-products":
    cleanupProducts();
    break;

  default:
    console.log(`
Usage:

Seed login users
node capacityData.js seed-users

Cleanup login users
node capacityData.js cleanup-users

Seed products
node capacityData.js seed-products

Cleanup products
node capacityData.js cleanup-products
`);
}