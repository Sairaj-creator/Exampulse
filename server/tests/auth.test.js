import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import { createApp } from "../src/app.js";
import { connectDatabase } from "../src/config/db.js";
import { loadEnv } from "../src/config/env.js";
import { User, Batch } from "../src/models/index.js";
import { hashPassword } from "../src/utils/passwords.js";

describe("Authentication & RBAC Integration Tests", () => {
  let app;
  let testBatch;
  const adminEmail = "admin@test-auth.dev";
  const adminPassword = "AdminPass123";

  beforeAll(async () => {
    const env = loadEnv();
    const testMongoUri = env.MONGO_URI || "mongodb://127.0.0.1:27017/exampulse";
    await connectDatabase(testMongoUri);
    app = createApp({ isDatabaseConnected: () => true });

    // Ensure clean test batch
    await Batch.deleteOne({ name: "TEST-BATCH-AUTH" });
    testBatch = await Batch.create({
      name: "TEST-BATCH-AUTH",
      year: 2026,
    });

    // Own admin fixture so the suite does not depend on seeded data
    await User.deleteOne({ email: adminEmail });
    await User.create({
      name: "Auth Test Admin",
      email: adminEmail,
      passwordHash: await hashPassword(adminPassword),
      role: "admin",
    });
  });

  afterAll(async () => {
    // Cleanup test data
    await User.deleteMany({ email: /@test-auth\.dev$/ });
    if (testBatch) {
      await Batch.deleteOne({ _id: testBatch._id });
    }
  });

  describe("POST /api/auth/register", () => {
    it("successfully registers a student and sets auth cookie", async () => {
      const email = "newstudent@test-auth.dev";
      await User.deleteOne({ email });

      const res = await request(app).post("/api/auth/register").send({
        name: "New Student",
        email,
        password: "Password123",
        batchId: testBatch._id.toString(),
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(email);
      expect(res.body.data.user.role).toBe("student");
      expect(res.body.data.user.passwordHash).toBeUndefined();

      // Check cookie
      const cookies = res.headers["set-cookie"];
      expect(cookies).toBeDefined();
      expect(cookies.some((c) => c.includes("ep_session="))).toBe(true);
    });

    it("rejects registration with duplicate email", async () => {
      const email = "dupe@test-auth.dev";
      await User.deleteOne({ email });
      await User.create({
        name: "Existing",
        email,
        passwordHash: await hashPassword("Password123"),
        role: "student",
        batchId: testBatch._id,
      });

      const res = await request(app).post("/api/auth/register").send({
        name: "Another Student",
        email,
        password: "Password123",
        batchId: testBatch._id.toString(),
      });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("CONFLICT");
    });

    it("rejects registration with invalid batch ID", async () => {
      const res = await request(app).post("/api/auth/register").send({
        name: "No Batch Student",
        email: "nobatch@test-auth.dev",
        password: "Password123",
        batchId: new mongoose.Types.ObjectId().toString(),
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("rejects registration with weak password (missing number)", async () => {
      const res = await request(app).post("/api/auth/register").send({
        name: "Weak Pass",
        email: "weak@test-auth.dev",
        password: "passwordonly",
        batchId: testBatch._id.toString(),
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe("POST /api/auth/login", () => {
    const testLoginEmail = "loginuser@test-auth.dev";

    beforeAll(async () => {
      await User.deleteOne({ email: testLoginEmail });
      await User.create({
        name: "Login User",
        email: testLoginEmail,
        passwordHash: await hashPassword("ValidPass123"),
        role: "student",
        batchId: testBatch._id,
      });
    });

    it("logs in successfully with valid credentials", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: testLoginEmail,
        password: "ValidPass123",
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testLoginEmail);

      const cookies = res.headers["set-cookie"];
      expect(cookies).toBeDefined();
      expect(cookies.some((c) => c.includes("ep_session="))).toBe(true);
    });

    it("rejects incorrect password with generic error message", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: testLoginEmail,
        password: "WrongPassword999",
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe("Invalid email or password");
    });

    it("rejects deactivated user", async () => {
      const inactiveEmail = "inactive@test-auth.dev";
      await User.deleteOne({ email: inactiveEmail });
      await User.create({
        name: "Inactive User",
        email: inactiveEmail,
        passwordHash: await hashPassword("ValidPass123"),
        role: "student",
        isActive: false,
      });

      const res = await request(app).post("/api/auth/login").send({
        email: inactiveEmail,
        password: "ValidPass123",
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe("GET /api/auth/me and Session Persistence", () => {
    it("restores session when valid cookie is provided", async () => {
      // Login first to get cookie
      const loginRes = await request(app).post("/api/auth/login").send({
        email: adminEmail,
        password: adminPassword,
      });

      const cookie = loginRes.headers["set-cookie"];

      const meRes = await request(app)
        .get("/api/auth/me")
        .set("Cookie", cookie);
      expect(meRes.status).toBe(200);
      expect(meRes.body.data.user.email).toBe(adminEmail);
      expect(meRes.body.data.user.role).toBe("admin");
    });

    it("returns 401 when session cookie is missing", async () => {
      const res = await request(app).get("/api/auth/me");
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("UNAUTHENTICATED");
    });
  });

  describe("POST /api/auth/logout", () => {
    it("clears session cookie", async () => {
      const loginRes = await request(app).post("/api/auth/login").send({
        email: adminEmail,
        password: adminPassword,
      });
      const cookie = loginRes.headers["set-cookie"];

      const logoutRes = await request(app)
        .post("/api/auth/logout")
        .set("Cookie", cookie);
      expect(logoutRes.status).toBe(200);
      const cookies = logoutRes.headers["set-cookie"];
      expect(cookies.some((c) => c.includes("ep_session=;"))).toBe(true);
    });
  });
});
