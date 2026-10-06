import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import {
  User,
  Batch,
  Subject,
  Question,
  Exam,
  Attempt,
} from "../src/models/index.js";

describe("Mongoose Models and Schema Validation", () => {
  describe("User Model", () => {
    it("validates a correct user document", async () => {
      const user = new User({
        name: "Test Student",
        email: "student@example.com",
        passwordHash: "hashed_password_string_here",
        role: "student",
      });
      const err = await user.validate();
      expect(err).toBeUndefined();
      expect(user.role).toBe("student");
      expect(user.isActive).toBe(true);
    });

    it("rejects invalid email and missing required fields", async () => {
      const user = new User({
        email: "invalid-email",
      });
      let error;
      try {
        await user.validate();
      } catch (err) {
        error = err;
      }
      expect(error).toBeDefined();
      expect(error.errors.name).toBeDefined();
      expect(error.errors.email).toBeDefined();
      expect(error.errors.passwordHash).toBeDefined();
    });

    it("rejects invalid role", async () => {
      const user = new User({
        name: "Bad Role",
        email: "bad@example.com",
        passwordHash: "hash",
        role: "superadmin",
      });
      let error;
      try {
        await user.validate();
      } catch (err) {
        error = err;
      }
      expect(error).toBeDefined();
      expect(error.errors.role).toBeDefined();
    });
  });

  describe("Batch Model", () => {
    it("validates a valid batch", async () => {
      const batch = new Batch({
        name: "CSE-A 2026",
        year: 2026,
      });
      const err = await batch.validate();
      expect(err).toBeUndefined();
    });

    it("rejects invalid year and missing name", async () => {
      const batch = new Batch({
        year: 1990,
      });
      let error;
      try {
        await batch.validate();
      } catch (err) {
        error = err;
      }
      expect(error).toBeDefined();
      expect(error.errors.name).toBeDefined();
      expect(error.errors.year).toBeDefined();
    });
  });

  describe("Subject Model", () => {
    it("validates subject and uppercases code", async () => {
      const subject = new Subject({
        name: "Database Management Systems",
        code: "cs301",
      });
      const err = await subject.validate();
      expect(err).toBeUndefined();
      expect(subject.code).toBe("CS301");
    });

    it("rejects missing name or code", async () => {
      const subject = new Subject({});
      let error;
      try {
        await subject.validate();
      } catch (err) {
        error = err;
      }
      expect(error).toBeDefined();
      expect(error.errors.name).toBeDefined();
      expect(error.errors.code).toBeDefined();
    });
  });

  describe("Question Model", () => {
    const validSubjectId = new mongoose.Types.ObjectId();
    const validTeacherId = new mongoose.Types.ObjectId();

    it("validates single choice question with exactly 1 correct key", async () => {
      const q = new Question({
        subjectId: validSubjectId,
        topic: "Indexing",
        type: "single",
        text: "Which index is clustered?",
        options: [
          { key: "A", text: "B-Tree primary" },
          { key: "B", text: "Secondary non-clustered" },
        ],
        correctKeys: ["A"],
        createdBy: validTeacherId,
      });
      const err = await q.validate();
      expect(err).toBeUndefined();
    });

    it("rejects single choice question with multiple correct keys", async () => {
      const q = new Question({
        subjectId: validSubjectId,
        topic: "Indexing",
        type: "single",
        text: "Which index is clustered?",
        options: [
          { key: "A", text: "Option A" },
          { key: "B", text: "Option B" },
        ],
        correctKeys: ["A", "B"],
        createdBy: validTeacherId,
      });
      let error;
      try {
        await q.validate();
      } catch (err) {
        error = err;
      }
      expect(error).toBeDefined();
      expect(error.errors.correctKeys).toBeDefined();
    });

    it("validates multiple choice question with multiple correct keys", async () => {
      const q = new Question({
        subjectId: validSubjectId,
        topic: "ACID",
        type: "multiple",
        text: "Select the ACID properties:",
        options: [
          { key: "A", text: "Atomicity" },
          { key: "B", text: "Consistency" },
          { key: "C", text: "Availability" },
        ],
        correctKeys: ["A", "B"],
        createdBy: validTeacherId,
      });
      const err = await q.validate();
      expect(err).toBeUndefined();
    });

    it("rejects question when correctKey is not in options", async () => {
      const q = new Question({
        subjectId: validSubjectId,
        topic: "Indexing",
        type: "single",
        text: "Sample question text",
        options: [
          { key: "A", text: "Option A" },
          { key: "B", text: "Option B" },
        ],
        correctKeys: ["Z"],
        createdBy: validTeacherId,
      });
      let error;
      try {
        await q.validate();
      } catch (err) {
        error = err;
      }
      expect(error).toBeDefined();
      expect(error.errors.correctKeys).toBeDefined();
    });

    it("rejects truefalse question with more than 2 options", async () => {
      const q = new Question({
        subjectId: validSubjectId,
        topic: "Transactions",
        type: "truefalse",
        text: "Is SQL a relational language?",
        options: [
          { key: "A", text: "True" },
          { key: "B", text: "False" },
          { key: "C", text: "Maybe" },
        ],
        correctKeys: ["A"],
        createdBy: validTeacherId,
      });
      let error;
      try {
        await q.validate();
      } catch (err) {
        error = err;
      }
      expect(error).toBeDefined();
      expect(error.errors.options).toBeDefined();
    });
  });

  describe("Exam Model", () => {
    const validSubjectId = new mongoose.Types.ObjectId();
    const validTeacherId = new mongoose.Types.ObjectId();

    it("computes phase virtual correctly", () => {
      const past = new Date(Date.now() - 3600000 * 2);
      const pastEnd = new Date(Date.now() - 3600000);
      const futureStart = new Date(Date.now() + 3600000);
      const futureEnd = new Date(Date.now() + 3600000 * 2);

      const endedExam = new Exam({
        title: "Past Exam",
        subjectId: validSubjectId,
        createdBy: validTeacherId,
        startTime: past,
        endTime: pastEnd,
        durationMinutes: 30,
      });
      expect(endedExam.phase).toBe("ended");

      const liveExam = new Exam({
        title: "Live Exam",
        subjectId: validSubjectId,
        createdBy: validTeacherId,
        startTime: past,
        endTime: futureEnd,
        durationMinutes: 60,
      });
      expect(liveExam.phase).toBe("live");

      const upcomingExam = new Exam({
        title: "Upcoming Exam",
        subjectId: validSubjectId,
        createdBy: validTeacherId,
        startTime: futureStart,
        endTime: futureEnd,
        durationMinutes: 60,
      });
      expect(upcomingExam.phase).toBe("upcoming");
    });

    it("validates question snapshot structure", async () => {
      const exam = new Exam({
        title: "Midterm Exam",
        subjectId: validSubjectId,
        createdBy: validTeacherId,
        startTime: new Date(),
        endTime: new Date(Date.now() + 7200000),
        durationMinutes: 60,
        questions: [
          {
            sourceQuestionId: new mongoose.Types.ObjectId(),
            type: "single",
            text: "Question stem text here",
            options: [
              { key: "A", text: "Choice 1" },
              { key: "B", text: "Choice 2" },
            ],
            correctKeys: ["A"],
            marks: 2,
          },
        ],
      });
      const err = await exam.validate();
      expect(err).toBeUndefined();
    });
  });

  describe("Attempt Model", () => {
    it("validates attempt schema structure and defaults", async () => {
      const attempt = new Attempt({
        examId: new mongoose.Types.ObjectId(),
        studentId: new mongoose.Types.ObjectId(),
        subjectId: new mongoose.Types.ObjectId(),
        teacherId: new mongoose.Types.ObjectId(),
        batchId: new mongoose.Types.ObjectId(),
        examTitle: "DBMS Unit Test 1",
        expiresAt: new Date(Date.now() + 3600000),
      });

      const err = await attempt.validate();
      expect(err).toBeUndefined();
      expect(attempt.status).toBe("in_progress");
      expect(attempt.submitReason).toBeNull();
      expect(attempt.tabSwitchCount).toBe(0);
      expect(attempt.answers).toEqual([]);
    });

    it("rejects attempt with missing required references", async () => {
      const attempt = new Attempt({});
      let error;
      try {
        await attempt.validate();
      } catch (err) {
        error = err;
      }
      expect(error).toBeDefined();
      expect(error.errors.examId).toBeDefined();
      expect(error.errors.studentId).toBeDefined();
      expect(error.errors.subjectId).toBeDefined();
      expect(error.errors.teacherId).toBeDefined();
      expect(error.errors.batchId).toBeDefined();
      expect(error.errors.examTitle).toBeDefined();
      expect(error.errors.expiresAt).toBeDefined();
    });
  });
});
