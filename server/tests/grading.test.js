import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import { gradeAttempt } from "../src/services/gradingService.js";

describe("Grading Service (gradeAttempt)", () => {
  const q1Id = new mongoose.Types.ObjectId();
  const q2Id = new mongoose.Types.ObjectId();
  const q3Id = new mongoose.Types.ObjectId();
  const q4Id = new mongoose.Types.ObjectId();

  const sampleQuestions = [
    {
      _id: q1Id,
      sourceQuestionId: q1Id,
      type: "single",
      text: "What is 2+2?",
      options: [
        { key: "A", text: "3" },
        { key: "B", text: "4" },
      ],
      correctKeys: ["B"],
      marks: 2,
      topic: "Arithmetic",
      difficulty: "easy",
    },
    {
      _id: q2Id,
      sourceQuestionId: q2Id,
      type: "multiple",
      text: "Select prime numbers",
      options: [
        { key: "A", text: "2" },
        { key: "B", text: "3" },
        { key: "C", text: "4" },
      ],
      correctKeys: ["A", "B"],
      marks: 4,
      topic: "Number Theory",
      difficulty: "medium",
    },
    {
      _id: q3Id,
      sourceQuestionId: q3Id,
      type: "truefalse",
      text: "Earth is flat",
      options: [
        { key: "A", text: "True" },
        { key: "B", text: "False" },
      ],
      correctKeys: ["B"],
      marks: 1,
      topic: "General Science",
      difficulty: "easy",
    },
    {
      _id: q4Id,
      sourceQuestionId: q4Id,
      type: "single",
      text: "Capital of France?",
      options: [
        { key: "A", text: "Paris" },
        { key: "B", text: "Lyon" },
      ],
      correctKeys: ["A"],
      marks: 3,
      topic: "Geography",
      difficulty: "easy",
    },
  ];

  it("evaluates a perfect attempt with 100% score", () => {
    const answers = [
      { questionId: q1Id, selectedKeys: ["B"] },
      { questionId: q2Id, selectedKeys: ["B", "A"] }, // order shouldn't matter
      { questionId: q3Id, selectedKeys: ["B"] },
      { questionId: q4Id, selectedKeys: ["A"] },
    ];

    const result = gradeAttempt({
      examQuestions: sampleQuestions,
      answers,
      rules: { passPercentage: 50, totalMarks: 10 },
      startedAt: new Date(Date.now() - 60000),
      submittedAt: new Date(),
    });

    expect(result.score).toBe(10);
    expect(result.totalMarks).toBe(10);
    expect(result.percentage).toBe(100);
    expect(result.passed).toBe(true);
    expect(result.correctCount).toBe(4);
    expect(result.wrongCount).toBe(0);
    expect(result.unansweredCount).toBe(0);
    expect(result.evaluations).toHaveLength(4);
    expect(result.evaluations.every((e) => e.isCorrect)).toBe(true);
  });

  it("enforces all-or-nothing for multiple-choice questions", () => {
    // Only selected "A" for prime numbers (missing "B")
    const answers = [{ questionId: q2Id, selectedKeys: ["A"] }];

    const result = gradeAttempt({
      examQuestions: [sampleQuestions[1]],
      answers,
      rules: { passPercentage: 50, totalMarks: 4 },
    });

    expect(result.score).toBe(0);
    expect(result.correctCount).toBe(0);
    expect(result.wrongCount).toBe(1);
    expect(result.passed).toBe(false);
  });

  it("handles unanswered questions without penalty even with negative marking enabled", () => {
    const answers = []; // answered nothing

    const result = gradeAttempt({
      examQuestions: sampleQuestions,
      answers,
      rules: {
        negativeMarking: { enabled: true, penaltyFraction: 0.25 },
        passPercentage: 40,
        totalMarks: 10,
      },
    });

    expect(result.score).toBe(0);
    expect(result.unansweredCount).toBe(4);
    expect(result.wrongCount).toBe(0);
    expect(result.correctCount).toBe(0);
    expect(result.percentage).toBe(0);
    expect(result.passed).toBe(false);
  });

  it("applies negative marking penalty correctly on wrong answers", () => {
    // Q1 (2 marks): wrong answer -> penalty is 2 * 0.25 = 0.5
    // Q4 (3 marks): correct answer -> marks = 3
    // Q2 & Q3: unanswered -> marks = 0
    // Total score = 3 - 0.5 = 2.5 / 10 marks
    const answers = [
      { questionId: q1Id, selectedKeys: ["A"] }, // wrong
      { questionId: q4Id, selectedKeys: ["A"] }, // correct
    ];

    const result = gradeAttempt({
      examQuestions: sampleQuestions,
      answers,
      rules: {
        negativeMarking: { enabled: true, penaltyFraction: 0.25 },
        passPercentage: 25,
        totalMarks: 10,
      },
    });

    expect(result.score).toBe(2.5);
    expect(result.totalMarks).toBe(10);
    expect(result.percentage).toBe(25);
    expect(result.passed).toBe(true);
    expect(result.correctCount).toBe(1);
    expect(result.wrongCount).toBe(1);
    expect(result.unansweredCount).toBe(2);

    const q1Eval = result.evaluations.find(
      (e) => e.questionId.toString() === q1Id.toString(),
    );
    expect(q1Eval.marksAwarded).toBe(-0.5);
    expect(q1Eval.isCorrect).toBe(false);
  });

  it("floors the total score at 0 when negative marks exceed positive marks", () => {
    // Q1 (2 marks): wrong answer -> -1 with 0.5 penalty fraction
    // Q3 (1 mark): wrong answer -> -0.5 with 0.5 penalty fraction
    // Total marks = -1.5, floored to 0
    const answers = [
      { questionId: q1Id, selectedKeys: ["A"] },
      { questionId: q3Id, selectedKeys: ["A"] },
    ];

    const result = gradeAttempt({
      examQuestions: [sampleQuestions[0], sampleQuestions[2]],
      answers,
      rules: {
        negativeMarking: { enabled: true, penaltyFraction: 0.5 },
        passPercentage: 40,
        totalMarks: 3,
      },
    });

    expect(result.score).toBe(0);
    expect(result.percentage).toBe(0);
    expect(result.passed).toBe(false);
  });

  it("honors an explicit zero negative-marking fraction", () => {
    const result = gradeAttempt({
      examQuestions: [sampleQuestions[0], sampleQuestions[3]],
      answers: [
        { questionId: q1Id, selectedKeys: ["A"] },
        { questionId: q4Id, selectedKeys: ["A"] },
      ],
      rules: {
        negativeMarking: { enabled: true, penaltyFraction: 0 },
        passPercentage: 50,
        totalMarks: 5,
      },
    });

    expect(result.score).toBe(3);
    expect(result.percentage).toBe(60);
    expect(result.evaluations[0].marksAwarded).toBe(0);
  });

  it("accurately computes timeTakenSeconds bounded by expiresAt", () => {
    const startedAt = new Date("2026-10-06T10:00:00Z");
    const expiresAt = new Date("2026-10-06T10:30:00Z"); // 30 min duration
    const submittedAt = new Date("2026-10-06T10:15:30Z"); // submitted at 15m 30s

    const result = gradeAttempt({
      examQuestions: sampleQuestions,
      answers: [],
      rules: {},
      startedAt,
      submittedAt,
      expiresAt,
    });

    expect(result.timeTakenSeconds).toBe(15 * 60 + 30); // 930 seconds

    // If submitted after expiresAt (e.g. delayed submission or auto-submit), capped at expiresAt
    const lateSubmittedAt = new Date("2026-10-06T10:35:00Z");
    const lateResult = gradeAttempt({
      examQuestions: sampleQuestions,
      answers: [],
      rules: {},
      startedAt,
      submittedAt: lateSubmittedAt,
      expiresAt,
    });

    expect(lateResult.timeTakenSeconds).toBe(30 * 60); // 1800 seconds (capped)
  });
});
