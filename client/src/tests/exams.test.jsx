import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ExamBuilderPage } from "../pages/teacher/ExamBuilderPage";
import { ExamsPage } from "../pages/teacher/ExamsPage";
import * as examsApi from "../features/exams/api";

vi.mock("../hooks/useAuth", () => ({
  useAuth: () => ({
    user: {
      _id: "teacher-1",
      name: "Exam Teacher",
      email: "teacher@example.com",
      role: "teacher",
    },
    logout: vi.fn(),
  }),
}));

vi.mock("../features/admin/api", () => ({
  listBatchesApi: vi
    .fn()
    .mockResolvedValue([{ _id: "batch-1", name: "CSE-A", year: 2028 }]),
}));

vi.mock("../features/questions/api", () => ({
  getSubjectsApi: vi
    .fn()
    .mockResolvedValue([{ _id: "subject-1", code: "CS301", name: "DBMS" }]),
  getQuestionsApi: vi.fn().mockResolvedValue({
    questions: [
      {
        _id: "question-1",
        text: "Which database stores documents as BSON?",
        topic: "Document databases",
        type: "single",
        difficulty: "easy",
        defaultMarks: 2,
      },
    ],
    meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
  }),
}));

vi.mock("../features/exams/api", () => ({
  listExamsApi: vi.fn().mockResolvedValue({
    exams: [
      {
        _id: "exam-1",
        title: "DBMS Midterm",
        description: "Indexes and transactions",
        subjectId: { _id: "subject-1", code: "CS301", name: "DBMS" },
        status: "published",
        phase: "upcoming",
        startTime: "2028-01-10T09:00:00.000Z",
        durationMinutes: 60,
        totalMarks: 20,
        questions: [{ _id: "snapshot-1" }],
        attemptCount: 0,
      },
    ],
    meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
  }),
  getExamApi: vi.fn(),
  createExamApi: vi.fn(),
  updateExamApi: vi.fn(),
  deleteExamApi: vi.fn(),
  addExamQuestionsApi: vi.fn(),
  updateExamQuestionApi: vi.fn(),
  removeExamQuestionApi: vi.fn(),
  reorderExamQuestionsApi: vi.fn(),
  publishExamApi: vi.fn(),
  unpublishExamApi: vi.fn(),
  archiveExamApi: vi.fn(),
  duplicateExamApi: vi.fn(),
}));

function renderPage(component, path) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>{component}</MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => vi.clearAllMocks());
afterEach(() => cleanup());

it("shows teacher exams with lifecycle state and builder navigation", async () => {
  renderPage(<ExamsPage />, "/teacher/exams");
  expect(await screen.findByText("DBMS Midterm")).toBeInTheDocument();
  expect(screen.getByText("upcoming")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /build exam/i })).toHaveAttribute(
    "href",
    "/teacher/exams/new",
  );
  expect(
    screen.getByRole("button", { name: /unpublish/i }),
  ).toBeInTheDocument();
});

it("moves through the four builder steps with a selected question and batch", async () => {
  renderPage(<ExamBuilderPage />, "/teacher/exams/new");
  fireEvent.change(screen.getByLabelText(/exam title/i), {
    target: { value: "Database Quiz" },
  });
  await screen.findByRole("option", { name: /cs301 · dbms/i });
  fireEvent.change(screen.getByLabelText(/subject/i), {
    target: { value: "subject-1" },
  });
  fireEvent.click(screen.getByRole("button", { name: /continue/i }));

  const questionCheckbox = await screen.findByRole("checkbox", {
    name: /which database stores documents as bson/i,
  });
  fireEvent.click(questionCheckbox);
  expect(screen.getByText(/1 selected · 2 marks/i)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /continue/i }));

  const batchCheckbox = await screen.findByRole("checkbox", { name: /cse-a/i });
  fireEvent.click(batchCheckbox);
  fireEvent.click(screen.getByRole("button", { name: /continue/i }));

  expect(screen.getByText("Review and publish")).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /save draft/i }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /publish exam/i }),
  ).toBeInTheDocument();
});

it("retries a failed publish on the same draft instead of creating a second exam", async () => {
  const draft = { _id: "exam-new", questions: [] };
  examsApi.createExamApi.mockResolvedValue(draft);
  examsApi.updateExamApi.mockResolvedValue(draft);
  examsApi.addExamQuestionsApi.mockResolvedValue(draft);
  examsApi.reorderExamQuestionsApi.mockResolvedValue(draft);
  examsApi.getExamApi.mockResolvedValue({
    _id: "exam-new",
    questions: [
      { _id: "snapshot-1", sourceQuestionId: "question-1", marks: 2 },
    ],
  });
  examsApi.publishExamApi
    .mockRejectedValueOnce({ message: "Publishing is temporarily unavailable" })
    .mockResolvedValueOnce(draft);

  renderPage(<ExamBuilderPage />, "/teacher/exams/new");
  fireEvent.change(screen.getByLabelText(/exam title/i), {
    target: { value: "Database Quiz" },
  });
  await screen.findByRole("option", { name: /cs301 · dbms/i });
  fireEvent.change(screen.getByLabelText(/subject/i), {
    target: { value: "subject-1" },
  });
  fireEvent.click(screen.getByRole("button", { name: /continue/i }));
  fireEvent.click(
    await screen.findByRole("checkbox", {
      name: /which database stores documents as bson/i,
    }),
  );
  fireEvent.click(screen.getByRole("button", { name: /continue/i }));
  fireEvent.click(await screen.findByRole("checkbox", { name: /cse-a/i }));
  fireEvent.click(screen.getByRole("button", { name: /continue/i }));

  fireEvent.click(screen.getByRole("button", { name: /publish exam/i }));
  expect(
    await screen.findByText("Publishing is temporarily unavailable"),
  ).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: /publish exam/i }));
  await waitFor(() => expect(examsApi.publishExamApi).toHaveBeenCalledTimes(2));
  expect(examsApi.createExamApi).toHaveBeenCalledTimes(1);
  expect(examsApi.updateExamApi).toHaveBeenCalledWith(
    "exam-new",
    expect.objectContaining({ title: "Database Quiz" }),
  );
});

it("rejects invalid question marks before leaving the questions step", async () => {
  renderPage(<ExamBuilderPage />, "/teacher/exams/new");
  fireEvent.change(screen.getByLabelText(/exam title/i), {
    target: { value: "Database Quiz" },
  });
  await screen.findByRole("option", { name: /cs301 · dbms/i });
  fireEvent.change(screen.getByLabelText(/subject/i), {
    target: { value: "subject-1" },
  });
  fireEvent.click(screen.getByRole("button", { name: /continue/i }));
  fireEvent.click(
    await screen.findByRole("checkbox", {
      name: /which database stores documents as bson/i,
    }),
  );
  fireEvent.change(screen.getByLabelText("Marks for question 1"), {
    target: { value: "0" },
  });
  fireEvent.click(screen.getByRole("button", { name: /continue/i }));

  expect(screen.getByRole("alert")).toHaveTextContent(
    "Marks for every question must be between 0.5 and 100.",
  );
  expect(screen.getByText("Choose questions")).toBeInTheDocument();
});
