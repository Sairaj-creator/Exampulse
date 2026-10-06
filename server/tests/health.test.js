import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { parseEnv } from "../src/config/env.js";
describe("foundation contracts", () => {
  it("reports a connected database and security headers", async () => {
    const response = await request(
      createApp({ isDatabaseConnected: () => true }),
    ).get("/api/health");
    expect(response.status).toBe(200);
    expect(response.body.data.db).toBe("connected");
    expect(response.headers["x-content-type-options"]).toBe("nosniff");
    expect(response.headers["x-powered-by"]).toBeUndefined();
  });
  it("reports unavailable database without a healthy envelope", async () => {
    const response = await request(
      createApp({ isDatabaseConnected: () => false }),
    ).get("/api/health");
    expect(response.status).toBe(503);
    expect(response.body.success).toBe(false);
  });
  it("keeps unknown API routes out of the SPA", async () => {
    const response = await request(createApp()).get("/api/missing");
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("NOT_FOUND");
  });
  it("rejects missing secrets and insecure production configuration", () => {
    expect(() => parseEnv({})).toThrow();
    expect(() =>
      parseEnv({
        NODE_ENV: "production",
        MONGO_URI: "mongodb://localhost/test",
        JWT_SECRET: "a".repeat(32),
        COOKIE_SECURE: "false",
      }),
    ).toThrow();
  });
});
