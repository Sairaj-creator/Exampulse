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
import { hashPassword } from "../src/utils/passwords.js";

describe("Exam Builder Integration Tests (Phase 5)", () => {
  let app;
  let teacher;
  let student;
  let subject;
  let batch;
  let question;
  let teacherCookie;
  let otherTeacherCookie;
  let studentCookie;

  const futureSchedule = () => {
    const startTime = new Date(Date.now() + 60 * 60 * 1000);
    const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000);
    return {
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
    };
  };

  const examPayload = (overrides = {}) => ({
    title: "Database Fundamentals Assessment",
    description: "Phase 5 lifecycle fixture",
    instructions: "Answer every question.",
    subjectId: subject._id.toString(),
    batchIds: [batch._id.toString()],
    ...futureSchedule(),
    durationMinutes: 60,
    passPercentage: 40,
    negativeMarking: { enabled: false, penaltyFraction: 0.25 },
    shuffleQuestions: false,
    shuffleOptions: false,
    reviewPolicy: "immediate",
    ...overrides,
  });

  const createDraftWithQuestion = async (overrides = {}) => {
    const createResponse = await request(app)
      .post("/api/exams")
      .set("Cookie", teacherCookie)
      .send(examPayload(overrides));
    expect(createResponse.status).toBe(201);
    const examId = createResponse.body.data.exam._id;
    const addResponse = await request(app)
      .post(`/api/exams/${examId}/questions`)
      .set("Cookie", teacherCookie)
      .send({ questionIds: [question._id.toString()] });
    expect(addResponse.status).toBe(200);
    return addResponse.body.data.exam;
  };

  beforeAll(async () => {
    const env = loadEnv();
    await connectDatabase(
      env.MONGO_URI || "mongodb://127.0.0.1:27017/exampulse",
    );
    app = createApp({ isDatabaseConnected: () => true });

    await Attempt.deleteMany({ examTitle: /Phase 5|Database Fundamentals/ });
    await Exam.deleteMany({ title: /Phase 5|Database Fundamentals/ });
    await Question.deleteMany({ topic: "Phase 5 Testing" });
    await User.deleteMany({ email: /@test-exams\.dev$/ });
    await Batch.deleteMany({ name: "TEST-E-BATCH" });
    await Subject.deleteMany({ code: "TEST-E-SUB" });

    const passwordHash = await hashPassword("Password123");
    batch = await Batch.create({ name: "TEST-E-BATCH", year: 2028 });
    subject = await Subject.create({
      name: "Phase 5 Test Subject",
      code: "TEST-E-SUB",
    });
    teacher = await User.create({
      name: "Exam Teacher",
      email: "teacher@test-exams.dev",
      passwordHash,
      role: "teacher",
    });
    await User.create({
      name: "Other Teacher",
      email: "other@test-exams.dev",
      passwordHash,
      role: "teacher",
    });
    student = await User.create({
      name: "Exam Student",
      email: "student@test-exams.dev",
      passwordHash,
      role: "student",
      batchId: batch._id,
      rollNumber: "E-001",
    });
    question = await Question.create({
      subjectId: subject._id,
      topic: "Phase 5 Testing",
      type: "single",
      text: "Which database stores documents as BSON?",
      options: [
        { key: "A", text: "MongoDB" },
        { key: "B", text: "SQLite" },
      ],
      correctKeys: ["A"],
      explanation: "MongoDB uses BSON documents.",
      difficulty: "easy",
      defaultMarks: 2,
      createdBy: teacher._id,
    });

    const login = async (email) => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({ email, password: "Password123" });
      return response.headers["set-cookie"];
    };
    teacherCookie = await login("teacher@test-exams.dev");
    otherTeacherCookie = await login("other@test-exams.dev");
    studentCookie = await login("student@test-exams.dev");
  });

  afterAll(async () => {
    const examIds = (
      await Exam.find({ createdBy: teacher._id }).select("_id")
    ).map((item) => item._id);
    await Attempt.deleteMany({ examId: { $in: examIds } });
    await Exam.deleteMany({ createdBy: teacher._id });
    await Question.deleteMany({ topic: "Phase 5 Testing" });
    await User.deleteMany({ email: /@test-exams\.dev$/ });
    await Batch.deleteOne({ _id: batch._id });
    await Subject.deleteOne({ _id: subject._id });
  });

  it("enforces role and ownership boundaries", async () => {
    const exam = await createDraftWithQuestion({
      title: "Phase 5 Ownership Exam",
    });
    expect(
      (await request(app).get("/api/exams").set("Cookie", studentCookie))
        .status,
    ).toBe(403);
    expect(
      (
        await request(app)
          .get(`/api/exams/${exam._id}`)
          .set("Cookie", otherTeacherCookie)
      ).status,
    ).toBe(403);
  });

  it("validates schedules and publish prerequisites", async () => {
    const invalidSchedule = await request(app)
      .post("/api/exams")
      .set("Cookie", teacherCookie)
      .send(examPayload({ ...futureSchedule(), durationMinutes: 500 }));
    expect(invalidSchedule.status).toBe(400);

    const draft = await request(app)
      .post("/api/exams")
      .set("Cookie", teacherCookie)
      .send(examPayload({ title: "Phase 5 Empty Draft" }));
    const publish = await request(app)
      .post(`/api/exams/${draft.body.data.exam._id}/publish`)
      .set("Cookie", teacherCookie);
    expect(publish.status).toBe(409);
    expect(publish.body.error.message).toContain("at least one question");
  });

  it("snapshots questions and remains independent from question-bank edits", async () => {
    const exam = await createDraftWithQuestion({
      title: "Phase 5 Snapshot Exam",
    });
    expect(exam.questions[0].text).toBe(
      "Which database stores documents as BSON?",
    );
    expect(exam.totalMarks).toBe(2);

    await Question.updateOne(
      { _id: question._id },
      { text: "This bank question changed after snapshotting." },
    );
    const detail = await request(app)
      .get(`/api/exams/${exam._id}`)
      .set("Cookie", teacherCookie);
    expect(detail.body.data.exam.questions[0].text).toBe(
      "Which database stores documents as BSON?",
    );
    await Question.updateOne(
      { _id: question._id },
      { text: "Which database stores documents as BSON?" },
    );
  });

  it("supports marks, ordering, removal, and total-mark recomputation for drafts", async () => {
    const secondQuestion = await Question.create({
      subjectId: subject._id,
      topic: "Phase 5 Testing",
      type: "truefalse",
      text: "MongoDB collections require a fixed schema.",
      options: [
        { key: "A", text: "True" },
        { key: "B", text: "False" },
      ],
      correctKeys: ["B"],
      createdBy: teacher._id,
      defaultMarks: 1,
    });
    const exam = await createDraftWithQuestion({
      title: "Phase 5 Question Operations",
    });
    const added = await request(app)
      .post(`/api/exams/${exam._id}/questions`)
      .set("Cookie", teacherCookie)
      .send({ questionIds: [secondQuestion._id.toString()] });
    const [first, second] = added.body.data.exam.questions;
    const marked = await request(app)
      .patch(`/api/exams/${exam._id}/questions/${first._id}`)
      .set("Cookie", teacherCookie)
      .send({ marks: 3 });
    expect(marked.body.data.exam.totalMarks).toBe(4);

    const reordered = await request(app)
      .put(`/api/exams/${exam._id}/questions/order`)
      .set("Cookie", teacherCookie)
      .send({ orderedIds: [second._id, first._id] });
    expect(reordered.body.data.exam.questions[0]._id).toBe(second._id);

    const removed = await request(app)
      .delete(`/api/exams/${exam._id}/questions/${second._id}`)
      .set("Cookie", teacherCookie);
    expect(removed.body.data.exam.questions).toHaveLength(1);
    expect(removed.body.data.exam.totalMarks).toBe(3);
  });

  it("publishes a valid draft and enforces the no-attempt edit matrix", async () => {
    const exam = await createDraftWithQuestion({
      title: "Phase 5 Publish Exam",
    });
    const published = await request(app)
      .post(`/api/exams/${exam._id}/publish`)
      .set("Cookie", teacherCookie);
    expect(published.status).toBe(200);
    expect(published.body.data.exam.status).toBe("published");

    const allowedEdit = await request(app)
      .patch(`/api/exams/${exam._id}`)
      .set("Cookie", teacherCookie)
      .send({
        title: "Phase 5 Published Title",
        description: "Allowed metadata edit",
      });
    expect(allowedEdit.status).toBe(200);

    const blockedEdit = await request(app)
      .patch(`/api/exams/${exam._id}`)
      .set("Cookie", teacherCookie)
      .send({ durationMinutes: 30 });
    expect(blockedEdit.status).toBe(409);

    const unpublished = await request(app)
      .post(`/api/exams/${exam._id}/unpublish`)
      .set("Cookie", teacherCookie);
    expect(unpublished.status).toBe(200);
    expect(unpublished.body.data.exam.status).toBe("draft");
  });

  it("allows only description and end-time extension after an attempt exists", async () => {
    const exam = await createDraftWithQuestion({
      title: "Phase 5 Attempt Matrix",
    });
    await request(app)
      .post(`/api/exams/${exam._id}/publish`)
      .set("Cookie", teacherCookie);
    await Attempt.create({
      examId: exam._id,
      studentId: student._id,
      subjectId: subject._id,
      teacherId: teacher._id,
      batchId: batch._id,
      examTitle: exam.title,
      status: "in_progress",
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    });

    const shorterEnd = new Date(
      new Date(exam.endTime).getTime() - 60 * 1000,
    ).toISOString();
    expect(
      (
        await request(app)
          .patch(`/api/exams/${exam._id}`)
          .set("Cookie", teacherCookie)
          .send({ endTime: shorterEnd })
      ).status,
    ).toBe(409);

    const extendedEnd = new Date(
      new Date(exam.endTime).getTime() + 60 * 60 * 1000,
    ).toISOString();
    const allowed = await request(app)
      .patch(`/api/exams/${exam._id}`)
      .set("Cookie", teacherCookie)
      .send({ description: "Updated after an attempt", endTime: extendedEnd });
    expect(allowed.status).toBe(200);
    expect(new Date(allowed.body.data.exam.endTime).toISOString()).toBe(
      extendedEnd,
    );

    expect(
      (
        await request(app)
          .post(`/api/exams/${exam._id}/unpublish`)
          .set("Cookie", teacherCookie)
      ).status,
    ).toBe(409);
    expect(
      (
        await request(app)
          .delete(`/api/exams/${exam._id}`)
          .set("Cookie", teacherCookie)
      ).status,
    ).toBe(409);
  });

  it("duplicates an exam as an independently scheduled draft", async () => {
    const source = await createDraftWithQuestion({
      title: "Phase 5 Duplicate Source",
    });
    const duplicate = await request(app)
      .post(`/api/exams/${source._id}/duplicate`)
      .set("Cookie", teacherCookie)
      .send({ title: "Phase 5 Duplicate Copy" });
    expect(duplicate.status).toBe(201);
    expect(duplicate.body.data.exam.status).toBe("draft");
    expect(duplicate.body.data.exam.questions).toHaveLength(1);
    expect(duplicate.body.data.exam.questions[0]._id).not.toBe(
      source.questions[0]._id,
    );
    expect(
      new Date(duplicate.body.data.exam.startTime).getTime(),
    ).toBeGreaterThan(Date.now());
  });
});
