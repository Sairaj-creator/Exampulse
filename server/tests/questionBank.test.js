import { describe, expect, it } from "vitest";
import mongoose from "mongoose";
import { Question } from "../src/models/index.js";
import {
  MAX_QUESTIONS_PER_SUBJECT,
  SUBJECT_QUESTION_BANKS,
} from "../src/seed/questionBank.js";
import { gradeAttempt } from "../src/services/gradingService.js";
import { createQuestionSchema } from "../src/validators/questionValidators.js";

const banks = Object.entries(SUBJECT_QUESTION_BANKS);
const subjectId = new mongoose.Types.ObjectId();
const createdBy = new mongoose.Types.ObjectId();

describe("Starter question banks", () => {
  it("covers Data Structures, Operating Systems and Computer Networks", () => {
    expect(Object.keys(SUBJECT_QUESTION_BANKS).sort()).toEqual([
      "CS201",
      "CS302",
      "CS303",
    ]);
  });

  it.each(banks)("%s has ten distinct questions", (code, bank) => {
    expect(bank).toHaveLength(MAX_QUESTIONS_PER_SUBJECT);
    expect(new Set(bank.map((question) => question.text)).size).toBe(
      bank.length,
    );
  });

  it.each(banks)("%s mixes question types and difficulties", (code, bank) => {
    const types = new Set(bank.map((question) => question.type));
    const difficulties = new Set(bank.map((question) => question.difficulty));
    expect([...types].sort()).toEqual(["multiple", "single", "truefalse"]);
    expect([...difficulties].sort()).toEqual(["easy", "hard", "medium"]);
  });

  it.each(banks)("%s passes the Question model rules", (code, bank) => {
    for (const question of bank) {
      const document = new Question({
        ...question,
        subjectId,
        createdBy,
        defaultMarks: 2,
      });
      const error = document.validateSync();
      expect(error, `${code}: ${question.text}`).toBeUndefined();
    }
  });

  it.each(banks)("%s passes the API's create-question rules", (code, bank) => {
    for (const question of bank) {
      const result = createQuestionSchema.safeParse({
        ...question,
        subjectId: subjectId.toString(),
        defaultMarks: 2,
      });
      expect(
        result.success,
        `${code}: ${question.text} -> ${JSON.stringify(result.error?.issues)}`,
      ).toBe(true);
    }
  });

  it.each(banks)("%s has a usable answer key for every type", (code, bank) => {
    for (const question of bank) {
      const keys = question.options.map((option) => option.key);
      expect(question.correctKeys.every((key) => keys.includes(key))).toBe(
        true,
      );
      if (question.type === "multiple") {
        // A multi-select with one or all options correct is not a real choice.
        expect(question.correctKeys.length).toBeGreaterThan(1);
        expect(question.correctKeys.length).toBeLessThan(keys.length);
      } else {
        expect(question.correctKeys).toHaveLength(1);
      }
      expect(question.explanation.length).toBeGreaterThan(20);
    }
  });

  it.each(banks)("%s grades to full and zero marks correctly", (code, bank) => {
    const examQuestions = bank.map((question) => ({
      ...question,
      _id: new mongoose.Types.ObjectId(),
      marks: 2,
    }));
    const rules = { totalMarks: 20, passPercentage: 40 };
    const window = {
      startedAt: new Date(Date.now() - 60_000),
      expiresAt: new Date(Date.now() + 60_000),
    };

    const perfect = gradeAttempt({
      examQuestions,
      rules,
      ...window,
      answers: examQuestions.map((question) => ({
        questionId: question._id,
        selectedKeys: question.correctKeys,
      })),
    });
    expect(perfect.score).toBe(20);
    expect(perfect.percentage).toBe(100);
    expect(perfect.correctCount).toBe(10);

    // Pick one option that is not in the key for every question.
    const allWrong = gradeAttempt({
      examQuestions,
      rules,
      ...window,
      answers: examQuestions.map((question) => ({
        questionId: question._id,
        selectedKeys: [
          question.options.find(
            (option) => !question.correctKeys.includes(option.key),
          ).key,
        ],
      })),
    });
    expect(allWrong.score).toBe(0);
    expect(allWrong.wrongCount).toBe(10);
    expect(allWrong.passed).toBe(false);
  });
});
