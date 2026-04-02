// Sun Zihan, A0259581R
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../../server.js";
import JWT from "jsonwebtoken";

let mongoServer;
const SECRET = process.env.JWT_SECRET || "test_secret";

beforeAll(async () => {
  await mongoose.disconnect();
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("Security Testing - JWT Integrity and Session Persistence", () => {
  
it("should reject unauthenticated requests that attempt to bypass signature verification", async () => {
    const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64").replace(/=/g, "");
    const payload = Buffer.from(JSON.stringify({ _id: "123" })).toString("base64").replace(/=/g, "");
    const noneToken = `${header}.${payload}.`; 
    const res = await request(app)
      .get("/api/v1/auth/user-auth")
      .set("Authorization", noneToken);

    expect(res.status).toBe(401);
  });

  it("should reject expired JWT tokens", async () => {
    const expiredToken = JWT.sign(
      { _id: "123" }, 
      SECRET, 
      { expiresIn: "-1h" }
    );

    const res = await request(app)
      .get("/api/v1/auth/user-auth")
      .set("Authorization", expiredToken);

    expect(res.status).toBe(401);
  });

  it("should reject malformed or tampered JWT strings", async () => {
    const validToken = JWT.sign({ _id: "123" }, SECRET);
    const tamperedToken = validToken.substring(0, validToken.length - 5) + "abcde";

    const res = await request(app)
      .get("/api/v1/auth/user-auth")
      .set("Authorization", tamperedToken);

    expect(res.status).toBe(401);
  });

  it("should return 401 for requests missing the Authorization header entirely", async () => {
    const res = await request(app).get("/api/v1/auth/user-auth");
    
    expect(res.status).toBe(401);
  });
});