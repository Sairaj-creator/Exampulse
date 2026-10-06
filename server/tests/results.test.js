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

describe("Results, Review, and Leaderboard Integration Tests (Phase 7)", () => {
  let app;
  let teacher;
  let student1;
  let student2;
  let student3;
  let batch;
  let subject;
  let question;
  let teacherCookie;
  let student1Cookie;
  let student2Cookie;
  let student3Cookie;
  let immediateExam;
  let afterEndExam;
  let neverExam;
  let attempt1Immediate;
  let attempt1AfterEnd;

  beforeAll(async () => {
    const env = loadEnv();
    await connectDatabase(
      env.MONGO_URI || "mongodb://127.0.0.1:27017/exampulse",
    );
    app = createApp({ isDatabaseConnected: () => true });

    // Clean fixtures
    await Attempt.deleteMany({ examTitle: /Phase 7/ });
    await Exam.deleteMany({ title: /Phase 7/ });
    await Question.deleteMany({ topic: "Phase 7 Results" });
    await User.deleteMany({ email: /@test-phase7\.dev$/ });
    await Batch.deleteMany({ name: "TEST-P7-BATCH" });
    await Subject.deleteMany({ code: "TEST-P7-SUB" });

    const passwordHash = await hashPassword("Password123");
    batch = await Batch.create({ name: "TEST-P7-BATCH", year: 2028 });

    subject = await Subject.create({
      name: "Phase 7 Performance Systems",
      code: "TEST-P7-SUB",
    });

    teacher = await User.create({
      name: "Phase7 Teacher",
      email: "teacher@test-phase7.dev",
      passwordHash,
      role: "teacher",
    });

    student1 = await User.create({
      name: "Phase7 Student 1",
      email: "student1@test-phase7.dev",
      passwordHash,
      role: "student",
      batchId: batch._id,
      rollNumber: "P7-001",
    });

    student2 = await User.create({
      name: "Phase7 Student 2",
      email: "student2@test-phase7.dev",
      passwordHash,
      role: "student",
      batchId: batch._id,
      rollNumber: "P7-002",
    });

    student3 = await User.create({
      name: "Phase7 Student 3",
      email: "student3@test-phase7.dev",
      passwordHash,
      role: "student",
      batchId: batch._id,
      rollNumber: "P7-003",
    });

    question = await Question.create({
      subjectId: subject._id,
      topic: "Phase 7 Results",
      type: "single",
      text: "Which aggregation stage groups documents?",
      options: [
        { key: "A", text: "$match" },
        { key: "B", text: "$group" },
        { key: "C", text: "$project" },
      ],
      correctKeys: ["B"],
      explanation:
        "$group separates documents into groups according to a group key.",
      difficulty: "easy",
      defaultMarks: 2,
      createdBy: teacher._id,
    });

    // Obtain cookies
    const loginTeacher = await request(app)
      .post("/api/auth/login")
      .send({ email: "teacher@test-phase7.dev", password: "Password123" });
    teacherCookie = loginTeacher.headers["set-cookie"]?.[0] || "";

    const loginS1 = await request(app)
      .post("/api/auth/login")
      .send({ email: "student1@test-phase7.dev", password: "Password123" });
    student1Cookie = loginS1.headers["set-cookie"]?.[0] || "";

    const loginS2 = await request(app)
      .post("/api/auth/login")
      .send({ email: "student2@test-phase7.dev", password: "Password123" });
    student2Cookie = loginS2.headers["set-cookie"]?.[0] || "";

    const loginS3 = await request(app)
      .post("/api/auth/login")
      .send({ email: "student3@test-phase7.dev", password: "Password123" });
    student3Cookie = loginS3.headers["set-cookie"]?.[0] || "";

    // 1. Exam with immediate review policy
    immediateExam = await Exam.create({
      title: "Phase 7 Immediate Review Assessment",
      subjectId: subject._id,
      createdBy: teacher._id,
      batchIds: [batch._id],
      startTime: new Date(Date.now() - 30 * 60 * 1000),
      endTime: new Date(Date.now() + 30 * 60 * 1000),
      durationMinutes: 30,
      passPercentage: 50,
      reviewPolicy: "immediate",
      status: "published",
      totalMarks: 2,
      questions: [
        {
          sourceQuestionId: question._id,
          type: question.type,
          text: question.text,
          options: question.options,
          correctKeys: question.correctKeys,
          explanation: question.explanation,
          topic: question.topic,
          difficulty: question.difficulty,
          marks: 2,
        },
      ],
    });

    // 2. Exam with after_end review policy (currently live)
    afterEndExam = await Exam.create({
      title: "Phase 7 After-End Review Assessment",
      subjectId: subject._id,
      createdBy: teacher._id,
      batchIds: [batch._id],
      startTime: new Date(Date.now() - 20 * 60 * 1000),
      endTime: new Date(Date.now() + 40 * 60 * 1000),
      durationMinutes: 30,
      passPercentage: 50,
      reviewPolicy: "after_end",
      status: "published",
      totalMarks: 2,
      questions: [
        {
          sourceQuestionId: question._id,
          type: question.type,
          text: question.text,
          options: question.options,
          correctKeys: question.correctKeys,
          explanation: question.explanation,
          topic: question.topic,
          difficulty: question.difficulty,
          marks: 2,
        },
      ],
    });

    // 3. Exam with never review policy
    neverExam = await Exam.create({
      title: "Phase 7 Never Review Assessment",
      subjectId: subject._id,
      createdBy: teacher._id,
      batchIds: [batch._id],
      startTime: new Date(Date.now() - 60 * 60 * 1000),
      endTime: new Date(Date.now() - 10 * 60 * 1000), // ended
      durationMinutes: 30,
      passPercentage: 50,
      reviewPolicy: "never",
      status: "published",
      totalMarks: 2,
      questions: [
        {
          sourceQuestionId: question._id,
          type: question.type,
          text: question.text,
          options: question.options,
          correctKeys: question.correctKeys,
          explanation: question.explanation,
          topic: question.topic,
          difficulty: question.difficulty,
          marks: 2,
        },
      ],
    });

    // Seed attempts on immediateExam:
    // S1: 2 marks, 60s
    attempt1Immediate = await Attempt.create({
      examId: immediateExam._id,
      studentId: student1._id,
      subjectId: subject._id,
      teacherId: teacher._id,
      batchId: batch._id,
      examTitle: immediateExam.title,
      status: "submitted",
      submitReason: "manual",
      startedAt: new Date(Date.now() - 120000),
      expiresAt: new Date(Date.now() + 1800000),
      submittedAt: new Date(Date.now() - 60000),
      answers: [
        { questionId: immediateExam.questions[0]._id, selectedKeys: ["B"] },
      ],
      result: {
        score: 2,
        totalMarks: 2,
        percentage: 100,
        passed: true,
        correctCount: 1,
        wrongCount: 0,
        unansweredCount: 0,
        timeTakenSeconds: 60,
        evaluations: [
          {
            questionId: immediateExam.questions[0]._id,
            sourceQuestionId: question._id,
            topic: question.topic,
            difficulty: question.difficulty,
            selectedKeys: ["B"],
            correctKeys: ["B"],
            isCorrect: true,
            marksAwarded: 2,
          },
        ],
      },
    });

    // S2: 0 marks (wrong answer), 80s
    await Attempt.create({
      examId: immediateExam._id,
      studentId: student2._id,
      subjectId: subject._id,
      teacherId: teacher._id,
      batchId: batch._id,
      examTitle: immediateExam.title,
      status: "submitted",
      submitReason: "manual",
      startedAt: new Date(Date.now() - 120000),
      expiresAt: new Date(Date.now() + 1800000),
      submittedAt: new Date(Date.now() - 40000),
      answers: [
        { questionId: immediateExam.questions[0]._id, selectedKeys: ["A"] },
      ],
      result: {
        score: 0,
        totalMarks: 2,
        percentage: 0,
        passed: false,
        correctCount: 0,
        wrongCount: 1,
        unansweredCount: 0,
        timeTakenSeconds: 80,
        evaluations: [
          {
            questionId: immediateExam.questions[0]._id,
            sourceQuestionId: question._id,
            topic: question.topic,
            difficulty: question.difficulty,
            selectedKeys: ["A"],
            correctKeys: ["B"],
            isCorrect: false,
            marksAwarded: 0,
          },
        ],
      },
    });

    // Seed attempt on afterEndExam (currently live)
    attempt1AfterEnd = await Attempt.create({
      examId: afterEndExam._id,
      studentId: student1._id,
      subjectId: subject._id,
      teacherId: teacher._id,
      batchId: batch._id,
      examTitle: afterEndExam.title,
      status: "submitted",
      submitReason: "manual",
      startedAt: new Date(Date.now() - 120000),
      expiresAt: new Date(Date.now() + 1800000),
      submittedAt: new Date(Date.now() - 30000),
      answers: [
        { questionId: afterEndExam.questions[0]._id, selectedKeys: ["B"] },
      ],
      result: {
        score: 2,
        totalMarks: 2,
        percentage: 100,
        passed: true,
        correctCount: 1,
        wrongCount: 0,
        unansweredCount: 0,
        timeTakenSeconds: 90,
        evaluations: [
          {
            questionId: afterEndExam.questions[0]._id,
            sourceQuestionId: question._id,
            topic: question.topic,
            difficulty: question.difficulty,
            selectedKeys: ["B"],
            correctKeys: ["B"],
            isCorrect: true,
            marksAwarded: 2,
          },
        ],
      },
    });

    // S3: 2 marks, 60s (tied with S1)
    await Attempt.create({
      examId: immediateExam._id,
      studentId: student3._id,
      subjectId: subject._id,
      teacherId: teacher._id,
      batchId: batch._id,
      examTitle: immediateExam.title,
      status: "submitted",
      submitReason: "manual",
      startedAt: new Date(Date.now() - 120000),
      expiresAt: new Date(Date.now() + 1800000),
      submittedAt: new Date(Date.now() - 60000),
      answers: [
        { questionId: immediateExam.questions[0]._id, selectedKeys: ["B"] },
      ],
      result: {
        score: 2,
        totalMarks: 2,
        percentage: 100,
        passed: true,
        correctCount: 1,
        wrongCount: 0,
        unansweredCount: 0,
        timeTakenSeconds: 60,
        evaluations: [
          {
            questionId: immediateExam.questions[0]._id,
            sourceQuestionId: question._id,
            topic: question.topic,
            difficulty: question.difficulty,
            selectedKeys: ["B"],
            correctKeys: ["B"],
            isCorrect: true,
            marksAwarded: 2,
          },
        ],
      },
    });
  });

  afterAll(async () => {
    await Attempt.deleteMany({ examTitle: /Phase 7/ });
    await Exam.deleteMany({ title: /Phase 7/ });
    await Question.deleteMany({ topic: "Phase 7 Results" });
    await User.deleteMany({ email: /@test-phase7\.dev$/ });
    await Batch.deleteMany({ name: "TEST-P7-BATCH" });
    await Subject.deleteMany({ code: "TEST-P7-SUB" });
  });

  it("serves immediate full review with correct keys and explanation", async () => {
    const res = await request(app)
      .get(`/api/attempts/${attempt1Immediate._id}/result`)
      .set("Cookie", student1Cookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.allowFullReview).toBe(true);
    expect(res.body.data.result.score).toBe(2);
    expect(res.body.data.result.percentage).toBe(100);

    const eval0 = res.body.data.result.evaluations[0];
    expect(eval0.correctKeys).toEqual(["B"]);
    expect(eval0.explanation).toBeDefined();
    expect(eval0.isCorrect).toBe(true);

    // Other student attempting to read student1's result is 403 Forbidden
    const unauthRes = await request(app)
      .get(`/api/attempts/${attempt1Immediate._id}/result`)
      .set("Cookie", student2Cookie);
    expect(unauthRes.status).toBe(403);
  });

  it("returns score-only while after_end review is locked, then unlocks the review", async () => {
    const res = await request(app)
      .get(`/api/attempts/${attempt1AfterEnd._id}/result`)
      .set("Cookie", student1Cookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.allowFullReview).toBe(false);
    expect(res.body.data.result.score).toBe(2);

    // Question-level correctness must not leak while the exam is live.
    expect(res.body.data.result.evaluations).toEqual([]);

    // Teacher viewing the exact same attempt receives full review
    const teacherRes = await request(app)
      .get(`/api/attempts/${attempt1AfterEnd._id}/result`)
      .set("Cookie", teacherCookie);
    expect(teacherRes.status).toBe(200);
    expect(teacherRes.body.data.allowFullReview).toBe(true);
    expect(teacherRes.body.data.result.evaluations[0].correctKeys).toEqual([
      "B",
    ]);

    await Exam.findByIdAndUpdate(afterEndExam._id, {
      endTime: new Date(Date.now() - 5000),
    });
    const unlockedRes = await request(app)
      .get(`/api/attempts/${attempt1AfterEnd._id}/result`)
      .set("Cookie", student1Cookie);
    expect(unlockedRes.status).toBe(200);
    expect(unlockedRes.body.data.allowFullReview).toBe(true);
    expect(unlockedRes.body.data.result.evaluations[0].correctKeys).toEqual([
      "B",
    ]);
  });

  it("permanently hides solutions for never review policy even after exam has ended", async () => {
    const neverAttempt = await Attempt.create({
      examId: neverExam._id,
      studentId: student1._id,
      subjectId: subject._id,
      teacherId: teacher._id,
      batchId: batch._id,
      examTitle: neverExam.title,
      status: "submitted",
      submitReason: "manual",
      startedAt: new Date(Date.now() - 120000),
      expiresAt: new Date(Date.now() + 1800000),
      submittedAt: new Date(Date.now() - 30000),
      answers: [
        { questionId: neverExam.questions[0]._id, selectedKeys: ["B"] },
      ],
      result: {
        score: 2,
        totalMarks: 2,
        percentage: 100,
        passed: true,
        correctCount: 1,
        wrongCount: 0,
        unansweredCount: 0,
        timeTakenSeconds: 90,
        evaluations: [
          {
            questionId: neverExam.questions[0]._id,
            sourceQuestionId: question._id,
            topic: question.topic,
            difficulty: question.difficulty,
            selectedKeys: ["B"],
            correctKeys: ["B"],
            isCorrect: true,
            marksAwarded: 2,
          },
        ],
      },
    });

    const res = await request(app)
      .get(`/api/attempts/${neverAttempt._id}/result`)
      .set("Cookie", student1Cookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.allowFullReview).toBe(false);
    expect(res.body.data.reviewPolicy).toBe("never");

    expect(res.body.data.result.evaluations).toEqual([]);

    const teacherRes = await request(app)
      .get(`/api/attempts/${neverAttempt._id}/result`)
      .set("Cookie", teacherCookie);
    expect(teacherRes.status).toBe(200);
    expect(teacherRes.body.data.allowFullReview).toBe(true);
    expect(teacherRes.body.data.result.evaluations[0].correctKeys).toEqual([
      "B",
    ]);
  });

  it("lazily finalizes an expired attempt when its result is requested", async () => {
    const expiredAttempt = await Attempt.create({
      examId: neverExam._id,
      studentId: student2._id,
      subjectId: subject._id,
      teacherId: teacher._id,
      batchId: batch._id,
      examTitle: neverExam.title,
      status: "in_progress",
      startedAt: new Date(Date.now() - 40 * 60 * 1000),
      expiresAt: new Date(Date.now() - 10 * 60 * 1000),
      presentation: [
        {
          questionId: neverExam.questions[0]._id,
          optionOrder: ["A", "B", "C"],
        },
      ],
      answers: [
        {
          questionId: neverExam.questions[0]._id,
          selectedKeys: ["B"],
        },
      ],
    });

    const res = await request(app)
      .get(`/api/attempts/${expiredAttempt._id}/result`)
      .set("Cookie", student2Cookie);

    expect(res.status).toBe(200);
    expect(res.body.data.result.score).toBe(2);
    expect(res.body.data.result.evaluations).toEqual([]);
    expect((await Attempt.findById(expiredAttempt._id)).status).toBe(
      "submitted",
    );
  });

  it("keeps result and export access scoped to the exam owner", async () => {
    const otherTeacher = await User.create({
      name: "Phase7 Other Teacher",
      email: "other-teacher@test-phase7.dev",
      passwordHash: await hashPassword("Password123"),
      role: "teacher",
    });
    expect(otherTeacher).toBeDefined();
    const login = await request(app).post("/api/auth/login").send({
      email: "other-teacher@test-phase7.dev",
      password: "Password123",
    });
    const cookie = login.headers["set-cookie"]?.[0] || "";

    const resultRes = await request(app)
      .get(`/api/attempts/${attempt1Immediate._id}/result`)
      .set("Cookie", cookie);
    const exportRes = await request(app)
      .get(`/api/exams/${immediateExam._id}/export`)
      .set("Cookie", cookie);

    expect(resultRes.status).toBe(403);
    expect(exportRes.status).toBe(403);
  });

  it("does not allow an admin to reset a student attempt", async () => {
    await User.create({
      name: "Phase7 Admin",
      email: "admin@test-phase7.dev",
      passwordHash: await hashPassword("Password123"),
      role: "admin",
    });
    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@test-phase7.dev", password: "Password123" });

    const res = await request(app)
      .delete(
        `/api/exams/${immediateExam._id}/attempts/${attempt1Immediate._id}`,
      )
      .set("Cookie", login.headers["set-cookie"]?.[0] || "");

    expect(res.status).toBe(403);
    expect(await Attempt.exists({ _id: attempt1Immediate._id })).not.toBeNull();
  });

  it("lists student's personal submitted attempts history", async () => {
    const res = await request(app)
      .get("/api/attempts/mine")
      .set("Cookie", student1Cookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);

    const titles = res.body.data.map((a) => a.examTitle);
    expect(titles).toContain(immediateExam.title);
    expect(titles).toContain(afterEndExam.title);
  });

  it("enforces timing policy and computes competition ranking on leaderboard", async () => {
    // 1. Live exam leaderboard request by student must be blocked with 403 EXAM_NOT_ENDED
    const liveLeaderboard = await request(app)
      .get(`/api/exams/${immediateExam._id}/leaderboard`)
      .set("Cookie", student1Cookie);
    expect(liveLeaderboard.status).toBe(403);
    expect(liveLeaderboard.body.error.code).toBe("EXAM_NOT_ENDED");

    // 2. Teacher CAN view leaderboard even while live
    const teacherLeaderboard = await request(app)
      .get(`/api/exams/${immediateExam._id}/leaderboard`)
      .set("Cookie", teacherCookie);
    expect(teacherLeaderboard.status).toBe(200);
    expect(teacherLeaderboard.body.data.topEntries).toHaveLength(3);

    // Rank 1: Student 1 and Student 3 tied (score 2, 60s)
    expect(teacherLeaderboard.body.data.topEntries[0].rank).toBe(1);
    expect(teacherLeaderboard.body.data.topEntries[0].score).toBe(2);

    expect(teacherLeaderboard.body.data.topEntries[1].rank).toBe(1);
    expect(teacherLeaderboard.body.data.topEntries[1].score).toBe(2);

    // Rank 3: Student 2 (score 0, 80s) - competition ranking skips rank 2
    expect(teacherLeaderboard.body.data.topEntries[2].rank).toBe(3);
    expect(teacherLeaderboard.body.data.topEntries[2].score).toBe(0);

    // 3. Set immediateExam to ended so students can view
    await Exam.findByIdAndUpdate(immediateExam._id, {
      endTime: new Date(Date.now() - 5000),
    });

    const studentLeaderboard = await request(app)
      .get(`/api/exams/${immediateExam._id}/leaderboard`)
      .set("Cookie", student1Cookie);
    expect(studentLeaderboard.status).toBe(200);
    expect(studentLeaderboard.body.data.myEntry).toBeDefined();
    expect(studentLeaderboard.body.data.myEntry.rank).toBe(1);
    expect(studentLeaderboard.body.data.myEntry.score).toBe(2);

    // Student 3 also sees rank 1
    const s3Leaderboard = await request(app)
      .get(`/api/exams/${immediateExam._id}/leaderboard`)
      .set("Cookie", student3Cookie);
    expect(s3Leaderboard.status).toBe(200);
    expect(s3Leaderboard.body.data.myEntry.rank).toBe(1);
  });

  it("exports exam results as CSV with proper headers and student rows", async () => {
    // Student export attempt must be 403 Forbidden
    const studentExport = await request(app)
      .get(`/api/exams/${immediateExam._id}/export`)
      .set("Cookie", student1Cookie);
    expect(studentExport.status).toBe(403);

    await User.findByIdAndUpdate(student2._id, { name: "=2+2" });

    // Teacher export succeeds
    const teacherExport = await request(app)
      .get(`/api/exams/${immediateExam._id}/export`)
      .set("Cookie", teacherCookie);

    expect(teacherExport.status).toBe(200);
    expect(teacherExport.headers["content-type"]).toContain("text/csv");
    expect(teacherExport.text.charCodeAt(0)).toBe(0xfeff);
    expect(teacherExport.text).toContain(
      "Rank,Student Name,Roll Number,Email,Score,Total Marks",
    );
    expect(teacherExport.text).toContain("Phase7 Student 1");
    expect(teacherExport.text).toContain('"\'=2+2"');
  });
});
