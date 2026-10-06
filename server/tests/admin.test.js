import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { connectDatabase } from "../src/config/db.js";
import { loadEnv } from "../src/config/env.js";
import { Batch, Subject, User } from "../src/models/index.js";
import { hashPassword, comparePassword } from "../src/utils/passwords.js";
import { signToken } from "../src/utils/tokens.js";

const testEmailPattern = /@phase3-test\.dev$/;
const batchNamePattern = /^PHASE3-/;
const subjectCodePattern = /^P3/;

describe("Admin master data API", () => {
  let app;
  let admin;
  let student;
  let assignedBatch;
  let adminAuth;
  let studentAuth;

  beforeAll(async () => {
    await connectDatabase(loadEnv().MONGO_URI);
    app = createApp({ isDatabaseConnected: () => true });
    await User.deleteMany({ email: testEmailPattern });
    await Batch.deleteMany({ name: batchNamePattern });
    await Subject.deleteMany({ code: subjectCodePattern });

    assignedBatch = await Batch.create({ name: "PHASE3-ASSIGNED", year: 2028 });
    admin = await User.create({
      name: "Phase Three Admin",
      email: "admin@phase3-test.dev",
      passwordHash: await hashPassword("AdminPass123"),
      role: "admin",
    });
    student = await User.create({
      name: "Phase Three Student",
      email: "student@phase3-test.dev",
      passwordHash: await hashPassword("StudentPass123"),
      role: "student",
      batchId: assignedBatch._id,
    });
    adminAuth = `Bearer ${signToken(admin)}`;
    studentAuth = `Bearer ${signToken(student)}`;
  });

  afterAll(async () => {
    await User.deleteMany({ email: testEmailPattern });
    await Batch.deleteMany({ name: batchNamePattern });
    await Subject.deleteMany({ code: subjectCodePattern });
  });

  it("enforces admin access on the user directory", async () => {
    const forbidden = await request(app)
      .get("/api/users")
      .set("Authorization", studentAuth);
    expect(forbidden.status).toBe(403);

    const allowed = await request(app)
      .get("/api/users?search=phase3-test")
      .set("Authorization", adminAuth);
    expect(allowed.status).toBe(200);
    expect(allowed.body.meta.total).toBeGreaterThanOrEqual(2);
  });

  it("creates, updates, and resets a managed user", async () => {
    const created = await request(app)
      .post("/api/users")
      .set("Authorization", adminAuth)
      .send({
        name: "Managed Teacher",
        email: "teacher@phase3-test.dev",
        password: "TeacherPass123",
        role: "teacher",
      });
    expect(created.status).toBe(201);
    expect(created.body.data.user.passwordHash).toBeUndefined();

    const id = created.body.data.user._id;
    const invalidStudent = await request(app)
      .patch(`/api/users/${id}`)
      .set("Authorization", adminAuth)
      .send({ role: "student" });
    expect(invalidStudent.status).toBe(400);
    expect(invalidStudent.body.error.message).toBe(
      "Batch is required for students",
    );

    const updated = await request(app)
      .patch(`/api/users/${id}`)
      .set("Authorization", adminAuth)
      .send({
        role: "student",
        batchId: assignedBatch._id.toString(),
        rollNumber: "P3001",
      });
    expect(updated.status).toBe(200);
    expect(updated.body.data.user.batchId.name).toBe("PHASE3-ASSIGNED");

    const reset = await request(app)
      .post(`/api/users/${id}/reset-password`)
      .set("Authorization", adminAuth)
      .send({ newPassword: "UpdatedPass123" });
    expect(reset.status).toBe(200);
    const stored = await User.findById(id).select("+passwordHash");
    expect(await comparePassword("UpdatedPass123", stored.passwordHash)).toBe(
      true,
    );
  });

  it("prevents an administrator from deactivating their own account", async () => {
    const response = await request(app)
      .patch(`/api/users/${admin._id}/status`)
      .set("Authorization", adminAuth)
      .send({ isActive: false });
    expect(response.status).toBe(400);
    expect(response.body.error.message).toContain("own administrator account");
  });

  it("manages batches and guards referenced batches from deletion", async () => {
    const publicList = await request(app).get("/api/batches");
    expect(publicList.status).toBe(200);
    expect(
      publicList.body.data.find(
        (batch) => batch._id === assignedBatch._id.toString(),
      ).studentCount,
    ).toBeGreaterThanOrEqual(1);

    const blocked = await request(app)
      .delete(`/api/batches/${assignedBatch._id}`)
      .set("Authorization", adminAuth);
    expect(blocked.status).toBe(409);

    const created = await request(app)
      .post("/api/batches")
      .set("Authorization", adminAuth)
      .send({ name: "PHASE3-TEMP", year: 2029 });
    expect(created.status).toBe(201);
    const id = created.body.data.batch._id;

    const updated = await request(app)
      .patch(`/api/batches/${id}`)
      .set("Authorization", adminAuth)
      .send({ year: 2030 });
    expect(updated.status).toBe(200);
    expect(updated.body.data.batch.year).toBe(2030);

    const removed = await request(app)
      .delete(`/api/batches/${id}`)
      .set("Authorization", adminAuth);
    expect(removed.status).toBe(200);
  });

  it("creates, updates, and deletes an unreferenced subject", async () => {
    const created = await request(app)
      .post("/api/subjects")
      .set("Authorization", adminAuth)
      .send({
        name: "Phase Three Subject",
        code: "P301",
        description: "Admin integration fixture",
      });
    expect(created.status).toBe(201);
    const id = created.body.data.subject._id;

    const updated = await request(app)
      .patch(`/api/subjects/${id}`)
      .set("Authorization", adminAuth)
      .send({ description: "Updated fixture" });
    expect(updated.status).toBe(200);
    expect(updated.body.data.subject.description).toBe("Updated fixture");

    const removed = await request(app)
      .delete(`/api/subjects/${id}`)
      .set("Authorization", adminAuth);
    expect(removed.status).toBe(200);
  });

  it("validates resource IDs before querying MongoDB", async () => {
    const response = await request(app)
      .get("/api/users/not-an-id")
      .set("Authorization", adminAuth);
    expect(response.status).toBe(400);
    expect(response.body.error.details[0].path).toBe("id");
  });
});
