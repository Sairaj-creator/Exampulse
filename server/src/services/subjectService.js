import { Exam, Question, Subject } from "../models/index.js";
import { ApiError } from "../utils/response.js";

export function listSubjects() {
  return Subject.find().sort({ code: 1 }).lean();
}

export async function createSubject({ name, code, description = "" }) {
  const normalizedName = name.trim();
  const normalizedCode = code.trim().toUpperCase();
  if (await Subject.exists({ code: normalizedCode }))
    throw ApiError.conflict(`Subject with code "${code}" already exists`);
  if (await Subject.exists({ name: normalizedName }))
    throw ApiError.conflict(`Subject with name "${name}" already exists`);
  return Subject.create({
    name: normalizedName,
    code: normalizedCode,
    description: description.trim(),
  });
}

export async function updateSubject(id, updates) {
  const subject = await Subject.findById(id);
  if (!subject) throw ApiError.notFound("Subject not found");
  if (updates.code && updates.code.trim().toUpperCase() !== subject.code) {
    const code = updates.code.trim().toUpperCase();
    if (await Subject.exists({ code, _id: { $ne: id } }))
      throw ApiError.conflict(
        `Subject with code "${updates.code}" already exists`,
      );
    subject.code = code;
  }
  if (updates.name && updates.name.trim() !== subject.name) {
    const name = updates.name.trim();
    if (await Subject.exists({ name, _id: { $ne: id } }))
      throw ApiError.conflict(
        `Subject with name "${updates.name}" already exists`,
      );
    subject.name = name;
  }
  if (updates.description !== undefined)
    subject.description = updates.description.trim();
  return subject.save();
}

export async function deleteSubject(id) {
  const subject = await Subject.findById(id);
  if (!subject) throw ApiError.notFound("Subject not found");
  const [questionCount, examCount] = await Promise.all([
    Question.countDocuments({ subjectId: id }),
    Exam.countDocuments({ subjectId: id }),
  ]);
  if (questionCount > 0)
    throw ApiError.conflict(
      `Cannot delete subject: referenced by ${questionCount} question(s) in question banks`,
    );
  if (examCount > 0)
    throw ApiError.conflict(
      `Cannot delete subject: referenced by ${examCount} exam(s)`,
    );
  await subject.deleteOne();
  return { message: "Subject deleted successfully" };
}
