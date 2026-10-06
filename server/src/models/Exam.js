import mongoose from "mongoose";

const examQuestionSnapshotSchema = new mongoose.Schema(
  {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      default: () => new mongoose.Types.ObjectId(),
    },
    sourceQuestionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },
    type: {
      type: String,
      enum: ["single", "multiple", "truefalse"],
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    options: [
      {
        _id: false,
        key: { type: String, required: true },
        text: { type: String, required: true },
      },
    ],
    correctKeys: [{ type: String, required: true }],
    explanation: {
      type: String,
      default: "",
    },
    topic: {
      type: String,
      default: "",
      trim: true,
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
    marks: {
      type: Number,
      required: true,
      min: [0.5, "Marks per question must be at least 0.5"],
    },
  },
  { _id: false },
);

const examSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Exam title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters long"],
      maxlength: [150, "Title cannot exceed 150 characters"],
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    instructions: {
      type: String,
      default: "",
      trim: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: [true, "Subject is required"],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Teacher creator is required"],
    },
    batchIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Batch",
      },
    ],
    startTime: {
      type: Date,
      required: [true, "Start time is required"],
    },
    endTime: {
      type: Date,
      required: [true, "End time is required"],
    },
    durationMinutes: {
      type: Number,
      required: [true, "Duration in minutes is required"],
      min: [1, "Duration must be at least 1 minute"],
    },
    passPercentage: {
      type: Number,
      default: 40,
      min: [0, "Pass percentage cannot be negative"],
      max: [100, "Pass percentage cannot exceed 100"],
    },
    negativeMarking: {
      enabled: {
        type: Boolean,
        default: false,
      },
      penaltyFraction: {
        type: Number,
        default: 0.25,
        min: [0, "Penalty fraction cannot be negative"],
        max: [1, "Penalty fraction cannot exceed 1"],
      },
    },
    shuffleQuestions: {
      type: Boolean,
      default: false,
    },
    shuffleOptions: {
      type: Boolean,
      default: false,
    },
    reviewPolicy: {
      type: String,
      enum: ["immediate", "after_end", "never"],
      default: "immediate",
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
    totalMarks: {
      type: Number,
      default: 0,
      min: 0,
    },
    questions: {
      type: [examQuestionSnapshotSchema],
      default: [],
    },
    publishedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

examSchema.virtual("phase").get(function () {
  const now = new Date();
  if (!this.startTime || !this.endTime) return "upcoming";
  if (now < this.startTime) return "upcoming";
  if (now <= this.endTime) return "live";
  return "ended";
});

examSchema.pre("save", function (next) {
  if (this.questions && Array.isArray(this.questions)) {
    this.totalMarks = this.questions.reduce(
      (sum, q) => sum + (Number(q.marks) || 0),
      0,
    );
  }
  next();
});

examSchema.index({ createdBy: 1, status: 1, startTime: -1 });
examSchema.index({ batchIds: 1, status: 1, startTime: 1 });

export const Exam = mongoose.model("Exam", examSchema);
