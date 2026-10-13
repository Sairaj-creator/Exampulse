import { beforeAll, describe, expect, it } from "vitest";
import express from "express";
import cookieParser from "cookie-parser";
import request from "supertest";
import {
  ANONYMOUS_LIMIT,
  LOGIN_FAILURE_LIMIT,
  createGeneralLimiter,
  createLoginLimiter,
} from "../src/middleware/rateLimit.js";
import { COOKIE_NAME, signToken } from "../src/utils/tokens.js";

const never = () => false;

function generalApp() {
  const app = express();
  app.use(cookieParser());
  app.use(createGeneralLimiter({ skip: never }));
  app.get("/ping", (req, res) => res.json({ ok: true }));
  return app;
}

function loginApp() {
  const app = express();
  app.use(express.json());
  app.post("/login", createLoginLimiter({ skip: never }), (req, res) =>
    res.status(req.body.password === "right" ? 200 : 401).json({}),
  );
  return app;
}

async function exhaustAnonymousBudget(app) {
  for (let i = 0; i < ANONYMOUS_LIMIT; i += 1) {
    await request(app).get("/ping");
  }
}

describe("rate limiting", () => {
  beforeAll(() => {
    process.env.MONGO_URI ||= "mongodb://127.0.0.1:27017/exampulse";
    process.env.JWT_SECRET ||= "test-secret-test-secret-test-secret-123";
  });

  it("limits anonymous traffic per IP", async () => {
    const app = generalApp();
    await exhaustAnonymousBudget(app);

    const blocked = await request(app).get("/ping");
    expect(blocked.status).toBe(429);
    expect(blocked.body.error.code).toBe("RATE_LIMITED");
  });

  it("gives signed-in users their own budget on a shared IP", async () => {
    const app = generalApp();
    await exhaustAnonymousBudget(app);

    const cookieFor = (id) =>
      `${COOKIE_NAME}=${signToken({ _id: id, role: "student" })}`;
    const first = await request(app)
      .get("/ping")
      .set("Cookie", cookieFor("64b000000000000000000001"));
    const second = await request(app)
      .get("/ping")
      .set("Cookie", cookieFor("64b000000000000000000002"));

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
  });

  it("does not let a forged session cookie escape the IP budget", async () => {
    const app = generalApp();
    await exhaustAnonymousBudget(app);

    const forged = await request(app)
      .get("/ping")
      .set("Cookie", `${COOKIE_NAME}=not-a-real-token`);
    expect(forged.status).toBe(429);
  });

  it("blocks repeated failed logins for one account only", async () => {
    const app = loginApp();
    const attempt = (email, password) =>
      request(app).post("/login").send({ email, password });

    for (let i = 0; i < LOGIN_FAILURE_LIMIT; i += 1) {
      expect((await attempt("victim@example.com", "wrong")).status).toBe(401);
    }

    expect((await attempt("victim@example.com", "wrong")).status).toBe(429);
    // Case and whitespace variants share the same bucket
    expect((await attempt(" Victim@Example.com ", "right")).status).toBe(429);
    // A classmate on the same network is unaffected
    expect((await attempt("classmate@example.com", "right")).status).toBe(200);
  });

  it("does not count successful logins", async () => {
    const app = loginApp();
    for (let i = 0; i < LOGIN_FAILURE_LIMIT + 5; i += 1) {
      const response = await request(app)
        .post("/login")
        .send({ email: "busy@example.com", password: "right" });
      expect(response.status).toBe(200);
    }
  });
});
