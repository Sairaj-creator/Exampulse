import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, expect, it, vi } from "vitest";
import { QuestionBankPage } from "../pages/teacher/QuestionBankPage";

vi.mock("../hooks/useAuth", () => ({
  useAuth: () => ({
    user: {
      _id: "teacher-1",
      name: "Dr. Alan Turing",
      email: "teacher1@exampulse.dev",
      role: "teacher",
    },
    logout: vi.fn(),
  }),
}));

vi.mock("../features/questions/api", () => ({
  getQuestionsApi: vi.fn().mockResolvedValue({
    questions: [
      {
        _id: "q-1",
        subjectId: { _id: "sub-1", code: "CS301", name: "DBMS" },
        topic: "Indexing",
        type: "single",
        text: "Which index type is clustered in MongoDB by default?",
        options: [
          { key: "A", text: "_id index" },
          { key: "B", text: "Compound index" },
        ],
        correctKeys: ["A"],
        difficulty: "easy",
        defaultMarks: 1,
        isArchived: false,
      },
    ],
    meta: { page: 1, totalPages: 1, total: 1, limit: 10 },
  }),
  getSubjectsApi: vi.fn().mockResolvedValue([
    { _id: "sub-1", code: "CS301", name: "DBMS" },
  ]),
  getTopicsApi: vi.fn().mockResolvedValue(["Indexing", "Transactions"]),
  createQuestionApi: vi.fn(),
  updateQuestionApi: vi.fn(),
  deleteQuestionApi: vi.fn(),
  getQuestionDetailApi: vi.fn(),
}));

beforeEach(() => vi.clearAllMocks());

it("renders the question bank and opens the create question dialog", async () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/teacher/questions"]}>
        <QuestionBankPage />
      </MemoryRouter>
    </QueryClientProvider>
  );

  // Question stem should appear in table (desktop + mobile card view)
  expect(
    await screen.findAllByText(/Which index type is clustered in MongoDB/i)
  ).not.toHaveLength(0);
  expect(screen.getAllByText("Indexing")).not.toHaveLength(0);

  // Click "+ Create Question"
  fireEvent.click(screen.getByRole("button", { name: /create question/i }));

  // Modal should open
  expect(
    screen.getByRole("dialog", { name: /create new question/i })
  ).toBeInTheDocument();
  expect(
    screen.getByPlaceholderText(/enter the complete question text/i)
  ).toBeInTheDocument();

  // Change question type to True / False
  const typeSelect = screen.getByLabelText(/question type/i);
  fireEvent.change(typeSelect, { target: { value: "truefalse" } });

  // Should display True/False answer selection buttons
  expect(screen.getByText("True / False Answer Selection")).toBeInTheDocument();
});
