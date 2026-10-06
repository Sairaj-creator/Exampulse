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
import { finalizeExpired } from "../src/services/attemptService.js";

describe("Exam-Taking Engine Integration Tests (Phase 6)", () => {
  let app;
  let teacher;
  let student1;
  let concurrentStudent;
  let sweeperStudent;
  let subject;
  let batch1;
  let batch2;
  let question1;
  let question2;
  let teacherCookie;
  let student1Cookie;
  let student2Cookie;
  let otherStudentCookie;
  let concurrentStudentCookie;
  let eventStudentCookie;
  let liveExam;
  let upcomingExam;
  let endedExam;

  beforeAll(async () => {
    const env = loadEnv();
    await connectDatabase(
      env.MONGO_URI || "mongodb://127.0.0.1:27017/exampulse",
    );
    app = createApp({ isDatabaseConnected: () => true });

    // Clean fixtures
    await Attempt.deleteMany({ examTitle: /Phase 6/ });
    await Exam.deleteMany({ title: /Phase 6/ });
    await Question.deleteMany({ topic: "Phase 6 Engine" });
    await User.deleteMany({ email: /@test-phase6\.dev$/ });
    await Batch.deleteMany({ name: /TEST-P6-/ });
    await Subject.deleteMany({ code: "TEST-P6-SUB" });

    const passwordHash = await hashPassword("Password123");
    batch1 = await Batch.create({ name: "TEST-P6-BATCH-1", year: 2028 });
    batch2 = await Batch.create({ name: "TEST-P6-BATCH-2", year: 2028 });

    subject = await Subject.create({
      name: "Phase 6 Systems",
      code: "TEST-P6-SUB",
    });

    teacher = await User.create({
      name: "Phase6 Teacher",
      email: "teacher@test-phase6.dev",
      passwordHash,
      role: "teacher",
    });

    student1 = await User.create({
      name: "Phase6 Student 1",
      email: "student1@test-phase6.dev",
      passwordHash,
      role: "student",
      batchId: batch1._id,
      rollNumber: "P6-001",
    });

    await User.create({
      name: "Phase6 Student 2",
      email: "student2@test-phase6.dev",
      passwordHash,
      role: "student",
      batchId: batch1._id,
      rollNumber: "P6-002",
    });

    await User.create({
      name: "Phase6 Other Student",
      email: "otherstudent@test-phase6.dev",
      passwordHash,
      role: "student",
      batchId: batch2._id, // assigned to batch2
      rollNumber: "P6-003",
    });

    concurrentStudent = await User.create({
      name: "Phase6 Concurrent Student",
      email: "concurrent@test-phase6.dev",
      passwordHash,
      role: "student",
      batchId: batch1._id,
      rollNumber: "P6-004",
    });

    await User.create({
      name: "Phase6 Event Student",
      email: "event@test-phase6.dev",
      passwordHash,
      role: "student",
      batchId: batch1._id,
      rollNumber: "P6-005",
    });

    sweeperStudent = await User.create({
      name: "Phase6 Sweeper Student",
      email: "sweeper@test-phase6.dev",
      passwordHash,
      role: "student",
      batchId: batch1._id,
      rollNumber: "P6-006",
    });

    question1 = await Question.create({
      subjectId: subject._id,
      topic: "Phase 6 Engine",
      type: "single",
      text: "What does HTTP status 410 mean?",
      options: [
        { key: "A", text: "Gone / Expired" },
        { key: "B", text: "Bad Request" },
        { key: "C", text: "Unauthorized" },
      ],
      correctKeys: ["A"],
      explanation:
        "HTTP 410 Gone indicates the resource is expired permanently.",
      difficulty: "medium",
      defaultMarks: 2,
      createdBy: teacher._id,
    });

    question2 = await Question.create({
      subjectId: subject._id,
      topic: "Phase 6 Engine",
      type: "multiple",
      text: "Which are valid HTTP verbs?",
      options: [
        { key: "A", text: "GET" },
        { key: "B", text: "POST" },
        { key: "C", text: "JUMP" },
      ],
      correctKeys: ["A", "B"],
      explanation: "GET and POST are HTTP verbs.",
      difficulty: "easy",
      defaultMarks: 3,
      createdBy: teacher._id,
    });

    // Login users to obtain session cookies
    const loginTeacher = await request(app)
      .post("/api/auth/login")
      .send({ email: "teacher@test-phase6.dev", password: "Password123" });
    teacherCookie = loginTeacher.headers["set-cookie"]?.[0] || "";

    const loginStudent1 = await request(app)
      .post("/api/auth/login")
      .send({ email: "student1@test-phase6.dev", password: "Password123" });
    student1Cookie = loginStudent1.headers["set-cookie"]?.[0] || "";

    const loginStudent2 = await request(app)
      .post("/api/auth/login")
      .send({ email: "student2@test-phase6.dev", password: "Password123" });
    student2Cookie = loginStudent2.headers["set-cookie"]?.[0] || "";

    const loginOtherStudent = await request(app)
      .post("/api/auth/login")
      .send({ email: "otherstudent@test-phase6.dev", password: "Password123" });
    otherStudentCookie = loginOtherStudent.headers["set-cookie"]?.[0] || "";

    const loginConcurrent = await request(app)
      .post("/api/auth/login")
      .send({ email: "concurrent@test-phase6.dev", password: "Password123" });
    concurrentStudentCookie = loginConcurrent.headers["set-cookie"]?.[0] || "";

    const loginEvent = await request(app)
      .post("/api/auth/login")
      .send({ email: "event@test-phase6.dev", password: "Password123" });
    eventStudentCookie = loginEvent.headers["set-cookie"]?.[0] || "";

    // Create a LIVE published exam assigned to batch1
    const liveStart = new Date(Date.now() - 10 * 60 * 1000); // started 10m ago
    const liveEnd = new Date(Date.now() + 50 * 60 * 1000); // ends in 50m
    liveExam = await Exam.create({
      title: "Phase 6 Live Assessment",
      description: "Live exam testing engine",
      instructions: "No cheating. Timer is enforced by server.",
      subjectId: subject._id,
      createdBy: teacher._id,
      batchIds: [batch1._id],
      startTime: liveStart,
      endTime: liveEnd,
      durationMinutes: 30,
      passPercentage: 40,
      negativeMarking: { enabled: true, penaltyFraction: 0.25 },
      shuffleQuestions: true,
      shuffleOptions: true,
      reviewPolicy: "immediate",
      status: "published",
      totalMarks: 5,
      questions: [
        {
          sourceQuestionId: question1._id,
          type: question1.type,
          text: question1.text,
          options: question1.options,
          correctKeys: question1.correctKeys,
          explanation: question1.explanation,
          topic: question1.topic,
          difficulty: question1.difficulty,
          marks: 2,
        },
        {
          sourceQuestionId: question2._id,
          type: question2.type,
          text: question2.text,
          options: question2.options,
          correctKeys: question2.correctKeys,
          explanation: question2.explanation,
          topic: question2.topic,
          difficulty: question2.difficulty,
          marks: 3,
        },
      ],
      publishedAt: new Date(),
    });

    // Create an UPCOMING exam
    const upStart = new Date(Date.now() + 60 * 60 * 1000);
    const upEnd = new Date(Date.now() + 120 * 60 * 1000);
    upcomingExam = await Exam.create({
      title: "Phase 6 Upcoming Assessment",
      instructions: "Wait for window to open.",
      subjectId: subject._id,
      createdBy: teacher._id,
      batchIds: [batch1._id],
      startTime: upStart,
      endTime: upEnd,
      durationMinutes: 45,
      status: "published",
      totalMarks: 2,
      questions: [
        {
          sourceQuestionId: question1._id,
          type: question1.type,
          text: question1.text,
          options: question1.options,
          correctKeys: question1.correctKeys,
          explanation: question1.explanation,
          marks: 2,
        },
      ],
      publishedAt: new Date(),
    });

    endedExam = await Exam.create({
      title: "Phase 6 Ended Assessment",
      subjectId: subject._id,
      createdBy: teacher._id,
      batchIds: [batch1._id],
      startTime: new Date(Date.now() - 120 * 60 * 1000),
      endTime: new Date(Date.now() - 60 * 60 * 1000),
      durationMinutes: 30,
      status: "published",
      questions: [
        {
          sourceQuestionId: question1._id,
          type: question1.type,
          text: question1.text,
          options: question1.options,
          correctKeys: question1.correctKeys,
          explanation: question1.explanation,
          marks: 2,
        },
      ],
      publishedAt: new Date(),
    });
  });

  afterAll(async () => {
    await Attempt.deleteMany({ examTitle: /Phase 6/ });
    await Exam.deleteMany({ title: /Phase 6/ });
    await Question.deleteMany({ topic: "Phase 6 Engine" });
    await User.deleteMany({ email: /@test-phase6\.dev$/ });
    await Batch.deleteMany({ name: /TEST-P6-/ });
    await Subject.deleteMany({ code: "TEST-P6-SUB" });
  });

  it("lists assigned exams for student with computed phase and attempt status", async () => {
    const res = await request(app)
      .get("/api/student/exams")
      .set("Cookie", student1Cookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);

    const live = res.body.data.find(
      (e) => e._id.toString() === liveExam._id.toString(),
    );
    expect(live).toBeDefined();
    expect(live.phase).toBe("live");
    expect(live.attemptStatus).toBe("not_started");
    expect(live.totalMarks).toBe(5);
    expect(live.questionCount).toBe(2);

    const upcoming = res.body.data.find(
      (e) => e._id.toString() === upcomingExam._id.toString(),
    );
    expect(upcoming).toBeDefined();
    expect(upcoming.phase).toBe("upcoming");

    const endedRes = await request(app)
      .get("/api/student/exams?phase=ended")
      .set("Cookie", student1Cookie);
    expect(endedRes.status).toBe(200);
    expect(endedRes.body.data).toHaveLength(1);
    expect(endedRes.body.data[0]._id).toBe(endedExam._id.toString());

    const invalidPhase = await request(app)
      .get("/api/student/exams?phase=invalid")
      .set("Cookie", student1Cookie);
    expect(invalidPhase.status).toBe(400);

    // Other student (batch2) should see 0 exams
    const otherRes = await request(app)
      .get("/api/student/exams")
      .set("Cookie", otherStudentCookie);
    expect(otherRes.status).toBe(200);
    expect(otherRes.body.data).toHaveLength(0);
  });

  it("returns exam instructions without exposing questions or answers", async () => {
    const res = await request(app)
      .get(`/api/student/exams/${liveExam._id}`)
      .set("Cookie", student1Cookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe("Phase 6 Live Assessment");
    expect(res.body.data.effectiveDurationMinutes).toBe(30);
    expect(res.body.data.totalMarks).toBe(5);
    expect(res.body.data.questionCount).toBe(2);
    expect(res.body.data.questions).toBeUndefined(); // ANTI-LEAK: no questions
    expect(res.body.data.correctKeys).toBeUndefined(); // ANTI-LEAK

    // Student not in batch gets 403 Forbidden
    const unauthRes = await request(app)
      .get(`/api/student/exams/${liveExam._id}`)
      .set("Cookie", otherStudentCookie);
    expect(unauthRes.status).toBe(403);
  });

  it("rejects attempt start on an upcoming exam with 409 EXAM_NOT_LIVE", async () => {
    const res = await request(app)
      .post(`/api/exams/${upcomingExam._id}/attempts`)
      .set("Cookie", student1Cookie);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("EXAM_NOT_LIVE");

    const ended = await request(app)
      .post(`/api/exams/${endedExam._id}/attempts`)
      .set("Cookie", student1Cookie);
    expect(ended.status).toBe(409);
    expect(ended.body.error.code).toBe("EXAM_NOT_LIVE");

    const wrongBatch = await request(app)
      .post(`/api/exams/${liveExam._id}/attempts`)
      .set("Cookie", otherStudentCookie);
    expect(wrongBatch.status).toBe(403);
  });

  it("creates one attempt under concurrent starts and enforces attempt ownership", async () => {
    const [first, second] = await Promise.all([
      request(app)
        .post(`/api/exams/${liveExam._id}/attempts`)
        .set("Cookie", concurrentStudentCookie),
      request(app)
        .post(`/api/exams/${liveExam._id}/attempts`)
        .set("Cookie", concurrentStudentCookie),
    ]);

    expect([first.status, second.status].sort()).toEqual([200, 201]);
    expect(first.body.data.attemptId).toBe(second.body.data.attemptId);
    expect(
      await Attempt.countDocuments({
        examId: liveExam._id,
        studentId: concurrentStudent._id,
      }),
    ).toBe(1);

    const attemptId = first.body.data.attemptId;
    const teacherRead = await request(app)
      .get(`/api/attempts/${attemptId}`)
      .set("Cookie", teacherCookie);
    expect(teacherRead.status).toBe(403);

    const otherStudentSubmit = await request(app)
      .post(`/api/attempts/${attemptId}/submit`)
      .set("Cookie", student1Cookie);
    expect(otherStudentSubmit.status).toBe(403);

    const duplicateKeys = await request(app)
      .put(`/api/attempts/${attemptId}/answers/${liveExam.questions[0]._id}`)
      .set("Cookie", concurrentStudentCookie)
      .send({ selectedKeys: ["A", "A"] });
    expect(duplicateKeys.status).toBe(400);
  });

  it("starts and resumes an attempt idempotently", async () => {
    // 1. First start
    const startRes = await request(app)
      .post(`/api/exams/${liveExam._id}/attempts`)
      .set("Cookie", student1Cookie);

    expect(startRes.status).toBe(201);
    expect(startRes.body.success).toBe(true);
    expect(startRes.body.data.resumed).toBe(false);
    const attemptId = startRes.body.data.attemptId;
    expect(attemptId).toBeDefined();

    // 2. Resume call with same student
    const resumeRes = await request(app)
      .post(`/api/exams/${liveExam._id}/attempts`)
      .set("Cookie", student1Cookie);

    expect(resumeRes.status).toBe(200);
    expect(resumeRes.body.data.resumed).toBe(true);
    expect(resumeRes.body.data.attemptId).toBe(attemptId);
  });

  it("caps a late start at the exam end and accepts saves within the grace window", async () => {
    const endTime = new Date(Date.now() + 2 * 60 * 1000);
    const shortWindowExam = await Exam.create({
      title: "Phase 6 Short Window Assessment",
      subjectId: subject._id,
      createdBy: teacher._id,
      batchIds: [batch1._id],
      startTime: new Date(Date.now() - 60 * 1000),
      endTime,
      durationMinutes: 30,
      status: "published",
      questions: [
        {
          sourceQuestionId: question1._id,
          type: question1.type,
          text: question1.text,
          options: question1.options,
          correctKeys: question1.correctKeys,
          explanation: question1.explanation,
          marks: 2,
        },
      ],
      publishedAt: new Date(),
    });

    const start = await request(app)
      .post(`/api/exams/${shortWindowExam._id}/attempts`)
      .set("Cookie", student1Cookie);
    expect(start.status).toBe(201);
    const attempt = await Attempt.findById(start.body.data.attemptId);
    expect(attempt.expiresAt.getTime()).toBe(endTime.getTime());

    await Attempt.updateOne(
      { _id: attempt._id },
      { expiresAt: new Date(Date.now() - 2000) },
    );
    const graceSave = await request(app)
      .put(
        `/api/attempts/${attempt._id}/answers/${shortWindowExam.questions[0]._id}`,
      )
      .set("Cookie", student1Cookie)
      .send({ selectedKeys: ["A"] });
    expect(graceSave.status).toBe(200);
    expect(graceSave.body.data.remainingSeconds).toBe(0);

    const submit = await request(app)
      .post(`/api/attempts/${attempt._id}/submit`)
      .set("Cookie", student1Cookie);
    expect(submit.status).toBe(200);
    const submitted = await Attempt.findById(attempt._id);
    expect(submitted.submitReason).toBe("timeout");
  });

  it("serves sanitized questions and handles answer saving with review flag", async () => {
    // Get student1 attempt
    const attempt = await Attempt.findOne({
      examId: liveExam._id,
      studentId: student1._id,
    });
    expect(attempt).toBeDefined();

    // GET /api/attempts/:id
    const stateRes = await request(app)
      .get(`/api/attempts/${attempt._id}`)
      .set("Cookie", student1Cookie);

    expect(stateRes.status).toBe(200);
    expect(stateRes.body.success).toBe(true);
    const payload = stateRes.body.data;
    expect(payload.questions).toHaveLength(2);
    expect(payload.remainingSeconds).toBeGreaterThan(0);
    expect(payload.serverNow).toBeDefined();

    // Check anti-leak on exam-room payload
    for (const q of payload.questions) {
      expect(q.correctKeys).toBeUndefined();
      expect(q.explanation).toBeUndefined();
      expect(q.options).toBeDefined();
      expect(q.marks).toBeGreaterThan(0);
    }

    // Access by another student must be 403 Forbidden
    const forbiddenRes = await request(app)
      .get(`/api/attempts/${attempt._id}`)
      .set("Cookie", student2Cookie);
    expect(forbiddenRes.status).toBe(403);

    // Save answer to Q1
    const targetQ1 = payload.questions[0];
    const saveRes = await request(app)
      .put(`/api/attempts/${attempt._id}/answers/${targetQ1._id}`)
      .set("Cookie", student1Cookie)
      .send({
        selectedKeys: ["A"],
        markedForReview: true,
      });

    expect(saveRes.status).toBe(200);
    expect(saveRes.body.success).toBe(true);
    expect(saveRes.body.data.selectedKeys).toEqual(["A"]);
    expect(saveRes.body.data.markedForReview).toBe(true);

    // Record tab switch event
    const eventRes = await request(app)
      .post(`/api/attempts/${attempt._id}/events`)
      .set("Cookie", student1Cookie)
      .send({ type: "tab_hidden" });

    expect(eventRes.status).toBe(200);
    expect(eventRes.body.data.tabSwitchCount).toBe(1);
  });

  it("submits the attempt, evaluates results, and locks subsequent edits", async () => {
    const attempt = await Attempt.findOne({
      examId: liveExam._id,
      studentId: student1._id,
    });

    // Submit attempt
    const submitRes = await request(app)
      .post(`/api/attempts/${attempt._id}/submit`)
      .set("Cookie", student1Cookie);

    expect(submitRes.status).toBe(200);
    expect(submitRes.body.success).toBe(true);
    expect(submitRes.body.data.status).toBe("submitted");
    expect(submitRes.body.data.result).toBeDefined();
    expect(typeof submitRes.body.data.result.score).toBe("number");
    expect(typeof submitRes.body.data.result.percentage).toBe("number");
    expect(typeof submitRes.body.data.result.passed).toBe("boolean");

    // Second submit is idempotent
    const reSubmitRes = await request(app)
      .post(`/api/attempts/${attempt._id}/submit`)
      .set("Cookie", student1Cookie);
    expect(reSubmitRes.status).toBe(200);

    // Further saves must be rejected with 409 ALREADY_SUBMITTED
    const saveAfterSubmit = await request(app)
      .put(`/api/attempts/${attempt._id}/answers/${liveExam.questions[0]._id}`)
      .set("Cookie", student1Cookie)
      .send({ selectedKeys: ["B"] });

    expect(saveAfterSubmit.status).toBe(409);
    expect(saveAfterSubmit.body.error.code).toBe("ALREADY_SUBMITTED");

    // Start on same exam after submission rejects with 409 ALREADY_SUBMITTED
    const startAgain = await request(app)
      .post(`/api/exams/${liveExam._id}/attempts`)
      .set("Cookie", student1Cookie);

    expect(startAgain.status).toBe(409);
    expect(startAgain.body.error.code).toBe("ALREADY_SUBMITTED");
  });

  it("provides teacher submissions view and allows teacher to reset a live attempt", async () => {
    // Teacher views submissions
    const subRes = await request(app)
      .get(`/api/exams/${liveExam._id}/attempts`)
      .set("Cookie", teacherCookie);

    expect(subRes.status).toBe(200);
    expect(subRes.body.success).toBe(true);
    expect(Array.isArray(subRes.body.data)).toBe(true);
    const sub = subRes.body.data.find(
      (s) => s.student?.email === "student1@test-phase6.dev",
    );
    expect(sub).toBeDefined();
    expect(sub.status).toBe("submitted");
    expect(sub.tabSwitchCount).toBe(1);

    // Teacher resets student1's attempt (allowed since exam is live)
    const resetRes = await request(app)
      .delete(`/api/exams/${liveExam._id}/attempts/${sub._id}`)
      .set("Cookie", teacherCookie);

    expect(resetRes.status).toBe(200);
    expect(resetRes.body.success).toBe(true);
    expect(resetRes.body.data.reset).toBe(true);

    // Student1 can now start again!
    const restartRes = await request(app)
      .post(`/api/exams/${liveExam._id}/attempts`)
      .set("Cookie", student1Cookie);

    expect(restartRes.status).toBe(201);
    expect(restartRes.body.data.resumed).toBe(false);
  });

  it("rejects answer saving on expired attempt with 410 ATTEMPT_EXPIRED and finalizes attempt", async () => {
    // Student2 starts attempt
    const startRes = await request(app)
      .post(`/api/exams/${liveExam._id}/attempts`)
      .set("Cookie", student2Cookie);
    expect(startRes.status).toBe(201);
    const attemptId = startRes.body.data.attemptId;

    // Simulate clock expiry past grace period (10 seconds ago)
    await Attempt.findByIdAndUpdate(attemptId, {
      expiresAt: new Date(Date.now() - 10000),
    });

    // Save answer after expiry
    const saveRes = await request(app)
      .put(`/api/attempts/${attemptId}/answers/${liveExam.questions[0]._id}`)
      .set("Cookie", student2Cookie)
      .send({ selectedKeys: ["A"] });

    expect(saveRes.status).toBe(410);
    expect(saveRes.body.error.code).toBe("ATTEMPT_EXPIRED");

    // Verify it was lazily finalized
    const updated = await Attempt.findById(attemptId);
    expect(updated.status).toBe("submitted");
    expect(updated.submitReason).toBe("timeout");
    expect(updated.result).toBeDefined();
  });

  it("lazily finalizes expired reads and returns the result locator", async () => {
    const attempt = await Attempt.findOne({
      examId: liveExam._id,
      studentId: concurrentStudent._id,
    });
    await Attempt.updateOne(
      { _id: attempt._id },
      { expiresAt: new Date(Date.now() - 1000) },
    );

    const response = await request(app)
      .get(`/api/attempts/${attempt._id}`)
      .set("Cookie", concurrentStudentCookie);
    expect(response.status).toBe(410);
    expect(response.body.error.code).toBe("ATTEMPT_EXPIRED");
    expect(response.body.error.details.attemptId).toBe(attempt._id.toString());

    const finalized = await Attempt.findById(attempt._id);
    expect(finalized.status).toBe("submitted");
    expect(finalized.submitReason).toBe("timeout");
  });

  it("rejects events after expiry and the sweeper finalizes abandoned attempts", async () => {
    const eventStart = await request(app)
      .post(`/api/exams/${liveExam._id}/attempts`)
      .set("Cookie", eventStudentCookie);
    const eventAttemptId = eventStart.body.data.attemptId;
    await Attempt.updateOne(
      { _id: eventAttemptId },
      { expiresAt: new Date(Date.now() - 1000) },
    );

    const eventResponse = await request(app)
      .post(`/api/attempts/${eventAttemptId}/events`)
      .set("Cookie", eventStudentCookie)
      .send({ type: "tab_hidden" });
    expect(eventResponse.status).toBe(410);

    const abandoned = await Attempt.create({
      examId: liveExam._id,
      studentId: sweeperStudent._id,
      subjectId: subject._id,
      teacherId: teacher._id,
      batchId: batch1._id,
      examTitle: "Phase 6 Sweeper Attempt",
      status: "in_progress",
      startedAt: new Date(Date.now() - 31 * 60 * 1000),
      expiresAt: new Date(Date.now() - 10 * 1000),
      presentation: liveExam.questions.map((question) => ({
        questionId: question._id,
        optionOrder: question.options.map((option) => option.key),
      })),
    });

    const swept = await finalizeExpired();
    expect(swept).toBeGreaterThanOrEqual(1);
    const finalized = await Attempt.findById(abandoned._id);
    expect(finalized.status).toBe("submitted");
    expect(finalized.submitReason).toBe("timeout");
    expect(finalized.result).toBeDefined();
  });
});
