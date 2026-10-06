import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { connectDatabase } from "../src/config/db.js";
import { loadEnv } from "../src/config/env.js";
import { User, Subject, Question, Exam } from "../src/models/index.js";
import { hashPassword } from "../src/utils/passwords.js";

describe("Question Bank Integration Tests (Phase 4)", () => {
  let app;
  let teacher1;
  let teacher1Cookie;
  let teacher2Cookie;
  let studentCookie;
  let adminCookie;
  let testSubject;

  beforeAll(async () => {
    const env = loadEnv();
    const testMongoUri = env.MONGO_URI || "mongodb://127.0.0.1:27017/exampulse";
    await connectDatabase(testMongoUri);
    app = createApp({ isDatabaseConnected: () => true });

    // Clean any previous test accounts
    await User.deleteMany({ email: /@test-questions\.dev$/ });
    await Subject.deleteMany({ code: "TEST-Q-SUB" });

    // Create Subject
    testSubject = await Subject.create({
      name: "Question Testing Subject",
      code: "TEST-Q-SUB",
      description: "Subject for question bank testing",
    });

    const hashedPassword = await hashPassword("Password123");

    // Create Teacher 1
    teacher1 = await User.create({
      name: "Teacher One",
      email: "t1@test-questions.dev",
      passwordHash: hashedPassword,
      role: "teacher",
    });

    // Create Teacher 2
    await User.create({
      name: "Teacher Two",
      email: "t2@test-questions.dev",
      passwordHash: hashedPassword,
      role: "teacher",
    });

    // Create Student
    await User.create({
      name: "Student Test",
      email: "s@test-questions.dev",
      passwordHash: hashedPassword,
      role: "student",
    });

    // Create Admin
    await User.create({
      name: "Admin Test",
      email: "a@test-questions.dev",
      passwordHash: hashedPassword,
      role: "admin",
    });

    // Login each to capture cookies
    const loginT1 = await request(app).post("/api/auth/login").send({
      email: "t1@test-questions.dev",
      password: "Password123",
    });
    teacher1Cookie = loginT1.headers["set-cookie"];

    const loginT2 = await request(app).post("/api/auth/login").send({
      email: "t2@test-questions.dev",
      password: "Password123",
    });
    teacher2Cookie = loginT2.headers["set-cookie"];

    const loginS = await request(app).post("/api/auth/login").send({
      email: "s@test-questions.dev",
      password: "Password123",
    });
    studentCookie = loginS.headers["set-cookie"];

    const loginA = await request(app).post("/api/auth/login").send({
      email: "a@test-questions.dev",
      password: "Password123",
    });
    adminCookie = loginA.headers["set-cookie"];
  });

  afterAll(async () => {
    await Question.deleteMany({ subjectId: testSubject._id });
    await Subject.deleteOne({ _id: testSubject._id });
    await User.deleteMany({ email: /@test-questions\.dev$/ });
  });

  describe("Role Authorization", () => {
    it("forbids students from accessing the question bank", async () => {
      const res = await request(app)
        .get("/api/questions")
        .set("Cookie", studentCookie);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });
  });

  describe("POST /api/questions (Create questions per type)", () => {
    it("creates a single-choice question with 1 correct key", async () => {
      const res = await request(app)
        .post("/api/questions")
        .set("Cookie", teacher1Cookie)
        .send({
          subjectId: testSubject._id.toString(),
          topic: "Indexing",
          type: "single",
          text: "Which index type is clustered in MongoDB by default?",
          options: [
            { key: "A", text: "_id index" },
            { key: "B", text: "Compound index" },
            { key: "C", text: "Geospatial index" },
          ],
          correctKeys: ["A"],
          explanation: "The default _id field index is unique and primary.",
          difficulty: "easy",
          defaultMarks: 1,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.question.type).toBe("single");
      expect(res.body.data.question.topic).toBe("Indexing");
      expect(res.body.data.question.correctKeys).toEqual(["A"]);
      expect(res.body.data.question.createdBy.name).toBe("Teacher One");
    });

    it("creates a multiple-choice question with >=1 correct keys", async () => {
      const res = await request(app)
        .post("/api/questions")
        .set("Cookie", teacher1Cookie)
        .send({
          subjectId: testSubject._id.toString(),
          topic: "Transactions",
          type: "multiple",
          text: "Which of the following are ACID properties?",
          options: [
            { key: "A", text: "Atomicity" },
            { key: "B", text: "Consistency" },
            { key: "C", text: "Concurrency" },
            { key: "D", text: "Durability" },
          ],
          correctKeys: ["A", "B", "D"],
          explanation: "ACID stands for Atomicity, Consistency, Isolation, Durability.",
          difficulty: "medium",
          defaultMarks: 2,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.question.type).toBe("multiple");
      expect(res.body.data.question.correctKeys).toEqual(["A", "B", "D"]);
    });

    it("creates a true/false question with exactly 2 options and 1 correct key", async () => {
      const res = await request(app)
        .post("/api/questions")
        .set("Cookie", teacher1Cookie)
        .send({
          subjectId: testSubject._id.toString(),
          topic: "Normalization",
          type: "truefalse",
          text: "Third Normal Form eliminates transitive functional dependencies.",
          options: [
            { key: "A", text: "True" },
            { key: "B", text: "False" },
          ],
          correctKeys: ["A"],
          difficulty: "hard",
          defaultMarks: 1.5,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.question.type).toBe("truefalse");
      expect(res.body.data.question.options.length).toBe(2);
    });

    it("rejects single choice question with multiple correct keys", async () => {
      const res = await request(app)
        .post("/api/questions")
        .set("Cookie", teacher1Cookie)
        .send({
          subjectId: testSubject._id.toString(),
          topic: "Indexing",
          type: "single",
          text: "Invalid single question with two answers",
          options: [
            { key: "A", text: "Option A" },
            { key: "B", text: "Option B" },
          ],
          correctKeys: ["A", "B"],
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("rejects question when correctKey is not found in options", async () => {
      const res = await request(app)
        .post("/api/questions")
        .set("Cookie", teacher1Cookie)
        .send({
          subjectId: testSubject._id.toString(),
          topic: "Indexing",
          type: "single",
          text: "Correct key missing in options",
          options: [
            { key: "A", text: "Option A" },
            { key: "B", text: "Option B" },
          ],
          correctKeys: ["Z"],
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("rejects duplicate correct keys", async () => {
      const res = await request(app)
        .post("/api/questions")
        .set("Cookie", teacher1Cookie)
        .send({
          subjectId: testSubject._id.toString(),
          topic: "Indexing",
          type: "multiple",
          text: "Duplicate keys must not be accepted",
          options: [
            { key: "A", text: "Option A" },
            { key: "B", text: "Option B" },
          ],
          correctKeys: ["A", "A"],
        });

      expect(res.status).toBe(400);
      expect(res.body.error.details.some((detail) => detail.message.includes("distinct"))).toBe(true);
    });

    it("rejects true/false with more than 2 options", async () => {
      const res = await request(app)
        .post("/api/questions")
        .set("Cookie", teacher1Cookie)
        .send({
          subjectId: testSubject._id.toString(),
          topic: "Indexing",
          type: "truefalse",
          text: "True false with 3 options",
          options: [
            { key: "A", text: "True" },
            { key: "B", text: "False" },
            { key: "C", text: "Maybe" },
          ],
          correctKeys: ["A"],
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe("GET /api/questions (Listing & Filtering)", () => {
    it("returns questions owned by the logged-in teacher", async () => {
      const res = await request(app)
        .get("/api/questions")
        .set("Cookie", teacher1Cookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(3);
      expect(res.body.meta).toBeDefined();
      expect(res.body.meta.page).toBe(1);
    });

    it("teacher 2 sees only their own questions", async () => {
      const res = await request(app)
        .get("/api/questions")
        .set("Cookie", teacher2Cookie);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(0);
    });

    it("filters questions by topic, difficulty, and search term", async () => {
      const res = await request(app)
        .get("/api/questions?topic=Indexing&difficulty=easy&search=clustered")
        .set("Cookie", teacher1Cookie);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].topic).toBe("Indexing");
    });
  });

  describe("GET /api/questions/topics", () => {
    it("returns distinct topic names for teacher", async () => {
      const res = await request(app)
        .get(`/api/questions/topics?subjectId=${testSubject._id}`)
        .set("Cookie", teacher1Cookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data).toContain("Indexing");
      expect(res.body.data).toContain("Transactions");
      expect(res.body.data).toContain("Normalization");
    });
  });

  describe("Ownership & Updates", () => {
    let questionId;

    beforeAll(async () => {
      const q = await Question.findOne({ createdBy: teacher1._id, topic: "Indexing" });
      questionId = q._id.toString();
    });

    it("forbids Teacher 2 from reading Teacher 1 question by ID", async () => {
      const res = await request(app)
        .get(`/api/questions/${questionId}`)
        .set("Cookie", teacher2Cookie);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });

    it("allows Admin to view any question", async () => {
      const res = await request(app)
        .get(`/api/questions/${questionId}`)
        .set("Cookie", adminCookie);

      expect(res.status).toBe(200);
      expect(res.body.data.question._id).toBe(questionId);
    });

    it("allows Teacher 1 to update their own question", async () => {
      const res = await request(app)
        .patch(`/api/questions/${questionId}`)
        .set("Cookie", teacher1Cookie)
        .send({
          text: "Updated stem text: Which index is clustered by default in Mongo?",
          difficulty: "medium",
        });

      expect(res.status).toBe(200);
      expect(res.body.data.question.text).toContain("Updated stem text");
      expect(res.body.data.question.difficulty).toBe("medium");
    });
  });

  describe("DELETE /api/questions/:id (Hard delete vs Archive)", () => {
    it("permanently deletes an unreferenced question", async () => {
      // Create a temporary question
      const tempQ = await Question.create({
        subjectId: testSubject._id,
        topic: "Temporary",
        type: "single",
        text: "Temp question to be hard deleted",
        options: [
          { key: "A", text: "Opt 1" },
          { key: "B", text: "Opt 2" },
        ],
        correctKeys: ["A"],
        createdBy: teacher1._id,
      });

      const res = await request(app)
        .delete(`/api/questions/${tempQ._id}`)
        .set("Cookie", teacher1Cookie);

      expect(res.status).toBe(200);
      expect(res.body.data.archived).toBe(false);

      const check = await Question.findById(tempQ._id);
      expect(check).toBeNull();
    });

    it("archives a question when it has been snapshotted in an exam", async () => {
      // Create question
      const usedQ = await Question.create({
        subjectId: testSubject._id,
        topic: "Snapshotted Topic",
        type: "single",
        text: "Question that was included in an exam paper",
        options: [
          { key: "A", text: "Choice A" },
          { key: "B", text: "Choice B" },
        ],
        correctKeys: ["A"],
        createdBy: teacher1._id,
      });

      // Create dummy exam that snapshots this question
      const exam = await Exam.create({
        title: "Test Exam with Question Snapshot",
        subjectId: testSubject._id,
        createdBy: teacher1._id,
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000),
        durationMinutes: 60,
        questions: [
          {
            sourceQuestionId: usedQ._id,
            type: usedQ.type,
            text: usedQ.text,
            options: usedQ.options,
            correctKeys: usedQ.correctKeys,
            marks: 2,
          },
        ],
      });

      // Try to delete question
      const res = await request(app)
        .delete(`/api/questions/${usedQ._id}`)
        .set("Cookie", teacher1Cookie);

      expect(res.status).toBe(200);
      expect(res.body.data.archived).toBe(true);

      // Verify question still exists in DB, but with isArchived = true
      const check = await Question.findById(usedQ._id);
      expect(check).not.toBeNull();
      expect(check.isArchived).toBe(true);

      // Cleanup dummy exam
      await Exam.findByIdAndDelete(exam._id);
      await Question.findByIdAndDelete(usedQ._id);
    });
  });
});
