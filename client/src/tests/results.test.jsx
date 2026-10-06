import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ResultPage } from "../pages/student/ResultPage";
import { LeaderboardPage } from "../pages/student/LeaderboardPage";
import { ExamDetailPage } from "../pages/teacher/ExamDetailPage";
import * as resultApi from "../features/results/api";
import * as examApi from "../features/exams/api";

vi.mock("../hooks/useAuth", () => ({
  useAuth: () => ({
    user: {
      _id: "student-1",
      name: "Alice Student",
      email: "alice@example.com",
      role: "student",
      batchId: { _id: "batch-1", name: "CSE-A 2028" },
    },
    logout: vi.fn(),
  }),
}));

vi.mock("../features/results/api", () => ({
  getAttemptResultApi: vi.fn(),
  getExamLeaderboardApi: vi.fn(),
  getExamSubmissionsApi: vi.fn(),
  resetAttemptApi: vi.fn(),
  exportExamCsvApi: vi.fn(),
  getMyAttemptsApi: vi.fn(),
}));

vi.mock("../features/exams/api", () => ({
  getExamApi: vi.fn(),
  deleteExamApi: vi.fn(),
  publishExamApi: vi.fn(),
  unpublishExamApi: vi.fn(),
  archiveExamApi: vi.fn(),
  duplicateExamApi: vi.fn(),
}));

describe("Phase 7: Results, Review, and Leaderboard", () => {
  let queryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  const renderWithRouter = (ui, { route = "/" } = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
      </QueryClientProvider>,
    );
  };

  it("renders the student result page with score ring, summary metrics, and full review", async () => {
    resultApi.getAttemptResultApi.mockResolvedValue({
      attemptId: "att-1",
      examId: "exam-1",
      examTitle: "Database Management Systems Final",
      subject: { _id: "sub-1", code: "CS301", name: "DBMS" },
      reviewPolicy: "immediate",
      allowFullReview: true,
      reviewAvailableAt: null,
      submittedAt: "2026-10-06T12:00:00.000Z",
      submitReason: "manual",
      ranking: {
        rank: 1,
        totalParticipants: 10,
        percentile: 90,
      },
      result: {
        score: 18,
        totalMarks: 20,
        percentage: 90,
        passed: true,
        correctCount: 9,
        wrongCount: 1,
        unansweredCount: 0,
        timeTakenSeconds: 1540,
        evaluations: [
          {
            snapshotId: "q-1",
            text: "Which of the following is a NoSQL database?",
            topic: "NoSQL",
            type: "single",
            marksAwarded: 2,
            maxMarks: 2,
            isCorrect: true,
            isUnanswered: false,
            selectedKeys: ["b"],
            correctKeys: ["b"],
            explanation: "MongoDB stores schema-free documents in BSON format.",
            options: [
              { key: "a", text: "PostgreSQL" },
              { key: "b", text: "MongoDB" },
              { key: "c", text: "SQLite" },
            ],
          },
        ],
      },
    });

    renderWithRouter(
      <Routes>
        <Route path="/student/attempts/:id/result" element={<ResultPage />} />
      </Routes>,
      { route: "/student/attempts/att-1/result" },
    );

    expect(
      await screen.findByText("Database Management Systems Final"),
    ).toBeInTheDocument();
    expect(screen.getAllByText("90%").length).toBeGreaterThan(0);
    expect(screen.getByText("18 / 20 pts")).toBeInTheDocument();
    expect(screen.getByText("PASSED")).toBeInTheDocument();
    expect(screen.getByText(/Ranked #1 out of 10/i)).toBeInTheDocument();
    expect(screen.getByText("#1")).toBeInTheDocument();
    expect(
      screen.getByText("Which of the following is a NoSQL database?"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("MongoDB stores schema-free documents in BSON format."),
    ).toBeInTheDocument();
    expect(screen.getByText("Topic Performance")).toBeInTheDocument();
    expect(screen.getByText("View Leaderboard")).toBeInTheDocument();
  });

  it("displays restriction notice when review policy hides solutions", async () => {
    resultApi.getAttemptResultApi.mockResolvedValue({
      attemptId: "att-2",
      examId: "exam-2",
      examTitle: "Network Security Quiz",
      subject: { _id: "sub-2", code: "CS401", name: "Security" },
      reviewPolicy: "after_end",
      allowFullReview: false,
      reviewAvailableAt: "2026-10-06T18:00:00.000Z",
      submittedAt: "2026-10-06T12:00:00.000Z",
      submitReason: "manual",
      ranking: null,
      result: {
        score: 15,
        totalMarks: 20,
        percentage: 75,
        passed: true,
        correctCount: 7,
        wrongCount: 2,
        unansweredCount: 1,
        timeTakenSeconds: 1200,
        evaluations: [],
      },
    });

    renderWithRouter(
      <Routes>
        <Route path="/student/attempts/:id/result" element={<ResultPage />} />
      </Routes>,
      { route: "/student/attempts/att-2/result" },
    );

    expect(
      await screen.findByText("Answer Review Restricted by Policy"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Official correct answers and explanations will be unlocked automatically/i,
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText("Question Evaluations")).not.toBeInTheDocument();
  });

  it("renders leaderboard standings with ranks, medals, and participants", async () => {
    resultApi.getExamLeaderboardApi.mockResolvedValue({
      examId: "exam-1",
      examTitle: "Operating Systems Final",
      totalParticipants: 3,
      myEntry: {
        rank: 2,
        attemptId: "att-2",
        student: {
          _id: "student-1",
          name: "Alice Student",
        },
        score: 18,
        totalMarks: 20,
        percentage: 90,
        timeTakenSeconds: 1200,
        percentile: 33.3,
      },
      topEntries: [
        {
          rank: 1,
          attemptId: "att-1",
          student: {
            _id: "student-2",
            name: "Bob Top",
            rollNumber: "CS-002",
          },
          score: 20,
          totalMarks: 20,
          percentage: 100,
          timeTakenSeconds: 1100,
          percentile: 66.7,
        },
        {
          rank: 2,
          attemptId: "att-2",
          student: {
            _id: "student-1",
            name: "Alice Student",
            rollNumber: "CS-001",
          },
          score: 18,
          totalMarks: 20,
          percentage: 90,
          timeTakenSeconds: 1200,
          percentile: 33.3,
        },
        {
          rank: 3,
          attemptId: "att-3",
          student: {
            _id: "student-3",
            name: "Charlie Three",
            rollNumber: "CS-003",
          },
          score: 14,
          totalMarks: 20,
          percentage: 70,
          timeTakenSeconds: 1400,
          percentile: 0,
        },
      ],
    });

    renderWithRouter(
      <Routes>
        <Route
          path="/student/exams/:id/leaderboard"
          element={<LeaderboardPage />}
        />
      </Routes>,
      { route: "/student/exams/exam-1/leaderboard" },
    );

    expect(
      await screen.findByText("Operating Systems Final"),
    ).toBeInTheDocument();
    expect(screen.getByText("Bob Top")).toBeInTheDocument();
    expect(screen.getAllByText("Alice Student").length).toBeGreaterThan(0);
    expect(screen.getByText("Charlie Three")).toBeInTheDocument();
    expect(screen.getByText(/3 candidates participated/i)).toBeInTheDocument();
  });

  it("shows locked banner when student accesses leaderboard before exam window concludes", async () => {
    const error = new Error(
      "Leaderboard is available after the exam window ends.",
    );
    error.code = "EXAM_NOT_ENDED";
    resultApi.getExamLeaderboardApi.mockRejectedValue(error);

    renderWithRouter(
      <Routes>
        <Route
          path="/student/exams/:id/leaderboard"
          element={<LeaderboardPage />}
        />
      </Routes>,
      { route: "/student/exams/exam-live/leaderboard" },
    );

    expect(await screen.findByText("Leaderboard Locked")).toBeInTheDocument();
    expect(
      screen.getByText(
        /Official candidate standings are released automatically/i,
      ),
    ).toBeInTheDocument();
  });

  it("teacher can switch to Submissions tab, view candidate attempts, warnings, and trigger CSV export", async () => {
    examApi.getExamApi.mockResolvedValue({
      _id: "exam-detail-1",
      title: "Data Structures Midterm",
      description: "Trees and Graphs",
      subjectId: { _id: "sub-1", code: "CS201", name: "Data Structures" },
      status: "published",
      phase: "live",
      startTime: "2026-10-01T09:00:00.000Z",
      endTime: "2026-10-01T11:00:00.000Z",
      durationMinutes: 60,
      totalMarks: 30,
      reviewPolicy: "immediate",
      batchIds: [{ _id: "batch-1", name: "CSE-A" }],
      negativeMarking: { enabled: false, penaltyFraction: 0 },
      questions: [{ _id: "q-1" }],
      attemptCount: 1,
    });

    resultApi.getExamSubmissionsApi.mockResolvedValue([
      {
        _id: "att-sub-1",
        student: {
          _id: "stu-1",
          name: "Dave Suspect",
          email: "dave@example.com",
        },
        status: "submitted",
        score: 24,
        totalMarks: 30,
        percentage: 80,
        passed: true,
        submittedAt: "2026-10-01T10:15:00.000Z",
        submitReason: "manual",
        timeTakenSeconds: 1800,
        tabSwitchCount: 4,
      },
    ]);

    renderWithRouter(
      <Routes>
        <Route path="/teacher/exams/:id" element={<ExamDetailPage />} />
      </Routes>,
      { route: "/teacher/exams/exam-detail-1" },
    );

    expect(
      await screen.findByText("Data Structures Midterm"),
    ).toBeInTheDocument();

    // Click Submissions tab
    const submissionsBtn = screen.getByRole("button", { name: /submissions/i });
    fireEvent.click(submissionsBtn);

    // Verify candidate row and tab switch warning badge
    expect(await screen.findByText("Dave Suspect")).toBeInTheDocument();
    expect(screen.getByText("4 (flagged)")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reset/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /view/i })).toHaveAttribute(
      "href",
      "/teacher/attempts/att-sub-1/result",
    );

    // Verify CSV export button exists
    const exportBtn = screen.getByRole("button", { name: /export csv/i });
    expect(exportBtn).toBeInTheDocument();
  });
});
