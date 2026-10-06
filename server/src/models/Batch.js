import mongoose from "mongoose";

const batchSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Batch name is required"],
      unique: true,
      trim: true,
      minlength: [2, "Batch name must be at least 2 characters long"],
      maxlength: [50, "Batch name must be at most 50 characters long"],
    },
    year: {
      type: Number,
      required: [true, "Graduation/academic year is required"],
      min: [2000, "Year must be 2000 or later"],
      max: [2100, "Year must be 2100 or earlier"],
    },
  },
  {
    timestamps: true,
  },
);

export const Batch = mongoose.model("Batch", batchSchema);
