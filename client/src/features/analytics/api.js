import { api } from "../../lib/api";

/**
 * Student Analytics Bundle (§15.6)
 * @param {string} id - Student ObjectId or "me"
 */
export async function getStudentAnalyticsApi(id = "me") {
  const res = await api.get(`/analytics/students/${id}`);
  return res.data.data;
}

/**
 * Exam Analytics Summary (§15.6)
 * @param {string} id - Exam ObjectId
 */
export async function getExamAnalyticsApi(id) {
  const res = await api.get(`/analytics/exams/${id}`);
  return res.data.data;
}

/**
 * Question Analytics for Exam (§15.6)
 * @param {string} id - Exam ObjectId
 */
export async function getExamQuestionsAnalyticsApi(id) {
  const res = await api.get(`/analytics/exams/${id}/questions`);
  return res.data.data;
}

/**
 * Subject Analytics (§15.6)
 * @param {string} id - Subject ObjectId
 * @param {string} [batchId] - Optional Batch filter
 */
export async function getSubjectAnalyticsApi(id, batchId) {
  const params = batchId ? { batchId } : {};
  const res = await api.get(`/analytics/subjects/${id}`, { params });
  return res.data.data;
}

/**
 * Teacher Dashboard Overview KPIs (§15.6)
 */
export async function getTeacherOverviewApi() {
  const res = await api.get("/analytics/teacher/overview");
  return res.data.data;
}

/**
 * Admin Platform Overview KPIs (§15.6)
 */
export async function getAdminOverviewApi() {
  const res = await api.get("/analytics/admin/overview");
  return res.data.data;
}
