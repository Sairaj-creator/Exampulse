import mongoose from "mongoose";

const optionSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false },
);

const questionSchema = new mongoose.Schema(
  {
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: [true, "Subject is required"],
    },
    topic: {
      type: String,
      required: [true, "Topic is required"],
      trim: true,
      minlength: [2, "Topic must be at least 2 characters long"],
      maxlength: [100, "Topic must be at most 100 characters long"],
    },
    type: {
      type: String,
      enum: {
        values: ["single", "multiple", "truefalse"],
        message: "Question type must be single, multiple, or truefalse",
      },
      required: [true, "Question type is required"],
    },
    text: {
      type: String,
      required: [true, "Question text is required"],
      trim: true,
      minlength: [5, "Question text must be at least 5 characters long"],
    },
    options: {
      type: [optionSchema],
      required: true,
      validate: [
        {
          validator: function (options) {
            if (!Array.isArray(options)) return false;
            if (this.type === "truefalse") return options.length === 2;
            return options.length >= 2 && options.length <= 6;
          },
          message:
            "Question must have 2 to 6 options (exactly 2 for true/false)",
        },
        {
          validator: function (options) {
            const keys = options.map((opt) => opt.key);
            return new Set(keys).size === keys.length;
          },
          message: "Option keys must be distinct",
        },
      ],
    },
    correctKeys: {
      type: [String],
      required: true,
      validate: [
        {
          validator: function (keys) {
            return Array.isArray(keys) && new Set(keys).size === keys.length;
          },
          message: "Correct keys must be distinct",
        },
        {
          validator: function (keys) {
            if (!Array.isArray(keys) || keys.length === 0) return false;
            if (this.type === "single" || this.type === "truefalse") {
              return keys.length === 1;
            }
            return keys.length >= 1;
          },
          message:
            "Single/TrueFalse questions must have exactly 1 correct key; multiple questions must have at least 1",
        },
        {
          validator: function (keys) {
            if (!this.options) return false;
            const validKeys = new Set(this.options.map((opt) => opt.key));
            return keys.every((key) => validKeys.has(key));
          },
          message: "All correct keys must exist in options",
        },
      ],
    },
    explanation: {
      type: String,
      default: "",
      trim: true,
    },
    difficulty: {
      type: String,
      enum: {
        values: ["easy", "medium", "hard"],
        message: "Difficulty must be easy, medium, or hard",
      },
      default: "medium",
    },
    defaultMarks: {
      type: Number,
      default: 1,
      min: [0.5, "Default marks must be at least 0.5"],
      max: [100, "Default marks cannot exceed 100"],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator (teacher) is required"],
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

questionSchema.index({ createdBy: 1, subjectId: 1, topic: 1, isArchived: 1 });
questionSchema.index({ text: "text", topic: "text" });

export const Question = mongoose.model("Question", questionSchema);
