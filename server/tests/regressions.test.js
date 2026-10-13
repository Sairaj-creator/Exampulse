import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { connectDatabase } from "../src/config/db.js";
import { loadEnv } from "../src/config/env.js";
import {
  Attempt,
  Batch,
  Exam,
  Question,
  Subject,
  User,
} from "../src/models/index.js";
import { finalizeAttempt } from "../src/services/attemptService.js";
import { hashPassword } from "../src/utils/passwords.js";

describe("Regression tests for fixed defects", () => {
  let app;
  let batch;
  let subject;
  let teacher;
  let question;
  let teacherCookie;
  let otherTeacherCookie;
  let adminCookie;

  const login = async (email) => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ email, password: "Password123" });
    return response.headers["set-cookie"];
  };

  const draftPayload = (title) => {
    const startTime = new Date(Date.now() + 60 * 60 * 1000);
    return {
      title,
      subjectId: subject._id.toString(),
      batchIds: [batch._id.toString()],
      startTime: startTime.toISOString(),
      endTime: new Date(startTime.getTime() + 2 * 60 * 60 * 1000).toISOString(),
      durationMinutes: 60,
    };
  };

  const cleanup = async () => {
    const users = await User.find({ email: /@test-regress\.dev$/ }).select(
      "_id",
    );
    const userIds = users.map((user) => user._id);
    const exams = await Exam.find({ createdBy: { $in: userIds } }).select(
      "_id",
    );
    await Attempt.deleteMany({
      examId: { $in: exams.map((exam) => exam._id) },
    });
    await Exam.deleteMany({ createdBy: { $in: userIds } });
    await Question.deleteMany({ topic: "Regression Fixtures" });
    await User.deleteMany({ _id: { $in: userIds } });
    await Batch.deleteMany({ name: "TEST-REGRESS-BATCH" });
    await Subject.deleteMany({ code: "TEST-REGRESS" });
  };

  beforeAll(async () => {
    const env = loadEnv();
    await connectDatabase(env.MONGO_URI);
    app = createApp({ isDatabaseConnected: () => true });
    await cleanup();

    const passwordHash = await hashPassword("Password123");
    batch = await Batch.create({ name: "TEST-REGRESS-BATCH", year: 2029 });
    subject = await Subject.create({
      name: "Regression Fixtures Subject",
      code: "TEST-REGRESS",
    });
    teacher = await User.create({
      name: "Regress Teacher",
      email: "teacher@test-regress.dev",
      passwordHash,
      role: "teacher",
    });
    await User.create({
      name: "Regress Other Teacher",
      email: "other@test-regress.dev",
      passwordHash,
      role: "teacher",
    });
    await User.create({
      name: "Regress Admin",
      email: "admin@test-regress.dev",
      passwordHash,
      role: "admin",
    });
    await User.create({
      name: "Regress Student",
      email: "student@test-regress.dev",
      passwordHash,
      role: "student",
      batchId: batch._id,
    });
    question = await Question.create({
      subjectId: subject._id,
      topic: "Regression Fixtures",
      type: "single",
      text: "Which statement removes duplicate rows?",
      options: [
        { key: "A", text: "DISTINCT" },
        { key: "B", text: "UNIQUE" },
      ],
      correctKeys: ["A"],
      defaultMarks: 2,
      createdBy: teacher._id,
    });

    teacherCookie = await login("teacher@test-regress.dev");
    otherTeacherCookie = await login("other@test-regress.dev");
    adminCookie = await login("admin@test-regress.dev");
  });

  afterAll(cleanup);

  it("lets an admin build an exam from any teacher's question bank", async () => {
    const created = await request(app)
      .post("/api/exams")
      .set("Cookie", adminCookie)
      .send(draftPayload("Regression Admin Exam"));
    expect(created.status).toBe(201);

    const added = await request(app)
      .post(`/api/exams/${created.body.data.exam._id}/questions`)
      .set("Cookie", adminCookie)
      .send({ questionIds: [question._id.toString()] });
    expect(added.status).toBe(200);
    expect(added.body.data.exam.questions).toHaveLength(1);
  });

  it("still stops a teacher from using another teacher's questions", async () => {
    const created = await request(app)
      .post("/api/exams")
      .set("Cookie", otherTeacherCookie)
      .send(draftPayload("Regression Other Teacher Exam"));
    expect(created.status).toBe(201);

    const added = await request(app)
      .post(`/api/exams/${created.body.data.exam._id}/questions`)
      .set("Cookie", otherTeacherCookie)
      .send({ questionIds: [question._id.toString()] });
    expect(added.status).toBe(400);
  });

  it("records a timed-out attempt at its deadline, not when it was swept", async () => {
    const created = await request(app)
      .post("/api/exams")
      .set("Cookie", teacherCookie)
      .send(draftPayload("Regression Timeout Exam"));
    const examId = created.body.data.exam._id;
    await request(app)
      .post(`/api/exams/${examId}/questions`)
      .set("Cookie", teacherCookie)
      .send({ questionIds: [question._id.toString()] });

    const student = await User.findOne({ email: "student@test-regress.dev" });
    const startedAt = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const expiresAt = new Date(startedAt.getTime() + 30 * 60 * 1000);
    const attempt = await Attempt.create({
      examId,
      studentId: student._id,
      subjectId: subject._id,
      teacherId: teacher._id,
      batchId: batch._id,
      examTitle: "Regression Timeout Exam",
      status: "in_progress",
      startedAt,
      expiresAt,
      presentation: [],
      answers: [],
    });

    // Finalized days later (the server was down, or nobody opened it).
    const finalized = await finalizeAttempt(attempt._id, "timeout");

    expect(finalized.status).toBe("submitted");
    expect(finalized.submitReason).toBe("timeout");
    expect(finalized.submittedAt.getTime()).toBe(expiresAt.getTime());
    expect(finalized.result.timeTakenSeconds).toBe(30 * 60);
  });

  it("stamps a manual submission with the current time", async () => {
    const created = await request(app)
      .post("/api/exams")
      .set("Cookie", teacherCookie)
      .send(draftPayload("Regression Manual Exam"));
    const examId = created.body.data.exam._id;

    const student = await User.findOne({ email: "student@test-regress.dev" });
    const startedAt = new Date(Date.now() - 5 * 60 * 1000);
    const attempt = await Attempt.create({
      examId,
      studentId: student._id,
      subjectId: subject._id,
      teacherId: teacher._id,
      batchId: batch._id,
      examTitle: "Regression Manual Exam",
      status: "in_progress",
      startedAt,
      expiresAt: new Date(Date.now() + 25 * 60 * 1000),
      presentation: [],
      answers: [],
    });

    const before = Date.now();
    const finalized = await finalizeAttempt(attempt._id, "manual");
    expect(finalized.submittedAt.getTime()).toBeGreaterThanOrEqual(before);
    expect(finalized.submittedAt.getTime()).toBeLessThanOrEqual(Date.now());
  });

  it("caps participation at 100% when an attempt outlives its eligibility", async () => {
    const created = await request(app)
      .post("/api/exams")
      .set("Cookie", teacherCookie)
      .send(draftPayload("Regression Participation Exam"));
    const examId = created.body.data.exam._id;
    await request(app)
      .post(`/api/exams/${examId}/questions`)
      .set("Cookie", teacherCookie)
      .send({ questionIds: [question._id.toString()] });

    const student = await User.findOne({ email: "student@test-regress.dev" });
    const now = Date.now();
    const attempt = await Attempt.create({
      examId,
      studentId: student._id,
      subjectId: subject._id,
      teacherId: teacher._id,
      batchId: batch._id,
      examTitle: "Regression Participation Exam",
      status: "in_progress",
      startedAt: new Date(now - 10 * 60 * 1000),
      expiresAt: new Date(now + 10 * 60 * 1000),
      presentation: [],
      answers: [],
    });
    await finalizeAttempt(attempt._id, "manual");

    // The only eligible student is deactivated after sitting the exam.
    await User.updateOne({ _id: student._id }, { $set: { isActive: false } });
    const analytics = await request(app)
      .get(`/api/analytics/exams/${examId}`)
      .set("Cookie", teacherCookie);
    await User.updateOne({ _id: student._id }, { $set: { isActive: true } });

    expect(analytics.status).toBe(200);
    expect(analytics.body.data.participation.attemptedCount).toBe(1);
    expect(
      analytics.body.data.participation.participationRate,
    ).toBeLessThanOrEqual(100);
  });
});
