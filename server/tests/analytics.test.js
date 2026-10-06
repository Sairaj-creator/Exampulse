import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { connectDatabase } from "../src/config/db.js";
import { loadEnv } from "../src/config/env.js";
import {
  User,
  Batch,
  Subject,
  Question,
  Exam,
  Attempt,
} from "../src/models/index.js";
import { hashPassword } from "../src/utils/passwords.js";
import { gradeAttempt } from "../src/services/gradingService.js";
import {
  buildPercentageDistribution,
  calculateImprovement,
} from "../src/services/analyticsService.js";

describe("Phase 8: Performance Analytics Backend API", () => {
  let app;
  let batch1;
  let batch2;
  let subject1;
  let teacher1;
  let student1;
  let student2;
  let student3;
  let student4;
  let exam1;
  let exam2;
  let liveExam;

  let adminCookie;
  let teacher1Cookie;
  let teacher2Cookie;
  let student1Cookie;
  let student4Cookie;

  beforeAll(async () => {
    const env = loadEnv();
    await connectDatabase(
      env.MONGO_URI || "mongodb://127.0.0.1:27017/exampulse",
    );
    app = createApp({ isDatabaseConnected: () => true });

    // Clean fixtures
    await Attempt.deleteMany({ examTitle: /Phase 8/ });
    await Exam.deleteMany({ title: /Phase 8/ });
    await Question.deleteMany({ topic: /P8/ });
    await User.deleteMany({ email: /@test-phase8\.dev$/ });
    await Batch.deleteMany({ name: /TEST-P8/ });
    await Subject.deleteMany({ code: /TEST-P8/ });

    const passwordHash = await hashPassword("Password123");

    // 1. Batches
    batch1 = await Batch.create({ name: "TEST-P8-BATCH1", year: 2026 });
    batch2 = await Batch.create({ name: "TEST-P8-BATCH2", year: 2026 });

    // 2. Subjects
    subject1 = await Subject.create({
      name: "Phase 8 Database Engineering",
      code: "TEST-P8-CS301",
    });
    await Subject.create({
      name: "Phase 8 Operating Systems",
      code: "TEST-P8-CS302",
    });

    // 3. Users
    await User.create({
      name: "Phase8 Admin",
      email: "admin@test-phase8.dev",
      passwordHash,
      role: "admin",
    });

    teacher1 = await User.create({
      name: "Phase8 Teacher 1",
      email: "teacher1@test-phase8.dev",
      passwordHash,
      role: "teacher",
    });

    await User.create({
      name: "Phase8 Teacher 2",
      email: "teacher2@test-phase8.dev",
      passwordHash,
      role: "teacher",
    });

    student1 = await User.create({
      name: "Phase8 Student 1",
      email: "student1@test-phase8.dev",
      passwordHash,
      role: "student",
      batchId: batch1._id,
      rollNumber: "P8-001",
    });

    student2 = await User.create({
      name: "Phase8 Student 2",
      email: "student2@test-phase8.dev",
      passwordHash,
      role: "student",
      batchId: batch1._id,
      rollNumber: "P8-002",
    });

    student3 = await User.create({
      name: "Phase8 Student 3",
      email: "student3@test-phase8.dev",
      passwordHash,
      role: "student",
      batchId: batch2._id,
      rollNumber: "P8-003",
    });

    student4 = await User.create({
      name: "Phase8 Student 4",
      email: "student4@test-phase8.dev",
      passwordHash,
      role: "student",
      batchId: batch2._id,
      rollNumber: "P8-004",
    });

    // 4. Questions
    const q1 = await Question.create({
      subjectId: subject1._id,
      topic: "P8-Indexing",
      type: "single",
      text: "Which index type is optimal for equality queries?",
      options: [
        { key: "A", text: "Hash Index" },
        { key: "B", text: "Linear Search" },
      ],
      correctKeys: ["A"],
      explanation: "Hash indexes offer O(1) point lookups.",
      difficulty: "easy",
      defaultMarks: 2,
      createdBy: teacher1._id,
    });

    const q2 = await Question.create({
      subjectId: subject1._id,
      topic: "P8-Indexing",
      type: "single",
      text: "What structure do relational DBs typically use for range index queries?",
      options: [
        { key: "A", text: "B+ Tree" },
        { key: "B", text: "Linked List" },
      ],
      correctKeys: ["A"],
      explanation: "B+ trees keep leaf nodes linked in order.",
      difficulty: "medium",
      defaultMarks: 2,
      createdBy: teacher1._id,
    });

    const q3 = await Question.create({
      subjectId: subject1._id,
      topic: "P8-Transactions",
      type: "single",
      text: "What does Isolation in ACID guarantee?",
      options: [
        { key: "A", text: "Serializability" },
        { key: "B", text: "Durability" },
      ],
      correctKeys: ["A"],
      explanation:
        "Isolation ensures concurrent execution yields equivalent serial outcomes.",
      difficulty: "medium",
      defaultMarks: 2,
      createdBy: teacher1._id,
    });

    const q4 = await Question.create({
      subjectId: subject1._id,
      topic: "P8-Normalization",
      type: "single",
      text: "Which normal form removes transitive dependencies?",
      options: [
        { key: "A", text: "3NF" },
        { key: "B", text: "1NF" },
      ],
      correctKeys: ["A"],
      explanation: "3NF eliminates transitive functional dependencies.",
      difficulty: "hard",
      defaultMarks: 2,
      createdBy: teacher1._id,
    });

    // 5. Exams
    const now = Date.now();
    exam1 = await Exam.create({
      title: "Phase 8 DBMS Midterm Evaluation",
      subjectId: subject1._id,
      createdBy: teacher1._id,
      batchIds: [batch1._id, batch2._id],
      startTime: new Date(now - 48 * 3600 * 1000),
      endTime: new Date(now - 46 * 3600 * 1000),
      durationMinutes: 45,
      passPercentage: 40,
      status: "published",
      totalMarks: 8,
      questions: [q1, q2, q3, q4].map((q) => ({
        sourceQuestionId: q._id,
        type: q.type,
        text: q.text,
        options: q.options,
        correctKeys: q.correctKeys,
        explanation: q.explanation,
        topic: q.topic,
        difficulty: q.difficulty,
        marks: q.defaultMarks,
      })),
    });

    exam2 = await Exam.create({
      title: "Phase 8 DBMS Unit Assessment",
      subjectId: subject1._id,
      createdBy: teacher1._id,
      batchIds: [batch1._id],
      startTime: new Date(now - 24 * 3600 * 1000),
      endTime: new Date(now - 22 * 3600 * 1000),
      durationMinutes: 30,
      passPercentage: 40,
      status: "published",
      totalMarks: 4,
      questions: [q1, q2].map((q) => ({
        sourceQuestionId: q._id,
        type: q.type,
        text: q.text,
        options: q.options,
        correctKeys: q.correctKeys,
        explanation: q.explanation,
        topic: q.topic,
        difficulty: q.difficulty,
        marks: q.defaultMarks,
      })),
    });

    liveExam = await Exam.create({
      title: "Phase 8 DBMS Live Quiz",
      subjectId: subject1._id,
      createdBy: teacher1._id,
      batchIds: [batch1._id],
      startTime: new Date(now - 30 * 60 * 1000),
      endTime: new Date(now + 60 * 60 * 1000),
      durationMinutes: 30,
      passPercentage: 40,
      status: "published",
      totalMarks: 4,
      questions: [q1, q2].map((q) => ({
        sourceQuestionId: q._id,
        type: q.type,
        text: q.text,
        options: q.options,
        correctKeys: q.correctKeys,
        explanation: q.explanation,
        topic: q.topic,
        difficulty: q.difficulty,
        marks: q.defaultMarks,
      })),
    });

    // 6. Attempts
    // Student 1 on Exam 1: 4/4 correct (8/8 = 100%), 1200s, 0 switches
    const s1AnswersE1 = [
      { questionId: exam1.questions[0]._id, selectedKeys: ["A"] },
      { questionId: exam1.questions[1]._id, selectedKeys: ["A"] },
      { questionId: exam1.questions[2]._id, selectedKeys: ["A"] },
      { questionId: exam1.questions[3]._id, selectedKeys: ["A"] },
    ];
    const s1ResE1 = gradeAttempt({
      examQuestions: exam1.questions,
      answers: s1AnswersE1,
      rules: { passPercentage: 40, totalMarks: 8 },
      startedAt: new Date(exam1.startTime.getTime() + 60000),
      submittedAt: new Date(exam1.startTime.getTime() + 1260000),
      expiresAt: new Date(exam1.startTime.getTime() + 45 * 60000),
    });
    await Attempt.create({
      examId: exam1._id,
      studentId: student1._id,
      subjectId: subject1._id,
      teacherId: teacher1._id,
      batchId: batch1._id,
      examTitle: exam1.title,
      status: "submitted",
      submitReason: "manual",
      startedAt: new Date(exam1.startTime.getTime() + 60000),
      expiresAt: new Date(exam1.startTime.getTime() + 45 * 60000),
      submittedAt: new Date(exam1.startTime.getTime() + 1260000),
      answers: s1AnswersE1,
      tabSwitchCount: 0,
      result: s1ResE1,
    });

    // Student 2 on Exam 1: 2/4 correct (4/8 = 50%), 1400s, 4 switches (Flagged)
    const s2AnswersE1 = [
      { questionId: exam1.questions[0]._id, selectedKeys: ["A"] },
      { questionId: exam1.questions[1]._id, selectedKeys: ["A"] },
      { questionId: exam1.questions[2]._id, selectedKeys: ["B"] },
      { questionId: exam1.questions[3]._id, selectedKeys: ["B"] },
    ];
    const s2ResE1 = gradeAttempt({
      examQuestions: exam1.questions,
      answers: s2AnswersE1,
      rules: { passPercentage: 40, totalMarks: 8 },
      startedAt: new Date(exam1.startTime.getTime() + 60000),
      submittedAt: new Date(exam1.startTime.getTime() + 1460000),
      expiresAt: new Date(exam1.startTime.getTime() + 45 * 60000),
    });
    await Attempt.create({
      examId: exam1._id,
      studentId: student2._id,
      subjectId: subject1._id,
      teacherId: teacher1._id,
      batchId: batch1._id,
      examTitle: exam1.title,
      status: "submitted",
      submitReason: "manual",
      startedAt: new Date(exam1.startTime.getTime() + 60000),
      expiresAt: new Date(exam1.startTime.getTime() + 45 * 60000),
      submittedAt: new Date(exam1.startTime.getTime() + 1460000),
      answers: s2AnswersE1,
      tabSwitchCount: 4,
      result: s2ResE1,
    });

    // Student 3 on Exam 1: 1/4 correct (2/8 = 25%), 900s, 1 switch
    const s3AnswersE1 = [
      { questionId: exam1.questions[0]._id, selectedKeys: ["A"] },
      { questionId: exam1.questions[1]._id, selectedKeys: ["B"] },
      { questionId: exam1.questions[2]._id, selectedKeys: ["B"] },
      { questionId: exam1.questions[3]._id, selectedKeys: ["B"] },
    ];
    const s3ResE1 = gradeAttempt({
      examQuestions: exam1.questions,
      answers: s3AnswersE1,
      rules: { passPercentage: 40, totalMarks: 8 },
      startedAt: new Date(exam1.startTime.getTime() + 60000),
      submittedAt: new Date(exam1.startTime.getTime() + 960000),
      expiresAt: new Date(exam1.startTime.getTime() + 45 * 60000),
    });
    await Attempt.create({
      examId: exam1._id,
      studentId: student3._id,
      subjectId: subject1._id,
      teacherId: teacher1._id,
      batchId: batch2._id,
      examTitle: exam1.title,
      status: "submitted",
      submitReason: "manual",
      startedAt: new Date(exam1.startTime.getTime() + 60000),
      expiresAt: new Date(exam1.startTime.getTime() + 45 * 60000),
      submittedAt: new Date(exam1.startTime.getTime() + 960000),
      answers: s3AnswersE1,
      tabSwitchCount: 1,
      result: s3ResE1,
    });

    // Student 1 on Exam 2: 1/2 correct (2/4 = 50%), 600s
    const s1AnswersE2 = [
      { questionId: exam2.questions[0]._id, selectedKeys: ["A"] },
      { questionId: exam2.questions[1]._id, selectedKeys: ["B"] },
    ];
    const s1ResE2 = gradeAttempt({
      examQuestions: exam2.questions,
      answers: s1AnswersE2,
      rules: { passPercentage: 40, totalMarks: 4 },
      startedAt: new Date(exam2.startTime.getTime() + 60000),
      submittedAt: new Date(exam2.startTime.getTime() + 660000),
      expiresAt: new Date(exam2.startTime.getTime() + 30 * 60000),
    });
    await Attempt.create({
      examId: exam2._id,
      studentId: student1._id,
      subjectId: subject1._id,
      teacherId: teacher1._id,
      batchId: batch1._id,
      examTitle: exam2.title,
      status: "submitted",
      submitReason: "manual",
      startedAt: new Date(exam2.startTime.getTime() + 60000),
      expiresAt: new Date(exam2.startTime.getTime() + 30 * 60000),
      submittedAt: new Date(exam2.startTime.getTime() + 660000),
      answers: s1AnswersE2,
      tabSwitchCount: 0,
      result: s1ResE2,
    });

    // Student 2 on Exam 2: 0/2 correct (0/4 = 0%), 400s (At Risk: recent average = (50+0)/2 = 25% < 40%)
    const s2AnswersE2 = [
      { questionId: exam2.questions[0]._id, selectedKeys: ["B"] },
      { questionId: exam2.questions[1]._id, selectedKeys: ["B"] },
    ];
    const s2ResE2 = gradeAttempt({
      examQuestions: exam2.questions,
      answers: s2AnswersE2,
      rules: { passPercentage: 40, totalMarks: 4 },
      startedAt: new Date(exam2.startTime.getTime() + 60000),
      submittedAt: new Date(exam2.startTime.getTime() + 460000),
      expiresAt: new Date(exam2.startTime.getTime() + 30 * 60000),
    });
    await Attempt.create({
      examId: exam2._id,
      studentId: student2._id,
      subjectId: subject1._id,
      teacherId: teacher1._id,
      batchId: batch1._id,
      examTitle: exam2.title,
      status: "submitted",
      submitReason: "manual",
      startedAt: new Date(exam2.startTime.getTime() + 60000),
      expiresAt: new Date(exam2.startTime.getTime() + 30 * 60000),
      submittedAt: new Date(exam2.startTime.getTime() + 460000),
      answers: s2AnswersE2,
      tabSwitchCount: 0,
      result: s2ResE2,
    });

    // Logins
    const adminLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@test-phase8.dev", password: "Password123" });
    adminCookie = adminLogin.headers["set-cookie"]?.[0] || "";

    const t1Login = await request(app)
      .post("/api/auth/login")
      .send({ email: "teacher1@test-phase8.dev", password: "Password123" });
    teacher1Cookie = t1Login.headers["set-cookie"]?.[0] || "";

    const t2Login = await request(app)
      .post("/api/auth/login")
      .send({ email: "teacher2@test-phase8.dev", password: "Password123" });
    teacher2Cookie = t2Login.headers["set-cookie"]?.[0] || "";

    const s1Login = await request(app)
      .post("/api/auth/login")
      .send({ email: "student1@test-phase8.dev", password: "Password123" });
    student1Cookie = s1Login.headers["set-cookie"]?.[0] || "";

    await request(app)
      .post("/api/auth/login")
      .send({ email: "student2@test-phase8.dev", password: "Password123" });

    const s4Login = await request(app)
      .post("/api/auth/login")
      .send({ email: "student4@test-phase8.dev", password: "Password123" });
    student4Cookie = s4Login.headers["set-cookie"]?.[0] || "";
  });

  afterAll(async () => {
    await Attempt.deleteMany({ examTitle: /Phase 8/ });
    await Exam.deleteMany({ title: /Phase 8/ });
    await Question.deleteMany({ topic: /P8/ });
    await User.deleteMany({ email: /@test-phase8\.dev$/ });
    await Batch.deleteMany({ name: /TEST-P8/ });
    await Subject.deleteMany({ code: /TEST-P8/ });
  });

  describe("GET /api/analytics/students/:id", () => {
    it("returns student performance bundle with KPIs, trend, subjects, and topics", async () => {
      const res = await request(app)
        .get(`/api/analytics/students/${student1._id}`)
        .set("Cookie", student1Cookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const data = res.body.data;
      expect(data.overview.examsTaken).toBe(2);
      expect(data.overview.averagePercentage).toBe(75);
      expect(data.overview.bestScore).toBe(100);
      expect(data.overview.latestScore).toBe(50);

      expect(data.trend).toHaveLength(2);
      expect(data.trend[0].percentage).toBe(100);
      expect(typeof data.trend[0].batchAvg).toBe("number");

      expect(data.subjects).toHaveLength(1);
      expect(data.subjects[0].subjectCode).toBe("TEST-P8-CS301");
      expect(data.subjects[0].averagePercentage).toBe(75);

      expect(data.topics).toBeDefined();
      expect(Array.isArray(data.topics.strengths)).toBe(true);
      expect(Array.isArray(data.topics.weaknesses)).toBe(true);
      expect(data.topics.strengths).toHaveLength(0);
      expect(
        data.topics.insufficientData.some((t) => t.topic === "P8-Indexing"),
      ).toBe(true);

      expect(data.improvement.direction).toBe("neutral");
      expect(data.improvement.available).toBe(false);
      expect(data.improvement.requiredAttempts).toBe(6);

      expect(data.timeEfficiency.averageTimeTakenSeconds).toBe(900);
      expect(data.timeEfficiency.efficiencyPercentage).toBeGreaterThan(0);

      expect(data.trend[0].batchAvg).toBe(75);
      expect(data.trend[1].batchAvg).toBe(25);
    });

    it("allows 'me' alias for authenticated student", async () => {
      const res = await request(app)
        .get("/api/analytics/students/me")
        .set("Cookie", student1Cookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.overview.examsTaken).toBe(2);
    });

    it("rejects student accessing another student's analytics with 403", async () => {
      const res = await request(app)
        .get(`/api/analytics/students/${student2._id}`)
        .set("Cookie", student1Cookie);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it("allows teacher to view analytics for candidate in their exams", async () => {
      const res = await request(app)
        .get(`/api/analytics/students/${student1._id}`)
        .set("Cookie", teacher1Cookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.overview.examsTaken).toBe(2);
    });

    it("rejects teacher access when the student never attempted their exams", async () => {
      const res = await request(app)
        .get(`/api/analytics/students/${student4._id}`)
        .set("Cookie", teacher1Cookie);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });

    it("returns clean empty-state structure without errors for student with zero attempts", async () => {
      const res = await request(app)
        .get(`/api/analytics/students/${student4._id}`)
        .set("Cookie", student4Cookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const data = res.body.data;
      expect(data.overview.examsTaken).toBe(0);
      expect(data.overview.averagePercentage).toBe(0);
      expect(data.trend).toHaveLength(0);
      expect(data.subjects).toHaveLength(0);
      expect(data.topics.strengths).toHaveLength(0);
      expect(data.topics.insufficientData).toHaveLength(0);
      expect(data.improvement.direction).toBe("neutral");
      expect(data.timeEfficiency.efficiencyPercentage).toBe(0);
    });
  });

  describe("GET /api/analytics/exams/:id", () => {
    it("returns exam statistics, distribution histogram, and integrity flags", async () => {
      const res = await request(app)
        .get(`/api/analytics/exams/${exam1._id}`)
        .set("Cookie", teacher1Cookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const data = res.body.data;
      expect(data.participation.eligibleCount).toBe(4); // student 1, 2 (batch1) + student 3, 4 (batch2)
      expect(data.participation.attemptedCount).toBe(3); // student 1, 2, 3 attempted
      expect(data.participation.submittedCount).toBe(3);
      expect(data.participation.participationRate).toBe(75);

      // Score Stats
      expect(data.stats.highest).toBe(100);
      expect(data.stats.lowest).toBe(25);
      expect(data.stats.median).toBe(50);
      expect(data.stats.average).toBe(58.3);
      expect(typeof data.stats.standardDeviation).toBe("number");

      // Pass Rate (passPercentage = 40; passed: 100%, 50%; failed: 25%)
      expect(data.passRate.passedCount).toBe(2);
      expect(data.passRate.failedCount).toBe(1);
      expect(data.passRate.passPercentage).toBe(66.7);

      // 10 Distribution Buckets
      expect(data.distribution).toHaveLength(10);
      const totalInBuckets = data.distribution.reduce(
        (acc, b) => acc + b.count,
        0,
      );
      expect(totalInBuckets).toBe(3);

      // Flagged attempts (tabSwitchCount >= 3)
      expect(data.flagged.count).toBe(1);
      expect(data.flagged.attempts[0].student.name).toBe("Phase8 Student 2");
      expect(data.flagged.attempts[0].tabSwitchCount).toBe(4);
      expect(data.avgTime.distribution).toHaveLength(4);
    });

    it("rejects non-owner teacher from reading exam analytics with 403", async () => {
      const res = await request(app)
        .get(`/api/analytics/exams/${exam1._id}`)
        .set("Cookie", teacher2Cookie);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it("allows admin to read any exam analytics", async () => {
      const res = await request(app)
        .get(`/api/analytics/exams/${exam1._id}`)
        .set("Cookie", adminCookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.participation.attemptedCount).toBe(3);
    });

    it("returns stable zero-value shapes for an exam without attempts", async () => {
      const res = await request(app)
        .get(`/api/analytics/exams/${liveExam._id}`)
        .set("Cookie", teacher1Cookie);

      expect(res.status).toBe(200);
      expect(res.body.data.participation.attemptedCount).toBe(0);
      expect(res.body.data.stats.average).toBe(0);
      expect(res.body.data.distribution).toHaveLength(10);
      expect(
        res.body.data.distribution.every((bucket) => bucket.count === 0),
      ).toBe(true);
    });
  });

  describe("GET /api/analytics/exams/:id/questions", () => {
    it("returns question difficulty, option distribution, and discrimination index", async () => {
      const res = await request(app)
        .get(`/api/analytics/exams/${exam1._id}/questions`)
        .set("Cookie", teacher1Cookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data).toHaveLength(4);

      const q1Stats = res.body.data[0];
      expect(q1Stats.correctCount).toBe(3); // All 3 students got Q1 correct
      expect(q1Stats.correctPct).toBe(100);
      expect(q1Stats.observedDifficulty).toBe("easy");
      expect(q1Stats.optionCounts.A).toBe(3);

      const q4Stats = res.body.data[3];
      expect(q4Stats.correctCount).toBe(1); // Only Student 1 got Q4 correct
      expect(q4Stats.correctPct).toBe(33.3);
      expect(q4Stats.observedDifficulty).toBe("hard");
    });

    it("does not label unanswered analytics as hard before anyone attempts", async () => {
      const res = await request(app)
        .get(`/api/analytics/exams/${liveExam._id}/questions`)
        .set("Cookie", teacher1Cookie);

      expect(res.status).toBe(200);
      expect(res.body.data[0].observedDifficulty).toBeNull();
      expect(res.body.data[0].difficultyMismatch).toBe(false);
    });
  });

  describe("GET /api/analytics/subjects/:id", () => {
    it("returns subject performance over time, batch comparisons, and topic accuracy", async () => {
      const res = await request(app)
        .get(`/api/analytics/subjects/${subject1._id}`)
        .set("Cookie", teacher1Cookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const data = res.body.data;
      expect(data.subjectCode).toBe("TEST-P8-CS301");
      expect(data.overTime).toHaveLength(2); // exam1 and exam2
      expect(data.batchComparison.length).toBeGreaterThanOrEqual(1);
      expect(Array.isArray(data.topicTable)).toBe(true);
      expect(data.topicTable.some((t) => t.topic === "P8-Indexing")).toBe(true);
    });

    it("applies the optional batch filter without mixing another teacher's data", async () => {
      const filtered = await request(app)
        .get(`/api/analytics/subjects/${subject1._id}?batchId=${batch1._id}`)
        .set("Cookie", teacher1Cookie);
      const foreign = await request(app)
        .get(`/api/analytics/subjects/${subject1._id}`)
        .set("Cookie", teacher2Cookie);

      expect(filtered.status).toBe(200);
      expect(filtered.body.data.overTime).toHaveLength(2);
      expect(
        filtered.body.data.overTime.every((exam) => exam.attemptCount === 2),
      ).toBe(true);
      expect(foreign.status).toBe(403);
    });
  });

  describe("GET /api/analytics/teacher/overview", () => {
    it("returns teacher dashboard KPIs, active exams, batch comparisons, and at-risk students", async () => {
      const res = await request(app)
        .get("/api/analytics/teacher/overview")
        .set("Cookie", teacher1Cookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const data = res.body.data;
      expect(data.totalExams).toBe(3);
      expect(data.activeExams).toBe(1); // exam3Live
      expect(data.totalSubmissions).toBe(5); // 3 on exam1, 2 on exam2
      expect(data.avgPassRate).toBeGreaterThan(0);
      expect(data.avgPassRate).toBe(58.3);
      expect(data.recentExams.length).toBeLessThanOrEqual(5);

      // Student 2 has recent scores of 50% on exam1 and 0% on exam2 (mean = 25% < 40%) -> flagged as at-risk
      expect(
        data.atRisk.some((s) => s.studentName === "Phase8 Student 2"),
      ).toBe(true);
    });

    it("rejects student accessing teacher overview with 403", async () => {
      const res = await request(app)
        .get("/api/analytics/teacher/overview")
        .set("Cookie", student1Cookie);

      expect(res.status).toBe(403);
    });
  });

  describe("GET /api/analytics/admin/overview", () => {
    it("returns platform KPIs, users by role, exams by status, and daily activity", async () => {
      const res = await request(app)
        .get("/api/analytics/admin/overview")
        .set("Cookie", adminCookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const data = res.body.data;
      expect(data.usersByRole.admin).toBeGreaterThanOrEqual(1);
      expect(data.usersByRole.teacher).toBeGreaterThanOrEqual(2);
      expect(data.usersByRole.student).toBeGreaterThanOrEqual(4);

      expect(data.examsByStatus.published).toBeGreaterThanOrEqual(3);

      expect(data.attemptsPerDay).toHaveLength(14);
      const totalAttempts = data.attemptsPerDay.reduce(
        (acc, d) => acc + d.count,
        0,
      );
      expect(totalAttempts).toBeGreaterThanOrEqual(5);

      expect(Array.isArray(data.avgBySubject)).toBe(true);
      expect(
        data.avgBySubject.some((s) => s.subjectCode === "TEST-P8-CS301"),
      ).toBe(true);
    });

    it("rejects non-admin accessing admin overview with 403", async () => {
      const res = await request(app)
        .get("/api/analytics/admin/overview")
        .set("Cookie", student1Cookie);

      expect(res.status).toBe(403);
    });
  });

  describe("Pipeline Index Utilization", () => {
    it("utilizes indexed scans on student history and exam attempts queries", async () => {
      const studentExplain = await Attempt.find({
        studentId: student1._id,
        status: "submitted",
      })
        .sort({ submittedAt: -1 })
        .explain("executionStats");

      const studentPlan = JSON.stringify(
        studentExplain.executionStats || studentExplain.queryPlanner,
      );
      expect(studentPlan).toMatch(/IXSCAN|studentId_1/);

      const examExplain = await Attempt.find({
        examId: exam1._id,
        status: "submitted",
      })
        .sort({ "result.score": -1 })
        .explain("executionStats");

      const examPlan = JSON.stringify(
        examExplain.executionStats || examExplain.queryPlanner,
      );
      expect(examPlan).toMatch(/IXSCAN|examId_1/);

      const teacherExplain = await Attempt.find({
        teacherId: teacher1._id,
        status: "submitted",
      }).explain("executionStats");
      const teacherPlan = JSON.stringify(
        teacherExplain.executionStats || teacherExplain.queryPlanner,
      );
      expect(teacherPlan).toMatch(/IXSCAN|teacherId_1_status_1/);

      const subjectExplain = await Attempt.find({
        subjectId: subject1._id,
        status: "submitted",
      }).explain("executionStats");
      const subjectPlan = JSON.stringify(
        subjectExplain.executionStats || subjectExplain.queryPlanner,
      );
      expect(subjectPlan).toMatch(/IXSCAN|subjectId_1_status_1/);
    });
  });
});

describe("Phase 8 analytics math", () => {
  it("compares the last three results with the previous three", () => {
    const attempts = [20, 40, 60, 70, 80, 90].map((percentage) => ({
      result: { percentage },
    }));

    expect(calculateImprovement(attempts)).toEqual({
      recentAvg: 80,
      previousAvg: 40,
      delta: 40,
      direction: "up",
      available: true,
      requiredAttempts: 6,
    });
    expect(calculateImprovement(attempts.slice(0, 5)).available).toBe(false);
  });

  it("places exact ten-point boundaries in the next histogram bucket", () => {
    const distribution = buildPercentageDistribution([
      0, 9.99, 10, 20, 99.9, 100,
    ]);

    expect(distribution[0].count).toBe(2);
    expect(distribution[1].count).toBe(1);
    expect(distribution[2].count).toBe(1);
    expect(distribution[9].count).toBe(2);
  });
});
