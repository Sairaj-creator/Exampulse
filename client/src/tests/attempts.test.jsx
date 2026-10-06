import React from "react";
import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StudentExamsPage } from "../pages/student/StudentExamsPage";
import { ExamInstructionsPage } from "../pages/student/ExamInstructionsPage";
import { ExamRoom } from "../features/attempt/ExamRoom";
import * as attemptApi from "../features/attempt/api";
import { useAutosave } from "../features/attempt/useAutosave";
import { useCountdown } from "../features/attempt/useCountdown";

vi.mock("../hooks/useAuth", () => ({
  useAuth: () => ({
    user: {
      _id: "student-1",
      name: "Test Student",
      email: "student@example.com",
      role: "student",
      batchId: { _id: "batch-1", name: "CSE-A 2028" },
    },
    logout: vi.fn(),
  }),
}));

vi.mock("../features/attempt/api", () => ({
  listStudentExamsApi: vi.fn(),
  getStudentExamInstructionsApi: vi.fn(),
  startOrResumeAttemptApi: vi.fn(),
  getAttemptStateApi: vi.fn(),
  saveAnswerApi: vi.fn(),
  recordAttemptEventApi: vi.fn(),
  submitAttemptApi: vi.fn(),
}));

describe("Student Exam-Taking Flow (Phase 6)", () => {
  let queryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  const renderWithRouter = (ui, { route = "/" } = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
      </QueryClientProvider>,
    );
  };

  it("renders student assigned exams list with live and upcoming tabs", async () => {
    const mockExams = [
      {
        _id: "exam-1",
        title: "Database Systems Midterm",
        description: "Covers indexing and aggregation",
        subject: { _id: "sub-1", name: "DBMS", code: "CS301" },
        durationMinutes: 45,
        totalMarks: 20,
        questionCount: 10,
        phase: "live",
        attemptStatus: "not_started",
      },
      {
        _id: "exam-2",
        title: "Networks Final Test",
        subject: { _id: "sub-2", name: "Computer Networks", code: "CS302" },
        durationMinutes: 60,
        totalMarks: 30,
        questionCount: 15,
        phase: "upcoming",
        attemptStatus: "not_started",
      },
    ];

    vi.mocked(attemptApi.listStudentExamsApi).mockResolvedValue(mockExams);

    renderWithRouter(<StudentExamsPage />, { route: "/student/exams" });

    // Header check
    expect(
      await screen.findByText("Assigned Examinations"),
    ).toBeInTheDocument();

    // Live tab should be active by default and display Database Systems Midterm
    expect(
      await screen.findByText("Database Systems Midterm"),
    ).toBeInTheDocument();
    expect(screen.getByText("Start Exam")).toBeInTheDocument();

    // Switch to Upcoming tab
    const upcomingTab = screen.getByRole("button", { name: /Upcoming/i });
    fireEvent.click(upcomingTab);

    expect(await screen.findByText("Networks Final Test")).toBeInTheDocument();
  });

  it("renders exam instructions and enforces agreement checkbox before start", async () => {
    const mockInstructions = {
      _id: "exam-1",
      title: "Database Systems Midterm",
      description: "Covers indexing and aggregation",
      instructions: "No textbooks permitted.",
      subject: { _id: "sub-1", name: "DBMS", code: "CS301" },
      durationMinutes: 45,
      effectiveDurationMinutes: 45,
      totalMarks: 20,
      questionCount: 10,
      passPercentage: 40,
      negativeMarking: { enabled: true, penaltyFraction: 0.25 },
      phase: "live",
      attemptStatus: "not_started",
    };

    vi.mocked(attemptApi.getStudentExamInstructionsApi).mockResolvedValue(
      mockInstructions,
    );
    vi.mocked(attemptApi.startOrResumeAttemptApi).mockResolvedValue({
      attemptId: "att-123",
      resumed: false,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/student/exams/exam-1"]}>
          <Routes>
            <Route
              path="/student/exams/:id"
              element={<ExamInstructionsPage />}
            />
            <Route
              path="/student/attempts/:id/take"
              element={<div>Exam room route</div>}
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(
      await screen.findByText("Examination Guidelines & Protocols"),
    ).toBeInTheDocument();
    expect(screen.getByText("Database Systems Midterm")).toBeInTheDocument();
    expect(screen.getByText("No textbooks permitted.")).toBeInTheDocument();

    // Start button should be disabled initially
    const startButton = screen.getByRole("button", { name: /Start Exam Now/i });
    expect(startButton).toBeDisabled();

    // Check agreement
    const agreeCheckbox = screen.getByLabelText(
      /I have read, understood, and agree/i,
    );
    fireEvent.click(agreeCheckbox);

    expect(startButton).not.toBeDisabled();

    // Click start
    fireEvent.click(startButton);
    await waitFor(() => {
      expect(attemptApi.startOrResumeAttemptApi).toHaveBeenCalledWith("exam-1");
    });
  });

  it("renders the exam room with timer, question panel, palette, and option selection", async () => {
    const mockAttemptData = {
      attemptId: "att-123",
      examId: "exam-1",
      examTitle: "Database Systems Midterm",
      durationMinutes: 45,
      remainingSeconds: 2700,
      serverNow: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 2700 * 1000).toISOString(),
      tabSwitchCount: 0,
      answers: [],
      questions: [
        {
          _id: "q-1",
          type: "single",
          text: "What data format does MongoDB use to store documents?",
          options: [
            { key: "A", text: "BSON" },
            { key: "B", text: "JSON" },
            { key: "C", text: "XML" },
          ],
          topic: "Storage Formats",
          difficulty: "easy",
          marks: 2,
        },
        {
          _id: "q-2",
          type: "multiple",
          text: "Which of the following are valid MongoDB index types?",
          options: [
            { key: "A", text: "Compound" },
            { key: "B", text: "Single Field" },
            { key: "C", text: "Relational Key" },
          ],
          topic: "Indexing",
          difficulty: "medium",
          marks: 3,
        },
      ],
    };

    vi.mocked(attemptApi.saveAnswerApi).mockResolvedValue({
      savedAt: new Date().toISOString(),
      remainingSeconds: 2690,
      questionId: "q-1",
      selectedKeys: ["A"],
      markedForReview: false,
    });

    render(
      <MemoryRouter>
        <ExamRoom attemptData={mockAttemptData} />
      </MemoryRouter>,
    );

    // Verify Title and Question 1 text
    expect(screen.getByText("Database Systems Midterm")).toBeInTheDocument();
    expect(
      screen.getByText("What data format does MongoDB use to store documents?"),
    ).toBeInTheDocument();

    // Verify Palette rendered with 2 buttons
    expect(
      screen.getByRole("button", { name: "Question 1" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Question 2" }),
    ).toBeInTheDocument();

    // Select option A (BSON)
    const optionA = screen.getByText("BSON");
    fireEvent.click(optionA);

    // Question 1 palette button should update to answered style
    await waitFor(() => {
      expect(attemptApi.saveAnswerApi).toHaveBeenCalledWith(
        "att-123",
        "q-1",
        expect.objectContaining({ selectedKeys: ["A"] }),
      );
    });

    // Mark for review
    const markButton = screen.getByRole("button", { name: /Mark for Review/i });
    fireEvent.click(markButton);

    await waitFor(() => {
      expect(screen.getByText("Marked for Review")).toBeInTheDocument();
    });

    // Open submit dialog
    const submitBtn = screen.getAllByRole("button", {
      name: /Submit Exam/i,
    })[0];
    fireEvent.click(submitBtn);

    expect(screen.getByText("Submit Examination?")).toBeInTheDocument();
    expect(screen.getByText("Confirm & Submit")).toBeInTheDocument();
  });

  it("counts down from the server clock with a monotonic deadline", async () => {
    vi.useFakeTimers();
    const serverNow = new Date("2026-10-06T10:00:00.000Z");
    vi.setSystemTime(serverNow);
    const onExpire = vi.fn();
    const { result } = renderHook(() =>
      useCountdown({
        serverNow: serverNow.toISOString(),
        expiresAt: new Date(serverNow.getTime() + 3000).toISOString(),
        onExpire,
      }),
    );

    expect(result.current.secondsLeft).toBe(3);
    await act(async () => vi.advanceTimersByTimeAsync(1100));
    expect(result.current.secondsLeft).toBe(2);

    vi.setSystemTime(new Date("2026-10-07T10:00:00.000Z"));
    await act(async () => vi.advanceTimersByTimeAsync(1900));
    expect(result.current.secondsLeft).toBe(0);
    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it("retries a failed autosave and reports success", async () => {
    vi.useFakeTimers();
    vi.mocked(attemptApi.saveAnswerApi)
      .mockRejectedValueOnce({ code: "NETWORK_ERROR" })
      .mockResolvedValueOnce({
        remainingSeconds: 120,
        savedAt: new Date().toISOString(),
      });

    const onSaveSuccess = vi.fn();
    const { result } = renderHook(() =>
      useAutosave({ attemptId: "attempt-1", onSaveSuccess }),
    );

    act(() => {
      result.current.queueSave("question-1", {
        selectedKeys: ["A"],
        markedForReview: false,
      });
    });
    expect(result.current.saveStatus).toBe("saving");

    await act(async () => vi.advanceTimersByTimeAsync(400));
    expect(result.current.saveStatus).toBe("retrying");
    await act(async () => vi.advanceTimersByTimeAsync(400));

    expect(attemptApi.saveAnswerApi).toHaveBeenCalledTimes(2);
    expect(onSaveSuccess).toHaveBeenCalledTimes(1);
    expect(result.current.saveStatus).toBe("saved");
  });

  it("flushes a pending answer before manual submission", async () => {
    const callOrder = [];
    vi.mocked(attemptApi.saveAnswerApi).mockImplementation(async () => {
      callOrder.push("save");
      return { remainingSeconds: 120, savedAt: new Date().toISOString() };
    });
    vi.mocked(attemptApi.submitAttemptApi).mockImplementation(async () => {
      callOrder.push("submit");
      return {
        status: "submitted",
        result: { score: 2, totalMarks: 2, percentage: 100, passed: true },
      };
    });

    render(
      <MemoryRouter>
        <ExamRoom
          attemptData={{
            attemptId: "attempt-flush",
            examTitle: "Autosave Flush Exam",
            serverNow: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 120000).toISOString(),
            remainingSeconds: 120,
            answers: [],
            questions: [
              {
                _id: "question-flush",
                type: "single",
                text: "Choose the persisted answer.",
                options: [
                  { key: "A", text: "Persist me" },
                  { key: "B", text: "Skip me" },
                ],
                marks: 2,
              },
            ],
          }}
        />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByText("Persist me"));
    fireEvent.click(screen.getAllByRole("button", { name: /submit exam/i })[0]);
    fireEvent.click(screen.getByRole("button", { name: /confirm & submit/i }));

    expect(
      await screen.findByText("Exam Submitted Successfully"),
    ).toBeInTheDocument();
    expect(callOrder).toEqual(["save", "submit"]);
  });

  it("automatically submits when the authoritative timer expires", async () => {
    vi.useFakeTimers();
    const serverNow = new Date("2026-10-06T12:00:00.000Z");
    vi.setSystemTime(serverNow);
    vi.mocked(attemptApi.submitAttemptApi).mockResolvedValue({
      status: "submitted",
      result: { score: 0, totalMarks: 1, percentage: 0, passed: false },
    });

    render(
      <MemoryRouter>
        <ExamRoom
          attemptData={{
            attemptId: "attempt-timeout",
            examTitle: "Timed Exam",
            serverNow: serverNow.toISOString(),
            expiresAt: new Date(serverNow.getTime() + 1000).toISOString(),
            remainingSeconds: 1,
            answers: [],
            questions: [
              {
                _id: "question-timeout",
                type: "truefalse",
                text: "Time expires automatically.",
                options: [
                  { key: "A", text: "True" },
                  { key: "B", text: "False" },
                ],
                marks: 1,
              },
            ],
          }}
        />
      </MemoryRouter>,
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1250);
      await Promise.resolve();
    });

    expect(attemptApi.submitAttemptApi).toHaveBeenCalledWith("attempt-timeout");
    expect(screen.getByText("Exam Submitted Successfully")).toBeInTheDocument();
  });
});
