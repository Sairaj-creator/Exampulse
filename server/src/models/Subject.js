import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Subject name is required"],
      unique: true,
      trim: true,
      minlength: [2, "Subject name must be at least 2 characters long"],
      maxlength: [100, "Subject name must be at most 100 characters long"],
    },
    code: {
      type: String,
      required: [true, "Subject code is required"],
      unique: true,
      uppercase: true,
      trim: true,
      minlength: [2, "Subject code must be at least 2 characters long"],
      maxlength: [20, "Subject code must be at most 20 characters long"],
    },
    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
  },
  {
    timestamps: true,
  },
);

export const Subject = mongoose.model("Subject", subjectSchema);
