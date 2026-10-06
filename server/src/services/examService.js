import mongoose from "mongoose";
import { Attempt, Batch, Exam, Question, Subject } from "../models/index.js";
import { ApiError } from "../utils/response.js";

const editableFields = [
  "title",
  "description",
  "instructions",
  "subjectId",
  "batchIds",
  "startTime",
  "endTime",
  "durationMinutes",
  "passPercentage",
  "negativeMarking",
  "shuffleQuestions",
  "shuffleOptions",
  "reviewPolicy",
];

function phaseFilter(phase, now = new Date()) {
  if (phase === "upcoming") return { startTime: { $gt: now } };
  if (phase === "live")
    return { startTime: { $lte: now }, endTime: { $gte: now } };
  if (phase === "ended") return { endTime: { $lt: now } };
  return {};
}

function computePhase(exam, now = new Date()) {
  if (now < new Date(exam.startTime)) return "upcoming";
  if (now <= new Date(exam.endTime)) return "live";
  return "ended";
}

async function populateExam(exam) {
  return exam.populate([
    { path: "subjectId", select: "name code" },
    { path: "createdBy", select: "name email" },
    { path: "batchIds", select: "name year" },
  ]);
}

async function ownedExam(user, id) {
  const exam = await Exam.findById(id);
  if (!exam) throw ApiError.notFound("Exam not found");
  if (user.role === "teacher" && !exam.createdBy.equals(user._id)) {
    throw ApiError.forbidden("Access denied: you do not own this exam");
  }
  return exam;
}

async function verifyReferences(subjectId, batchIds) {
  if (!(await Subject.exists({ _id: subjectId }))) {
    throw ApiError.badRequest("Selected subject does not exist", [
      { path: "subjectId", message: "Subject not found" },
    ]);
  }
  const uniqueBatchIds = [...new Set(batchIds.map(String))];
  if (uniqueBatchIds.length) {
    const count = await Batch.countDocuments({ _id: { $in: uniqueBatchIds } });
    if (count !== uniqueBatchIds.length) {
      throw ApiError.badRequest("One or more selected batches do not exist", [
        { path: "batchIds", message: "Invalid batch selection" },
      ]);
    }
  }
}

function validateSchedule({ startTime, endTime, durationMinutes }) {
  const start = new Date(startTime);
  const end = new Date(endTime);
  if (end <= start)
    throw ApiError.badRequest("End time must be after start time");
  if (durationMinutes > (end - start) / 60000)
    throw ApiError.badRequest("Duration cannot exceed the exam window");
}

function assertDraft(exam) {
  if (exam.status !== "draft")
    throw ApiError.conflict(
      "Questions can only be changed while the exam is a draft",
      "EXAM_NOT_DRAFT",
    );
}

export async function listExams({
  user,
  status,
  subjectId,
  phase,
  page = 1,
  limit = 20,
}) {
  const query = { ...phaseFilter(phase) };
  if (user.role === "teacher") query.createdBy = user._id;
  if (status) query.status = status;
  if (subjectId) query.subjectId = subjectId;
  const skip = (page - 1) * limit;
  const [exams, total] = await Promise.all([
    Exam.find(query)
      .populate("subjectId", "name code")
      .populate("batchIds", "name year")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Exam.countDocuments(query),
  ]);
  const ids = exams.map((exam) => exam._id);
  const counts = ids.length
    ? await Attempt.aggregate([
        { $match: { examId: { $in: ids } } },
        { $group: { _id: "$examId", count: { $sum: 1 } } },
      ])
    : [];
  const countMap = new Map(
    counts.map((entry) => [entry._id.toString(), entry.count]),
  );
  return {
    exams: exams.map((exam) => ({
      ...exam.toObject({ virtuals: true }),
      phase: computePhase(exam),
      attemptCount: countMap.get(exam._id.toString()) || 0,
    })),
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
}

export async function createExam({ user, data }) {
  await verifyReferences(data.subjectId, data.batchIds);
  validateSchedule(data);
  const exam = await Exam.create({
    ...data,
    createdBy: user._id,
    status: "draft",
    questions: [],
    totalMarks: 0,
    publishedAt: null,
  });
  return populateExam(exam);
}

export async function getExam({ user, id }) {
  const exam = await ownedExam(user, id);
  const attemptCount = await Attempt.countDocuments({ examId: exam._id });
  await populateExam(exam);
  return {
    ...exam.toObject({ virtuals: true }),
    phase: computePhase(exam),
    attemptCount,
  };
}

export async function updateExam({ user, id, data }) {
  const exam = await ownedExam(user, id);
  if (exam.status === "archived")
    throw ApiError.conflict("Archived exams cannot be edited");
  if (
    data.subjectId &&
    !exam.subjectId.equals(data.subjectId) &&
    exam.questions.length
  ) {
    throw ApiError.conflict(
      "Remove all exam questions before changing the subject",
    );
  }
  if (exam.status === "published") {
    const hasAttempts = (await Attempt.exists({ examId: exam._id })) !== null;
    const allowed = hasAttempts
      ? ["description", "endTime"]
      : ["title", "description", "instructions", "endTime"];
    const blocked = Object.keys(data).filter((key) => !allowed.includes(key));
    if (blocked.length)
      throw ApiError.conflict(
        `Published exam fields cannot be changed: ${blocked.join(", ")}`,
      );
    if (hasAttempts && data.endTime && new Date(data.endTime) <= exam.endTime) {
      throw ApiError.conflict(
        "An exam with attempts can only have its end time extended",
      );
    }
  }

  const merged = { ...exam.toObject(), ...data };
  validateSchedule(merged);
  if (data.subjectId || data.batchIds) {
    await verifyReferences(
      data.subjectId || exam.subjectId,
      data.batchIds || exam.batchIds,
    );
  }
  for (const field of editableFields)
    if (data[field] !== undefined) exam[field] = data[field];
  await exam.save();
  return populateExam(exam);
}

export async function deleteExam({ user, id }) {
  const exam = await ownedExam(user, id);
  if (exam.status !== "draft")
    throw ApiError.conflict("Only draft exams can be deleted");
  if (await Attempt.exists({ examId: exam._id }))
    throw ApiError.conflict("An exam with attempts cannot be deleted");
  await exam.deleteOne();
  return { message: "Draft exam deleted" };
}

export async function addQuestions({ user, id, questionIds }) {
  const exam = await ownedExam(user, id);
  assertDraft(exam);
  const questions = await Question.find({
    _id: { $in: questionIds },
    createdBy: user._id,
    isArchived: false,
  });
  const byId = new Map(
    questions.map((question) => [question._id.toString(), question]),
  );
  const missing = questionIds.filter((questionId) => !byId.has(questionId));
  if (missing.length)
    throw ApiError.badRequest(
      "Some questions are unavailable or do not belong to you",
    );
  const wrongSubject = questions.find(
    (question) => !question.subjectId.equals(exam.subjectId),
  );
  if (wrongSubject)
    throw ApiError.badRequest("All questions must belong to the exam subject");
  const existing = new Set(
    exam.questions.map((question) => question.sourceQuestionId.toString()),
  );
  for (const questionId of questionIds) {
    if (existing.has(questionId)) continue;
    const question = byId.get(questionId);
    exam.questions.push({
      _id: new mongoose.Types.ObjectId(),
      sourceQuestionId: question._id,
      type: question.type,
      text: question.text,
      options: question.options.map(({ key, text }) => ({ key, text })),
      correctKeys: [...question.correctKeys],
      explanation: question.explanation,
      topic: question.topic,
      difficulty: question.difficulty,
      marks: question.defaultMarks,
    });
    existing.add(questionId);
  }
  await exam.save();
  return populateExam(exam);
}

export async function updateQuestionMarks({ user, id, questionId, marks }) {
  const exam = await ownedExam(user, id);
  assertDraft(exam);
  const question = exam.questions.id(questionId);
  if (!question) throw ApiError.notFound("Exam question not found");
  question.marks = marks;
  await exam.save();
  return populateExam(exam);
}

export async function removeQuestion({ user, id, questionId }) {
  const exam = await ownedExam(user, id);
  assertDraft(exam);
  const question = exam.questions.id(questionId);
  if (!question) throw ApiError.notFound("Exam question not found");
  question.deleteOne();
  await exam.save();
  return populateExam(exam);
}

export async function reorderQuestions({ user, id, orderedIds }) {
  const exam = await ownedExam(user, id);
  assertDraft(exam);
  const currentIds = exam.questions.map((question) => question._id.toString());
  if (
    orderedIds.length !== currentIds.length ||
    new Set(orderedIds).size !== currentIds.length ||
    currentIds.some((questionId) => !orderedIds.includes(questionId))
  ) {
    throw ApiError.badRequest(
      "Question order must contain every exam question exactly once",
    );
  }
  const byId = new Map(
    exam.questions.map((question) => [question._id.toString(), question]),
  );
  exam.questions = orderedIds.map((questionId) => byId.get(questionId));
  await exam.save();
  return populateExam(exam);
}

export async function publishExam({ user, id }) {
  const exam = await ownedExam(user, id);
  if (exam.status !== "draft")
    throw ApiError.conflict("Only draft exams can be published");
  if (!exam.questions.length)
    throw ApiError.conflict("Add at least one question before publishing");
  if (!exam.batchIds.length)
    throw ApiError.conflict("Assign at least one batch before publishing");
  if (exam.startTime < new Date())
    throw ApiError.conflict("Start time must be in the future");
  validateSchedule(exam);
  if (exam.questions.some((question) => question.marks <= 0))
    throw ApiError.conflict("Every question must have positive marks");
  exam.status = "published";
  exam.publishedAt = new Date();
  await exam.save();
  return populateExam(exam);
}

export async function unpublishExam({ user, id }) {
  const exam = await ownedExam(user, id);
  if (exam.status !== "published")
    throw ApiError.conflict("Only published exams can be unpublished");
  if (await Attempt.exists({ examId: exam._id }))
    throw ApiError.conflict("An exam with attempts cannot be unpublished");
  exam.status = "draft";
  exam.publishedAt = null;
  await exam.save();
  return populateExam(exam);
}

export async function archiveExam({ user, id }) {
  const exam = await ownedExam(user, id);
  if (exam.status !== "published")
    throw ApiError.conflict("Only published exams can be archived");
  exam.status = "archived";
  await exam.save();
  return populateExam(exam);
}

export async function duplicateExam({ user, id, title }) {
  const source = await ownedExam(user, id);
  const now = new Date();
  const originalWindow = Math.max(
    source.endTime - source.startTime,
    source.durationMinutes * 60000,
  );
  const startTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const endTime = new Date(startTime.getTime() + originalWindow);
  const copy = await Exam.create({
    title: title || `${source.title} (Copy)`,
    description: source.description,
    instructions: source.instructions,
    subjectId: source.subjectId,
    createdBy: user._id,
    batchIds: source.batchIds,
    startTime,
    endTime,
    durationMinutes: source.durationMinutes,
    passPercentage: source.passPercentage,
    negativeMarking: source.negativeMarking.toObject(),
    shuffleQuestions: source.shuffleQuestions,
    shuffleOptions: source.shuffleOptions,
    reviewPolicy: source.reviewPolicy,
    status: "draft",
    publishedAt: null,
    questions: source.questions.map((question) => ({
      _id: new mongoose.Types.ObjectId(),
      sourceQuestionId: question.sourceQuestionId,
      type: question.type,
      text: question.text,
      options: question.options.map(({ key, text: optionText }) => ({
        key,
        text: optionText,
      })),
      correctKeys: [...question.correctKeys],
      explanation: question.explanation,
      topic: question.topic,
      difficulty: question.difficulty,
      marks: question.marks,
    })),
  });
  return populateExam(copy);
}
