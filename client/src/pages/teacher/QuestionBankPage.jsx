import React, { useState, useEffect, useCallback } from "react";
import { Plus, Database, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { PageHeader } from "../../components/common/PageHeader";
import { Pagination } from "../../components/common/Pagination";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { Button } from "../../components/ui/button";
import {
  getQuestionsApi,
  createQuestionApi,
  updateQuestionApi,
  deleteQuestionApi,
  getSubjectsApi,
  getTopicsApi,
} from "../../features/questions/api";
import { QuestionFilters } from "../../features/questions/QuestionFilters";
import { QuestionTable } from "../../features/questions/QuestionTable";
import { QuestionFormDialog } from "../../features/questions/QuestionFormDialog";
import { QuestionDetailDialog } from "../../features/questions/QuestionDetailDialog";

export function QuestionBankPage() {
  const { user } = useAuth();

  const [questions, setQuestions] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);

  const [filters, setFilters] = useState({
    search: "",
    subjectId: "",
    topic: "",
    type: "",
    difficulty: "",
    includeArchived: false,
    page: 1,
    limit: 10,
  });

  const [formOpen, setFormOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailQuestion, setDetailQuestion] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState(null);
  const [actionBusy, setActionBusy] = useState(false);

  const [feedback, setFeedback] = useState(null);

  // Load master subjects and distinct topics
  const loadMasterData = useCallback(async () => {
    try {
      const [subs, tops] = await Promise.all([
        getSubjectsApi(),
        getTopicsApi(filters.subjectId || undefined),
      ]);
      setSubjects(subs || []);
      setTopics(tops || []);
    } catch (err) {
      console.error("Failed to load question master data:", err);
    }
  }, [filters.subjectId]);

  useEffect(() => {
    loadMasterData();
  }, [loadMasterData]);

  // Load question bank entries with applied filters
  const loadQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const cleanParams = {};
      if (filters.search) cleanParams.search = filters.search;
      if (filters.subjectId) cleanParams.subjectId = filters.subjectId;
      if (filters.topic) cleanParams.topic = filters.topic;
      if (filters.type) cleanParams.type = filters.type;
      if (filters.difficulty) cleanParams.difficulty = filters.difficulty;
      if (filters.includeArchived) cleanParams.includeArchived = "true";
      cleanParams.page = filters.page;
      cleanParams.limit = filters.limit;

      const result = await getQuestionsApi(cleanParams);
      setQuestions(result.questions || []);
      setMeta(result.meta || { page: 1, limit: 10, total: 0, totalPages: 1 });
    } catch (err) {
      setFeedback({ type: "error", message: err.message || "Failed to load questions" });
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page on filter modification
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: "",
      subjectId: "",
      topic: "",
      type: "",
      difficulty: "",
      includeArchived: false,
      page: 1,
      limit: 10,
    });
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleOpenCreate = () => {
    setSelectedQuestion(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (q) => {
    setSelectedQuestion(q);
    setFormOpen(true);
  };

  const handleOpenDetail = (q) => {
    setDetailQuestion(q);
    setDetailOpen(true);
  };

  const handleOpenDelete = (q) => {
    setQuestionToDelete(q);
    setDeleteDialogOpen(true);
  };

  const handleFormSubmit = async (payload) => {
    setActionBusy(true);
    try {
      if (selectedQuestion) {
        await updateQuestionApi(selectedQuestion._id, payload);
        setFeedback({ type: "success", message: "Question successfully updated." });
      } else {
        await createQuestionApi(payload);
        setFeedback({ type: "success", message: "New question successfully added to bank." });
      }
      setFormOpen(false);
      setSelectedQuestion(null);
      await loadQuestions();
      await loadMasterData();
    } finally {
      setActionBusy(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!questionToDelete) return;
    setActionBusy(true);
    try {
      const res = await deleteQuestionApi(questionToDelete._id);
      setFeedback({
        type: "success",
        message: res.message || (res.archived ? "Question archived." : "Question deleted."),
      });
      setDeleteDialogOpen(false);
      setQuestionToDelete(null);
      await loadQuestions();
      await loadMasterData();
    } catch (err) {
      setFeedback({ type: "error", message: err.message || "Failed to delete question." });
    } finally {
      setActionBusy(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Question Repository"
          description="Create, curate, and categorize questions across subjects, topics, and difficulty levels for timed examination papers."
          action={
            <Button onClick={handleOpenCreate} className="flex items-center gap-1.5 shadow-xs">
              <Plus size={16} /> Create Question
            </Button>
          }
        />

        {feedback && (
          <div
            className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between gap-3 ${
              feedback.type === "error"
                ? "bg-red-50 border-red-200 text-red-700"
                : "bg-emerald-50 border-emerald-200 text-emerald-800"
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === "error" ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
              <span>{feedback.message}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-stone-400 hover:text-stone-700"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Filters */}
        <QuestionFilters
          filters={filters}
          onChangeFilter={handleFilterChange}
          onResetFilters={handleResetFilters}
          subjects={subjects}
          topics={topics}
        />

        {/* Content Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-stone-500 px-1">
            <span className="font-semibold text-stone-700">
              Showing {questions.length} of {meta.total} repository items
            </span>
            <span>Teacher: {user?.name}</span>
          </div>

          {loading ? (
            <div className="bg-white border border-[#dfe3dc] rounded-2xl p-12 flex flex-col items-center justify-center gap-2 text-stone-400">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-medium">Loading repository questions…</span>
            </div>
          ) : (
            <QuestionTable
              questions={questions}
              onView={handleOpenDetail}
              onEdit={handleOpenEdit}
              onDelete={handleOpenDelete}
              onCreateNew={handleOpenCreate}
              canEdit={user?.role === "teacher" || user?.role === "admin"}
            />
          )}

          <Pagination
            page={meta.page}
            totalPages={meta.totalPages}
            total={meta.total}
            pageSize={meta.limit}
            onPageChange={handlePageChange}
          />
        </div>

        {/* Modals */}
        <QuestionFormDialog
          open={formOpen}
          question={selectedQuestion}
          subjects={subjects}
          topics={topics}
          onSubmit={handleFormSubmit}
          onClose={() => setFormOpen(false)}
          busy={actionBusy}
        />

        <QuestionDetailDialog
          open={detailOpen}
          question={detailQuestion}
          onClose={() => setDetailOpen(false)}
        />

        <ConfirmDialog
          open={deleteDialogOpen}
          title="Delete or Archive Question"
          description={
            questionToDelete
              ? `Are you sure you want to delete "${questionToDelete.text.slice(0, 70)}..."? If this question is already snapshotted inside any active or past exam, it will be safely archived to preserve candidate attempt history.`
              : "Are you sure you want to proceed?"
          }
          confirmLabel="Proceed"
          destructive
          busy={actionBusy}
          onConfirm={handleConfirmDelete}
          onClose={() => setDeleteDialogOpen(false)}
        />
      </div>
    </DashboardLayout>
  );
}
