import { Batch, Exam, User } from "../models/index.js";
import { ApiError } from "../utils/response.js";

export async function listBatches() {
  const [batches, studentCounts] = await Promise.all([
    Batch.find().sort({ year: -1, name: 1 }).lean(),
    User.aggregate([
      { $match: { role: "student", batchId: { $ne: null } } },
      { $group: { _id: "$batchId", count: { $sum: 1 } } },
    ]),
  ]);
  const countMap = new Map(
    studentCounts.map((entry) => [entry._id.toString(), entry.count]),
  );
  return batches.map((batch) => ({
    ...batch,
    studentCount: countMap.get(batch._id.toString()) || 0,
  }));
}

export async function createBatch({ name, year }) {
  const normalizedName = name.trim();
  if (await Batch.exists({ name: normalizedName })) {
    throw ApiError.conflict(`Batch with name "${name}" already exists`);
  }
  return Batch.create({ name: normalizedName, year });
}

export async function updateBatch(id, updates) {
  const batch = await Batch.findById(id);
  if (!batch) throw ApiError.notFound("Batch not found");
  if (updates.name && updates.name.trim() !== batch.name) {
    const normalizedName = updates.name.trim();
    if (await Batch.exists({ name: normalizedName, _id: { $ne: id } })) {
      throw ApiError.conflict(
        `Batch with name "${updates.name}" already exists`,
      );
    }
    batch.name = normalizedName;
  }
  if (updates.year !== undefined) batch.year = updates.year;
  return batch.save();
}

export async function deleteBatch(id) {
  const batch = await Batch.findById(id);
  if (!batch) throw ApiError.notFound("Batch not found");
  const [studentCount, examCount] = await Promise.all([
    User.countDocuments({ batchId: id }),
    Exam.countDocuments({ batchIds: id }),
  ]);
  if (studentCount > 0)
    throw ApiError.conflict(
      `Cannot delete batch: currently referenced by ${studentCount} enrolled student(s)`,
    );
  if (examCount > 0)
    throw ApiError.conflict(
      `Cannot delete batch: currently assigned to ${examCount} scheduled exam(s)`,
    );
  await batch.deleteOne();
  return { message: "Batch deleted successfully" };
}
