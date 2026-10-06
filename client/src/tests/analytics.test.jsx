import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { StudentAnalyticsPage } from "../pages/student/StudentAnalyticsPage";
import { StudentDashboard } from "../pages/student/StudentDashboard";
import { TeacherDashboard } from "../pages/teacher/TeacherDashboard";
import { TeacherStudentAnalyticsPage } from "../pages/teacher/TeacherStudentAnalyticsPage";
import { ExamDetailPage } from "../pages/teacher/ExamDetailPage";
import { AdminDashboard } from "../pages/admin/AdminDashboard";
import { DailyActivityChart } from "../features/analytics/DailyActivityChart";
import { ScoreHistogram } from "../features/analytics/ScoreHistogram";
import { QuestionStatsTable } from "../features/analytics/QuestionStatsTable";

import * as analyticsApi from "../features/analytics/api";
import * as examApi from "../features/exams/api";

// Mock Recharts ResponsiveContainer for jsdom testing
vi.mock("recharts", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    ResponsiveContainer: ({ children }) => (
      <div style={{ width: 500, height: 300 }}>{children}</div>
    ),
  };
});

let mockUserRole = "student";

vi.mock("../hooks/useAuth", () => ({
  useAuth: () => ({
    user: {
      _id: "user-123",
      name: "Alex User",
      email: "alex@example.com",
      role: mockUserRole,
      batchId: { _id: "batch-1", name: "CSE-A 2028" },
    },
    logout: vi.fn(),
  }),
}));

vi.mock("../features/analytics/api", () => ({
  getStudentAnalyticsApi: vi.fn(),
  getExamAnalyticsApi: vi.fn(),
  getExamQuestionsAnalyticsApi: vi.fn(),
  getSubjectAnalyticsApi: vi.fn(),
  getTeacherOverviewApi: vi.fn(),
  getAdminOverviewApi: vi.fn(),
}));

vi.mock("../features/exams/api", () => ({
  getExamApi: vi.fn(),
  archiveExamApi: vi.fn(),
  duplicateExamApi: vi.fn(),
  publishExamApi: vi.fn(),
  unpublishExamApi: vi.fn(),
}));

vi.mock("../features/results/api", () => ({
  getExamSubmissionsApi: vi.fn(),
  resetAttemptApi: vi.fn(),
  exportExamCsvApi: vi.fn(),
}));

describe("Phase 9: Analytics Dashboards Frontend", () => {
  let queryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.clearAllMocks();
    mockUserRole = "student";
    global.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  });

  afterEach(() => {
    cleanup();
  });

  const renderWithRouter = (ui, { route = "/" } = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
      </QueryClientProvider>
    );
  };

  it("1. StudentAnalyticsPage renders overview KPIs, trend, subjects, and topic strengths", async () => {
    analyticsApi.getStudentAnalyticsApi.mockResolvedValueOnce({
      overview: {
        examsTaken: 6,
        averagePercentage: 82.5,
        bestScore: 95,
        latestScore: 88,
      },
      improvement: {
        available: true,
        recentAvg: 88.0,
        previousAvg: 77.0,
        delta: 11.0,
        direction: "up",
        requiredAttempts: 6,
      },
      timeEfficiency: {
        averageTimeTakenSeconds: 1800,
        averageDurationSeconds: 3600,
        efficiencyPercentage: 50,
      },
      trend: [
        {
          examId: "e1",
          examTitle: "Midterm Algorithmics",
          date: new Date().toISOString(),
          percentage: 85,
          batchAvg: 72,
        },
      ],
      subjects: [
        {
          subjectId: "s1",
          subjectCode: "CS301",
          subjectName: "Algorithms",
          averagePercentage: 85,
          examsTaken: 3,
        },
      ],
      topics: {
        strengths: [
          {
            topic: "Dynamic Programming",
            accuracy: 90,
            totalQuestions: 10,
            correctQuestions: 9,
            qualified: true,
          },
        ],
        weaknesses: [
          {
            topic: "Graph Traversal",
            accuracy: 40,
            totalQuestions: 5,
            correctQuestions: 2,
            qualified: true,
          },
        ],
        insufficientData: [],
      },
    });

    renderWithRouter(<StudentAnalyticsPage />);

    expect(await screen.findByText("Comprehensive Learning Analytics")).toBeInTheDocument();
    expect(screen.getByText("82.5%")).toBeInTheDocument();
    expect(screen.getByText("+11%")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(screen.getByText("Dynamic Programming")).toBeInTheDocument();
    expect(screen.getByText("Graph Traversal")).toBeInTheDocument();
  });

  it("2. StudentDashboard displays live performance summary and links to full analytics", async () => {
    analyticsApi.getStudentAnalyticsApi.mockResolvedValueOnce({
      overview: {
        examsTaken: 4,
        averagePercentage: 78.5,
        bestScore: 92,
        latestScore: 84,
      },
      improvement: {
        available: false,
        delta: 0,
        direction: "neutral",
      },
      trend: [
        {
          examId: "e1",
          examTitle: "Database Systems 101",
          date: new Date().toISOString(),
          percentage: 84,
          batchAvg: 70,
        },
      ],
    });

    renderWithRouter(<StudentDashboard />);

    expect(await screen.findByText("Welcome back, Alex User")).toBeInTheDocument();
    expect(await screen.findByText("78.5%")).toBeInTheDocument();
    expect(screen.getByText("92%")).toBeInTheDocument();
    expect(screen.getByText("Assessment Trajectory")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /view full analytics report/i })).toHaveAttribute(
      "href",
      "/student/analytics"
    );
  });

  it("3. TeacherDashboard renders faculty overview KPIs, batch chart, and at-risk students", async () => {
    mockUserRole = "teacher";

    analyticsApi.getTeacherOverviewApi.mockResolvedValueOnce({
      activeExams: 2,
      totalExams: 5,
      totalSubmissions: 45,
      avgPassRate: 86.7,
      batchComparison: [
        { batchId: "b1", batchName: "CSE-A", averagePercentage: 82.5, attemptCount: 25 },
        { batchId: "b2", batchName: "CSE-B", averagePercentage: 74.0, attemptCount: 20 },
      ],
      recentExams: [
        {
          _id: "ex-101",
          title: "Operating Systems Final",
          subjectCode: "CS401",
          subjectName: "OS",
          status: "published",
          attemptCount: 22,
          averageScore: 78.5,
          passRate: 85,
        },
      ],
      atRisk: [
        {
          studentId: "stu-99",
          studentName: "Bob Vulnerable",
          email: "bob@example.com",
          rollNumber: "CS-2028-099",
          recentAverage: 35.0,
          passThreshold: 40,
          recentExamsCount: 2,
        },
      ],
    });

    renderWithRouter(<TeacherDashboard />);

    expect(await screen.findByText("Teacher Faculty Portal")).toBeInTheDocument();
    expect(await screen.findByText("86.7%")).toBeInTheDocument();
    expect(screen.getByText("Bob Vulnerable")).toBeInTheDocument();
    expect(screen.getByText("35%")).toBeInTheDocument();
    expect(screen.getByText("Operating Systems Final")).toBeInTheDocument();
  });

  it("4. TeacherStudentAnalyticsPage loads candidate profile and allows drilldown", async () => {
    mockUserRole = "teacher";

    analyticsApi.getStudentAnalyticsApi.mockResolvedValueOnce({
      overview: {
        examsTaken: 5,
        averagePercentage: 38.0,
        bestScore: 50,
        latestScore: 32,
      },
      improvement: {
        available: false,
        delta: 0,
        direction: "neutral",
      },
      timeEfficiency: {
        averageTimeTakenSeconds: 1200,
        averageDurationSeconds: 3600,
        efficiencyPercentage: 33,
      },
      trend: [],
      subjects: [],
      topics: {
        strengths: [],
        weaknesses: [
          {
            topic: "Binary Trees",
            accuracy: 25,
            totalQuestions: 8,
            correctQuestions: 2,
            qualified: true,
          },
        ],
        insufficientData: [],
      },
    });

    renderWithRouter(
      <Routes>
        <Route path="/teacher/students/:id" element={<TeacherStudentAnalyticsPage />} />
      </Routes>,
      { route: "/teacher/students/stu-99" }
    );

    expect(await screen.findByText("Student Assessment Diagnostic")).toBeInTheDocument();
    expect(screen.getByText("38%")).toBeInTheDocument();
    expect(screen.getByText("Binary Trees")).toBeInTheDocument();
  });

  it("5. ExamDetailPage renders Analytics tab with score distribution, pass rate donut, and question stats", async () => {
    mockUserRole = "teacher";

    examApi.getExamApi.mockResolvedValueOnce({
      _id: "exam-77",
      title: "Data Structures Midterm",
      description: "Midterm test for trees and graphs",
      status: "published",
      phase: "ended",
      totalMarks: 50,
      durationMinutes: 60,
      passPercentage: 40,
      attemptCount: 15,
      questions: [{ _id: "q1", text: "What is an AVL Tree?", difficulty: "medium" }],
      batchIds: [{ _id: "b1", name: "Batch A" }],
      reviewPolicy: "immediate_with_answers",
      shuffleQuestions: false,
      shuffleOptions: false,
      negativeMarking: { enabled: false, penaltyFraction: 0 },
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
    });

    analyticsApi.getExamAnalyticsApi.mockResolvedValueOnce({
      examId: "exam-77",
      examTitle: "Data Structures Midterm",
      participation: {
        eligibleCount: 20,
        attemptedCount: 15,
        submittedCount: 15,
        participationRate: 75,
      },
      stats: {
        average: 72.4,
        median: 74,
        standardDeviation: 12.1,
        highest: 96,
        lowest: 42,
      },
      passRate: {
        passedCount: 14,
        failedCount: 1,
        passPercentage: 93.3,
      },
      distribution: [
        { range: "0-10", count: 0 },
        { range: "40-50", count: 1 },
        { range: "70-80", count: 10 },
        { range: "90-100", count: 4 },
      ],
      avgTime: {
        averageTimeTakenSeconds: 2400,
        durationSeconds: 3600,
      },
      flagged: {
        count: 1,
        threshold: 3,
        attempts: [
          {
            attemptId: "att-suspicious",
            student: { name: "Charlie Blur", rollNumber: "CS-007" },
            tabSwitchCount: 5,
          },
        ],
      },
    });

    analyticsApi.getExamQuestionsAnalyticsApi.mockResolvedValueOnce([
      {
        questionId: "q1",
        text: "What is an AVL Tree?",
        topic: "Self-Balancing Trees",
        type: "single",
        taggedDifficulty: "medium",
        observedDifficulty: "easy",
        difficultyMismatch: true,
        correctPct: 86.7,
        unansweredPct: 0,
        attemptedCount: 15,
        correctCount: 13,
        wrongCount: 2,
        unansweredCount: 0,
        optionCounts: { A: 13, B: 2, C: 0, D: 0 },
        discriminationIndex: 0.25,
      },
    ]);

    renderWithRouter(
      <Routes>
        <Route path="/teacher/exams/:id" element={<ExamDetailPage />} />
      </Routes>,
      { route: "/teacher/exams/exam-77" }
    );

    // Initial Overview tab
    expect(await screen.findByText("Data Structures Midterm")).toBeInTheDocument();

    // Click Analytics tab
    const analyticsTabBtn = screen.getByRole("button", { name: /analytics/i });
    fireEvent.click(analyticsTabBtn);

    // Analytics tab content renders
    expect(await screen.findByText("Participation Rate")).toBeInTheDocument();
    expect(screen.getByText("75%")).toBeInTheDocument();
    expect(screen.getByText("72.4%")).toBeInTheDocument();
    expect(screen.getAllByText("93.3%").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Exam Integrity: 1 Candidate Flagged/i)).toBeInTheDocument();
    expect(screen.getByText("Charlie Blur")).toBeInTheDocument();
    expect(screen.getAllByText("What is an AVL Tree?").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Mismatch")).toBeInTheDocument();
  });

  it("6. AdminDashboard renders platform metrics, activity trend, and subject averages", async () => {
    mockUserRole = "admin";

    analyticsApi.getAdminOverviewApi.mockResolvedValueOnce({
      usersByRole: { admin: 2, teacher: 5, student: 120 },
      examsByStatus: { draft: 3, published: 8, archived: 2 },
      attemptsPerDay: [
        { date: "2026-10-01", count: 12 },
        { date: "2026-10-02", count: 24 },
      ],
      avgBySubject: [
        {
          subjectId: "sub-1",
          subjectCode: "MATH201",
          subjectName: "Linear Algebra",
          averagePercentage: 76.5,
          attemptsCount: 36,
        },
      ],
    });

    renderWithRouter(<AdminDashboard />);

    expect(await screen.findByText("Platform Administration")).toBeInTheDocument();
    expect(await screen.findByText("127")).toBeInTheDocument(); // total users: 120+5+2
    expect(screen.getByText("13")).toBeInTheDocument(); // total exams: 8+3+2
    expect(screen.getAllByText("36").length).toBeGreaterThanOrEqual(1); // 14-day attempts: 12+24
    expect(screen.getByText("Course Performance Benchmarks")).toBeInTheDocument();
  });

  it("7. Student analytics exposes a retryable API error instead of zero metrics", async () => {
    analyticsApi.getStudentAnalyticsApi.mockRejectedValueOnce(
      new Error("Analytics service unavailable"),
    );

    renderWithRouter(<StudentAnalyticsPage />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Analytics service unavailable",
    );
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
    expect(screen.queryByText("Comprehensive Learning Analytics")).not.toBeInTheDocument();
  });

  it("8. Teacher dashboard exposes a retryable API error", async () => {
    mockUserRole = "teacher";
    analyticsApi.getTeacherOverviewApi.mockRejectedValueOnce(
      new Error("Faculty analytics unavailable"),
    );

    renderWithRouter(<TeacherDashboard />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Faculty analytics unavailable",
    );
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });

  it("9. Admin dashboard exposes a retryable API error", async () => {
    mockUserRole = "admin";
    analyticsApi.getAdminOverviewApi.mockRejectedValueOnce(
      new Error("Platform analytics unavailable"),
    );

    renderWithRouter(<AdminDashboard />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Platform analytics unavailable",
    );
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });

  it("10. Zero-valued chart and item-analysis series render honest empty states", () => {
    renderWithRouter(
      <>
        <ScoreHistogram data={[{ range: "0-10", count: 0 }]} />
        <DailyActivityChart data={[{ date: "2026-10-06", count: 0 }]} />
        <QuestionStatsTable
          questions={[
            {
              questionId: "q-empty",
              text: "Question with no submissions",
              attemptedCount: 0,
              correctPct: 0,
            },
          ]}
        />
      </>,
    );

    expect(screen.getByText("No Distribution Data")).toBeInTheDocument();
    expect(screen.getByText("No Activity Recorded")).toBeInTheDocument();
    expect(screen.getByText(/No question statistics available yet/i)).toBeInTheDocument();
  });

  it("11. Analytics pages keep charts behind an explicit loading state", async () => {
    analyticsApi.getStudentAnalyticsApi.mockReturnValueOnce(new Promise(() => {}));

    renderWithRouter(<StudentAnalyticsPage />);

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Loading learning analytics",
    );
    expect(screen.queryByText("Score Trajectory vs Cohort Batch")).not.toBeInTheDocument();
  });
});
