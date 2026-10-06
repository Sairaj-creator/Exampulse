import { Question, Subject, Exam } from "../models/index.js";
import { ApiError } from "../utils/response.js";

function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

export async function listQuestions({
  user,
  subjectId,
  topic,
  type,
  difficulty,
  search,
  includeArchived = false,
  page = 1,
  limit = 20,
}) {
  const query = {};

  // Ownership filtering: teachers see only their questions; admins can see all
  if (user.role === "teacher") {
    query.createdBy = user._id;
  }

  // Archive filtering
  if (!includeArchived) {
    query.isArchived = false;
  }

  if (subjectId) {
    query.subjectId = subjectId;
  }

  if (topic) {
    query.topic = { $regex: new RegExp(`^${escapeRegex(topic)}$`, "i") };
  }

  if (type) {
    query.type = type;
  }

  if (difficulty) {
    query.difficulty = difficulty;
  }

  if (search && search.trim()) {
    const escaped = escapeRegex(search.trim());
    query.$or = [
      { text: { $regex: escaped, $options: "i" } },
      { topic: { $regex: escaped, $options: "i" } },
    ];
  }

  const skip = (page - 1) * limit;

  const [questions, total] = await Promise.all([
    Question.find(query)
      .populate("subjectId", "name code")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Question.countDocuments(query),
  ]);

  return {
    questions,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

export async function createQuestion({ user, data }) {
  const subject = await Subject.findById(data.subjectId);
  if (!subject) {
    throw ApiError.badRequest("Selected subject does not exist", [
      { path: "subjectId", message: "Subject not found" },
    ]);
  }

  const question = await Question.create({
    ...data,
    createdBy: user._id,
    isArchived: false,
  });

  return await Question.findById(question._id)
    .populate("subjectId", "name code")
    .populate("createdBy", "name email");
}

export async function getQuestionById({ user, id }) {
  const question = await Question.findById(id)
    .populate("subjectId", "name code")
    .populate("createdBy", "name email");

  if (!question) {
    throw ApiError.notFound("Question not found");
  }

  if (user.role === "teacher" && !question.createdBy._id.equals(user._id)) {
    throw ApiError.forbidden("Access denied: you do not own this question");
  }

  return question;
}

export async function updateQuestion({ user, id, data }) {
  const question = await Question.findById(id);
  if (!question) {
    throw ApiError.notFound("Question not found");
  }

  if (user.role === "teacher" && !question.createdBy.equals(user._id)) {
    throw ApiError.forbidden("Access denied: you do not own this question");
  }

  if (data.subjectId && data.subjectId !== question.subjectId.toString()) {
    const subject = await Subject.findById(data.subjectId);
    if (!subject) {
      throw ApiError.badRequest("Selected subject does not exist", [
        { path: "subjectId", message: "Subject not found" },
      ]);
    }
    question.subjectId = data.subjectId;
  }

  if (data.topic !== undefined) question.topic = data.topic;
  if (data.type !== undefined) question.type = data.type;
  if (data.text !== undefined) question.text = data.text;
  if (data.options !== undefined) question.options = data.options;
  if (data.correctKeys !== undefined) question.correctKeys = data.correctKeys;
  if (data.explanation !== undefined) question.explanation = data.explanation;
  if (data.difficulty !== undefined) question.difficulty = data.difficulty;
  if (data.defaultMarks !== undefined) question.defaultMarks = data.defaultMarks;

  // Run Mongoose validation to verify consistency
  await question.validate();
  await question.save();

  return await Question.findById(question._id)
    .populate("subjectId", "name code")
    .populate("createdBy", "name email");
}

export async function deleteQuestion({ user, id }) {
  const question = await Question.findById(id);
  if (!question) {
    throw ApiError.notFound("Question not found");
  }

  if (user.role === "teacher" && !question.createdBy.equals(user._id)) {
    throw ApiError.forbidden("Access denied: you do not own this question");
  }

  // Check if this question is snapshotted inside any exam
  const usedInExams = await Exam.countDocuments({
    "questions.sourceQuestionId": id,
  });

  if (usedInExams > 0) {
    question.isArchived = true;
    await question.save();
    return {
      archived: true,
      message: `Question is referenced in ${usedInExams} exam(s) and has been archived instead of deleted.`,
    };
  }

  await Question.findByIdAndDelete(id);
  return {
    archived: false,
    message: "Question permanently deleted from the bank.",
  };
}

export async function getDistinctTopics({ user, subjectId }) {
  const filter = { isArchived: false };

  if (user.role === "teacher") {
    filter.createdBy = user._id;
  }

  if (subjectId) {
    filter.subjectId = subjectId;
  }

  const topics = await Question.distinct("topic", filter);
  return topics.filter(Boolean).sort((a, b) => a.localeCompare(b));
}
