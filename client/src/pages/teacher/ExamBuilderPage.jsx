import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  Search,
  Send,
  Save,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { PageHeader } from "../../components/common/PageHeader";
import { Button } from "../../components/ui/button";
import { listBatchesApi } from "../../features/admin/api";
import {
  addExamQuestionsApi,
  createExamApi,
  getExamApi,
  publishExamApi,
  removeExamQuestionApi,
  reorderExamQuestionsApi,
  updateExamApi,
  updateExamQuestionApi,
} from "../../features/exams/api";
import { getQuestionsApi, getSubjectsApi } from "../../features/questions/api";

const inputClass =
  "mt-1.5 w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-900 outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700";
const labelClass =
  "block text-xs font-semibold uppercase tracking-wider text-stone-600";
const steps = ["Details", "Questions", "Rules & schedule", "Review"];

function localDateTime(date) {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function initialForm() {
  const start = new Date(Date.now() + 24 * 60 * 60 * 1000);
  start.setMinutes(0, 0, 0);
  return {
    title: "",
    description: "",
    instructions: "",
    subjectId: "",
    batchIds: [],
    startTime: localDateTime(start),
    endTime: localDateTime(new Date(start.getTime() + 2 * 60 * 60 * 1000)),
    durationMinutes: 60,
    passPercentage: 40,
    negativeEnabled: false,
    penaltyFraction: 0.25,
    shuffleQuestions: false,
    shuffleOptions: false,
    reviewPolicy: "immediate",
  };
}

function Field({ label, children }) {
  return (
    <label className={labelClass}>
      {label}
      {children}
    </label>
  );
}

export function ExamBuilderPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const editing = Boolean(id);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(!editing);
  const [pageError, setPageError] = useState("");

  const subjectsQuery = useQuery({
    queryKey: ["subjects"],
    queryFn: getSubjectsApi,
  });
  const batchesQuery = useQuery({
    queryKey: ["batches"],
    queryFn: listBatchesApi,
  });
  const questionsQuery = useQuery({
    queryKey: ["builder-questions", form.subjectId],
    queryFn: () => getQuestionsApi({ subjectId: form.subjectId, limit: 100 }),
    enabled: Boolean(form.subjectId),
  });

  useEffect(() => {
    if (!editing) return;
    getExamApi(id)
      .then((exam) => {
        if (exam.status !== "draft")
          throw new Error(
            "Unpublish this exam before editing its paper and rules.",
          );
        setForm({
          title: exam.title,
          description: exam.description || "",
          instructions: exam.instructions || "",
          subjectId: exam.subjectId?._id || exam.subjectId,
          batchIds: exam.batchIds.map((batch) => batch._id || batch),
          startTime: localDateTime(new Date(exam.startTime)),
          endTime: localDateTime(new Date(exam.endTime)),
          durationMinutes: exam.durationMinutes,
          passPercentage: exam.passPercentage,
          negativeEnabled: exam.negativeMarking.enabled,
          penaltyFraction: exam.negativeMarking.penaltyFraction,
          shuffleQuestions: exam.shuffleQuestions,
          shuffleOptions: exam.shuffleOptions,
          reviewPolicy: exam.reviewPolicy,
        });
        setSelected(
          exam.questions.map((question) => ({
            sourceQuestionId: question.sourceQuestionId,
            snapshotId: question._id,
            text: question.text,
            topic: question.topic,
            difficulty: question.difficulty,
            type: question.type,
            marks: question.marks,
          })),
        );
        setLoaded(true);
      })
      .catch((error) => setPageError(error.message || "Could not load exam."));
  }, [editing, id]);

  const visibleQuestions = useMemo(() => {
    const bankQuestions = questionsQuery.data?.questions || [];
    const term = search.trim().toLowerCase();
    return term
      ? bankQuestions.filter((question) =>
          `${question.text} ${question.topic}`.toLowerCase().includes(term),
        )
      : bankQuestions;
  }, [questionsQuery.data, search]);
  const totalMarks = selected.reduce(
    (sum, question) => sum + Number(question.marks || 0),
    0,
  );

  const setValue = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));
  const toggleBatch = (batchId) =>
    setValue(
      "batchIds",
      form.batchIds.includes(batchId)
        ? form.batchIds.filter((value) => value !== batchId)
        : [...form.batchIds, batchId],
    );
  const toggleQuestion = (question) => {
    const sourceQuestionId = question._id;
    setSelected((current) =>
      current.some((item) => item.sourceQuestionId === sourceQuestionId)
        ? current.filter((item) => item.sourceQuestionId !== sourceQuestionId)
        : [
            ...current,
            {
              sourceQuestionId,
              text: question.text,
              topic: question.topic,
              difficulty: question.difficulty,
              type: question.type,
              marks: question.defaultMarks,
            },
          ],
    );
  };
  const moveQuestion = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= selected.length) return;
    setSelected((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const validateStep = () => {
    if (step === 0 && (form.title.trim().length < 3 || !form.subjectId))
      return "Add a title and choose a subject.";
    if (step === 1 && selected.length === 0)
      return "Select at least one question.";
    if (step === 2) {
      if (!form.batchIds.length) return "Assign at least one batch.";
      if (
        !form.startTime ||
        !form.endTime ||
        new Date(form.endTime) <= new Date(form.startTime)
      )
        return "Choose a valid start and end time.";
      if (
        Number(form.durationMinutes) >
        (new Date(form.endTime) - new Date(form.startTime)) / 60000
      )
        return "Duration cannot exceed the exam window.";
    }
    return "";
  };

  const goNext = () => {
    const message = validateStep();
    if (message) return setPageError(message);
    setPageError("");
    setStep((value) => Math.min(3, value + 1));
  };

  const buildPayload = () => ({
    title: form.title.trim(),
    description: form.description.trim(),
    instructions: form.instructions.trim(),
    subjectId: form.subjectId,
    batchIds: form.batchIds,
    startTime: new Date(form.startTime).toISOString(),
    endTime: new Date(form.endTime).toISOString(),
    durationMinutes: Number(form.durationMinutes),
    passPercentage: Number(form.passPercentage),
    negativeMarking: {
      enabled: form.negativeEnabled,
      penaltyFraction: Number(form.penaltyFraction),
    },
    shuffleQuestions: form.shuffleQuestions,
    shuffleOptions: form.shuffleOptions,
    reviewPolicy: form.reviewPolicy,
  });

  const syncQuestions = async (examId, exam) => {
    const targetIds = selected.map((item) => item.sourceQuestionId);
    for (const existing of exam.questions || []) {
      if (!targetIds.includes(existing.sourceQuestionId))
        await removeExamQuestionApi(examId, existing._id);
    }
    const existingSourceIds = new Set(
      (exam.questions || []).map((item) => item.sourceQuestionId),
    );
    const newIds = targetIds.filter(
      (sourceId) => !existingSourceIds.has(sourceId),
    );
    if (newIds.length) await addExamQuestionsApi(examId, newIds);

    let current = await getExamApi(examId);
    const selectedBySource = new Map(
      selected.map((item) => [item.sourceQuestionId, item]),
    );
    for (const snapshot of current.questions) {
      const desired = selectedBySource.get(snapshot.sourceQuestionId);
      if (desired && Number(desired.marks) !== Number(snapshot.marks)) {
        await updateExamQuestionApi(
          examId,
          snapshot._id,
          Number(desired.marks),
        );
      }
    }
    current = await getExamApi(examId);
    const snapshotBySource = new Map(
      current.questions.map((item) => [item.sourceQuestionId, item._id]),
    );
    await reorderExamQuestionsApi(
      examId,
      targetIds.map((sourceId) => snapshotBySource.get(sourceId)),
    );
  };

  const save = async (publish) => {
    const message = validateStep();
    if (message) return setPageError(message);
    setBusy(true);
    setPageError("");
    try {
      const exam = editing
        ? await updateExamApi(id, buildPayload())
        : await createExamApi(buildPayload());
      await syncQuestions(exam._id, exam);
      if (publish) await publishExamApi(exam._id);
      toast.success(publish ? "Exam published" : "Draft saved");
      navigate(`/teacher/exams/${exam._id}`);
    } catch (error) {
      setPageError(error.message || "Could not save exam.");
    } finally {
      setBusy(false);
    }
  };

  if (!loaded && !pageError)
    return (
      <DashboardLayout>
        <div className="rounded-2xl border border-stone-200 bg-white p-12 text-center text-sm text-stone-500">
          Loading exam builder…
        </div>
      </DashboardLayout>
    );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Exam builder"
          title={editing ? "Edit exam draft" : "Create a new exam"}
          description="Build a fixed question snapshot, configure access rules, then review the paper before publishing."
        />
        <ol
          className="grid grid-cols-2 gap-2 rounded-2xl border border-stone-200 bg-white p-3 md:grid-cols-4"
          aria-label="Exam builder steps"
        >
          {steps.map((name, index) => (
            <li
              key={name}
              className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold ${index === step ? "bg-primary text-white" : index < step ? "bg-emerald-50 text-emerald-800" : "text-stone-400"}`}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full ${index === step ? "bg-white/20" : "bg-stone-100"}`}
              >
                {index < step ? <Check size={13} /> : index + 1}
              </span>
              {name}
            </li>
          ))}
        </ol>
        {pageError && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
          >
            {pageError}
          </div>
        )}

        <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-7">
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-stone-900">
                  Exam details
                </h2>
                <p className="mt-1 text-sm text-stone-500">
                  Give students a clear name, subject, and instructions.
                </p>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Exam title">
                  <input
                    className={inputClass}
                    value={form.title}
                    onChange={(event) => setValue("title", event.target.value)}
                    minLength="3"
                    maxLength="150"
                    required
                  />
                </Field>
                <Field label="Subject">
                  <select
                    className={inputClass}
                    value={form.subjectId}
                    onChange={(event) => {
                      setValue("subjectId", event.target.value);
                      setSelected([]);
                    }}
                    disabled={editing && selected.length > 0}
                    required
                  >
                    <option value="">Choose a subject</option>
                    {(subjectsQuery.data || []).map((subject) => (
                      <option key={subject._id} value={subject._id}>
                        {subject.code} · {subject.name}
                      </option>
                    ))}
                  </select>
                  {editing && selected.length > 0 && (
                    <span className="mt-1.5 block text-[11px] font-normal normal-case tracking-normal text-stone-500">
                      Remove all questions before changing the subject.
                    </span>
                  )}
                </Field>
              </div>
              <Field label="Description">
                <textarea
                  className={inputClass}
                  rows="3"
                  value={form.description}
                  onChange={(event) =>
                    setValue("description", event.target.value)
                  }
                  placeholder="What does this assessment cover?"
                />
              </Field>
              <Field label="Student instructions">
                <textarea
                  className={inputClass}
                  rows="4"
                  value={form.instructions}
                  onChange={(event) =>
                    setValue("instructions", event.target.value)
                  }
                  placeholder="Rules students should read before starting"
                />
              </Field>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-stone-900">
                    Choose questions
                  </h2>
                  <p className="mt-1 text-sm text-stone-500">
                    Selected questions are copied into this exam, so later bank
                    edits cannot change the paper.
                  </p>
                </div>
                <div className="rounded-xl bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800">
                  {selected.length} selected · {totalMarks} marks
                </div>
              </div>
              <label className="relative block">
                <Search
                  className="absolute left-3 top-3 text-stone-400"
                  size={17}
                />
                <input
                  aria-label="Search question bank"
                  className={`${inputClass} mt-0 pl-10`}
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search this subject's question bank"
                />
              </label>
              {!form.subjectId ? (
                <p className="py-8 text-center text-sm text-stone-500">
                  Choose a subject in Details first.
                </p>
              ) : questionsQuery.isLoading ? (
                <p className="py-8 text-center text-sm text-stone-500">
                  Loading questions…
                </p>
              ) : (
                <div className="grid gap-3 lg:grid-cols-2">
                  {visibleQuestions.map((question) => {
                    const checked = selected.some(
                      (item) => item.sourceQuestionId === question._id,
                    );
                    return (
                      <label
                        key={question._id}
                        className={`flex cursor-pointer gap-3 rounded-xl border p-4 ${checked ? "border-emerald-600 bg-emerald-50" : "border-stone-200 hover:border-stone-300"}`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleQuestion(question)}
                          className="mt-1 h-4 w-4 accent-emerald-800"
                        />
                        <span>
                          <span className="block text-sm font-semibold text-stone-900">
                            {question.text}
                          </span>
                          <span className="mt-2 block text-xs text-stone-500">
                            {question.topic} · {question.type} ·{" "}
                            {question.difficulty} · {question.defaultMarks}{" "}
                            marks
                          </span>
                        </span>
                      </label>
                    );
                  })}
                  {!visibleQuestions.length && (
                    <p className="col-span-full py-8 text-center text-sm text-stone-500">
                      No available questions for this subject.
                    </p>
                  )}
                </div>
              )}
              {selected.length > 0 && (
                <div className="border-t border-stone-200 pt-5">
                  <h3 className="mb-3 text-sm font-bold text-stone-900">
                    Paper order and marks
                  </h3>
                  <div className="space-y-2">
                    {selected.map((question, index) => (
                      <div
                        key={question.sourceQuestionId}
                        className="flex items-center gap-3 rounded-xl bg-stone-50 p-3"
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-stone-600">
                          {index + 1}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-stone-800">
                          {question.text}
                        </span>
                        <input
                          aria-label={`Marks for question ${index + 1}`}
                          className="w-20 rounded-lg border border-stone-300 px-2 py-1.5 text-sm"
                          type="number"
                          min="0.5"
                          max="100"
                          step="0.5"
                          value={question.marks}
                          onChange={(event) =>
                            setSelected((current) =>
                              current.map((item, itemIndex) =>
                                itemIndex === index
                                  ? { ...item, marks: event.target.value }
                                  : item,
                              ),
                            )
                          }
                        />
                        <button
                          type="button"
                          aria-label={`Move question ${index + 1} up`}
                          onClick={() => moveQuestion(index, -1)}
                          disabled={index === 0}
                          className="p-1 text-stone-500 disabled:opacity-30"
                        >
                          <ArrowUp size={15} />
                        </button>
                        <button
                          type="button"
                          aria-label={`Move question ${index + 1} down`}
                          onClick={() => moveQuestion(index, 1)}
                          disabled={index === selected.length - 1}
                          className="p-1 text-stone-500 disabled:opacity-30"
                        >
                          <ArrowDown size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-stone-900">
                  Rules and schedule
                </h2>
                <p className="mt-1 text-sm text-stone-500">
                  Control eligibility, timing, marking, shuffling, and result
                  review.
                </p>
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-600">
                  Assigned batches
                </h3>
                <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {(batchesQuery.data || []).map((batch) => (
                    <label
                      key={batch._id}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm font-semibold ${form.batchIds.includes(batch._id) ? "border-emerald-600 bg-emerald-50 text-emerald-900" : "border-stone-200 text-stone-700"}`}
                    >
                      <input
                        type="checkbox"
                        checked={form.batchIds.includes(batch._id)}
                        onChange={() => toggleBatch(batch._id)}
                        className="accent-emerald-800"
                      />
                      {batch.name} · {batch.year}
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                <Field label="Start time">
                  <input
                    className={inputClass}
                    type="datetime-local"
                    value={form.startTime}
                    onChange={(event) =>
                      setValue("startTime", event.target.value)
                    }
                  />
                </Field>
                <Field label="End time">
                  <input
                    className={inputClass}
                    type="datetime-local"
                    value={form.endTime}
                    onChange={(event) =>
                      setValue("endTime", event.target.value)
                    }
                  />
                </Field>
                <Field label="Duration (minutes)">
                  <input
                    className={inputClass}
                    type="number"
                    min="1"
                    max="1440"
                    value={form.durationMinutes}
                    onChange={(event) =>
                      setValue("durationMinutes", event.target.value)
                    }
                  />
                </Field>
                <Field label="Pass percentage">
                  <input
                    className={inputClass}
                    type="number"
                    min="0"
                    max="100"
                    value={form.passPercentage}
                    onChange={(event) =>
                      setValue("passPercentage", event.target.value)
                    }
                  />
                </Field>
                <Field label="Review policy">
                  <select
                    className={inputClass}
                    value={form.reviewPolicy}
                    onChange={(event) =>
                      setValue("reviewPolicy", event.target.value)
                    }
                  >
                    <option value="immediate">Immediately after submit</option>
                    <option value="after_end">After exam ends</option>
                    <option value="never">Never show answers</option>
                  </select>
                </Field>
                {form.negativeEnabled && (
                  <Field label="Wrong-answer penalty">
                    <input
                      className={inputClass}
                      type="number"
                      min="0"
                      max="1"
                      step="0.05"
                      value={form.penaltyFraction}
                      onChange={(event) =>
                        setValue("penaltyFraction", event.target.value)
                      }
                    />
                  </Field>
                )}
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {[
                  ["negativeEnabled", "Negative marking"],
                  ["shuffleQuestions", "Shuffle questions"],
                  ["shuffleOptions", "Shuffle options"],
                ].map(([key, label]) => (
                  <label
                    key={key}
                    className="flex cursor-pointer items-center gap-3 rounded-xl border border-stone-200 p-4 text-sm font-semibold text-stone-700"
                  >
                    <input
                      type="checkbox"
                      checked={form[key]}
                      onChange={(event) => setValue(key, event.target.checked)}
                      className="h-4 w-4 accent-emerald-800"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-stone-900">
                  Review and publish
                </h2>
                <p className="mt-1 text-sm text-stone-500">
                  Check the final paper. Saving keeps it private; publishing
                  activates it for the scheduled window.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-xl bg-stone-50 p-4">
                  <p className="text-xs text-stone-500">Questions</p>
                  <p className="mt-1 text-2xl font-bold">{selected.length}</p>
                </div>
                <div className="rounded-xl bg-stone-50 p-4">
                  <p className="text-xs text-stone-500">Total marks</p>
                  <p className="mt-1 text-2xl font-bold">{totalMarks}</p>
                </div>
                <div className="rounded-xl bg-stone-50 p-4">
                  <p className="text-xs text-stone-500">Duration</p>
                  <p className="mt-1 text-2xl font-bold">
                    {form.durationMinutes}
                    <span className="ml-1 text-xs font-medium">min</span>
                  </p>
                </div>
                <div className="rounded-xl bg-stone-50 p-4">
                  <p className="text-xs text-stone-500">Batches</p>
                  <p className="mt-1 text-2xl font-bold">
                    {form.batchIds.length}
                  </p>
                </div>
              </div>
              <dl className="grid gap-4 rounded-xl border border-stone-200 p-5 text-sm md:grid-cols-2">
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-stone-500">
                    Title
                  </dt>
                  <dd className="mt-1 font-semibold text-stone-900">
                    {form.title}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-stone-500">
                    Subject
                  </dt>
                  <dd className="mt-1 font-semibold text-stone-900">
                    {
                      (subjectsQuery.data || []).find(
                        (subject) => subject._id === form.subjectId,
                      )?.name
                    }
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-stone-500">
                    Window
                  </dt>
                  <dd className="mt-1 font-semibold text-stone-900">
                    {new Date(form.startTime).toLocaleString()} –{" "}
                    {new Date(form.endTime).toLocaleString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-stone-500">
                    Rules
                  </dt>
                  <dd className="mt-1 font-semibold text-stone-900">
                    {form.negativeEnabled
                      ? `${form.penaltyFraction}× negative marking`
                      : "No negative marking"}{" "}
                    · {form.reviewPolicy.replace("_", " ")}
                  </dd>
                </div>
              </dl>
              <div className="flex flex-wrap justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => save(false)}
                  disabled={busy}
                >
                  <Save size={16} /> {busy ? "Saving…" : "Save draft"}
                </Button>
                <Button onClick={() => save(true)} disabled={busy}>
                  <Send size={16} /> {busy ? "Publishing…" : "Publish exam"}
                </Button>
              </div>
            </div>
          )}
        </section>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() =>
              step === 0
                ? navigate("/teacher/exams")
                : setStep((value) => value - 1)
            }
            disabled={busy}
          >
            <ArrowLeft size={16} /> {step === 0 ? "Cancel" : "Back"}
          </Button>
          {step < 3 && (
            <Button onClick={goNext}>
              Continue <ArrowRight size={16} />
            </Button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
