import mongoose from "mongoose";

const presentationItemSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    optionOrder: [String],
  },
  { _id: false },
);

const answerItemSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    selectedKeys: {
      type: [String],
      default: [],
    },
    markedForReview: {
      type: Boolean,
      default: false,
    },
    answeredAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

const evaluationItemSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    sourceQuestionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    topic: {
      type: String,
      default: "",
    },
    difficulty: {
      type: String,
      default: "medium",
    },
    selectedKeys: {
      type: [String],
      default: [],
    },
    correctKeys: {
      type: [String],
      default: [],
    },
    isCorrect: {
      type: Boolean,
      default: false,
    },
    marksAwarded: {
      type: Number,
      default: 0,
    },
  },
  { _id: false },
);

const resultSchema = new mongoose.Schema(
  {
    score: {
      type: Number,
      required: true,
      default: 0,
    },
    totalMarks: {
      type: Number,
      required: true,
      default: 0,
    },
    percentage: {
      type: Number,
      required: true,
      default: 0,
    },
    passed: {
      type: Boolean,
      required: true,
      default: false,
    },
    correctCount: {
      type: Number,
      required: true,
      default: 0,
    },
    wrongCount: {
      type: Number,
      required: true,
      default: 0,
    },
    unansweredCount: {
      type: Number,
      required: true,
      default: 0,
    },
    timeTakenSeconds: {
      type: Number,
      required: true,
      default: 0,
    },
    evaluations: {
      type: [evaluationItemSchema],
      default: [],
    },
  },
  { _id: false },
);

const attemptSchema = new mongoose.Schema(
  {
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      required: [true, "Exam ID is required"],
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Student ID is required"],
    },
    // Denormalised for high-performance analytics without lookups
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: [true, "Subject ID is required"],
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Teacher ID is required"],
    },
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      required: [true, "Batch ID is required"],
    },
    examTitle: {
      type: String,
      required: [true, "Exam title is required"],
      trim: true,
    },
    status: {
      type: String,
      enum: ["in_progress", "submitted"],
      default: "in_progress",
    },
    submitReason: {
      type: String,
      enum: ["manual", "timeout", "auto", null],
      default: null,
    },
    startedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: [true, "Expiration time is required"],
    },
    submittedAt: {
      type: Date,
      default: null,
    },
    presentation: {
      type: [presentationItemSchema],
      default: [],
    },
    answers: {
      type: [answerItemSchema],
      default: [],
    },
    tabSwitchCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    result: {
      type: resultSchema,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

attemptSchema.index({ examId: 1, studentId: 1 }, { unique: true });
attemptSchema.index({ studentId: 1, status: 1, submittedAt: -1 });
attemptSchema.index({ examId: 1, status: 1, "result.score": -1 });
attemptSchema.index({ status: 1, expiresAt: 1 });
attemptSchema.index({ teacherId: 1, subjectId: 1, submittedAt: -1 });
attemptSchema.index({ teacherId: 1, status: 1 });
attemptSchema.index({ subjectId: 1, status: 1 });

export const Attempt = mongoose.model("Attempt", attemptSchema);
