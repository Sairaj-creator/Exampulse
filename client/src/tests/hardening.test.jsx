import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ErrorBoundary } from "../components/common/ErrorBoundary";
import { ResultPage } from "../pages/student/ResultPage";
import { ExamRoom } from "../features/attempt/ExamRoom";
import * as resultApi from "../features/results/api";

vi.mock("../hooks/useAuth", () => ({
  useAuth: () => ({
    user: {
      _id: "student-1",
      name: "Alice Hardening",
      email: "alice@example.com",
      role: "student",
      batchId: { _id: "batch-1", name: "CSE-A" },
    },
    logout: vi.fn(),
  }),
}));

vi.mock("../features/results/api", () => ({
  getAttemptResultApi: vi.fn(),
}));

// Component that throws to test ErrorBoundary
function CrashingComponent({ shouldThrow }) {
  if (shouldThrow) {
    throw new Error("Simulated critical rendering fault");
  }
  return <div>Component rendered safely</div>;
}

describe("Phase 10: Polish and Hardening Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("1. ErrorBoundary catches component throw and presents recovery options", () => {
    // Suppress React's error log in console during intentional test throw
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <CrashingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("Application Exception")).toBeInTheDocument();
    expect(
      screen.getByText(/Simulated critical rendering fault/i)
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reload page/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /home page/i })).toHaveAttribute("href", "/");

    consoleSpy.mockRestore();
  });

  it("2. ErrorBoundary renders child normally when no error occurs", () => {
    render(
      <ErrorBoundary>
        <CrashingComponent shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText("Component rendered safely")).toBeInTheDocument();
    expect(screen.queryByText("Something went wrong")).not.toBeInTheDocument();
  });

  it("3. ResultPage provides a print report button with window.print binding", async () => {
    const printSpy = vi.spyOn(window, "print").mockImplementation(() => {});

    resultApi.getAttemptResultApi.mockResolvedValueOnce({
      examId: "exam-1",
      examTitle: "Final Algorithms Exam",
      submittedAt: new Date().toISOString(),
      submitReason: "manual",
      subject: { name: "Computer Science" },
      result: {
        score: 45,
        totalMarks: 50,
        percentage: 90,
        passed: true,
        evaluations: [],
      },
    });

    render(
      <MemoryRouter initialEntries={["/student/attempts/att-1/result"]}>
        <ResultPage />
      </MemoryRouter>
    );

    const printBtn = await screen.findByRole("button", { name: /print report/i });
    expect(printBtn).toBeInTheDocument();

    fireEvent.click(printBtn);
    expect(printSpy).toHaveBeenCalledTimes(1);

    printSpy.mockRestore();
  });

  it("4. ExamRoom exposes a mobile palette drawer and closes it after navigation", () => {
    render(
      <MemoryRouter>
        <ExamRoom
          attemptData={{
            attemptId: "attempt-hardening",
            examTitle: "Responsive Exam",
            serverNow: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 3600000).toISOString(),
            remainingSeconds: 3600,
            answers: [],
            questions: [
              {
                _id: "mobile-q1",
                type: "single",
                text: "Which option is correct?",
                options: [{ key: "A", text: "Option A" }],
                topic: "Responsive UI",
                difficulty: "easy",
                marks: 1,
              },
              {
                _id: "mobile-q2",
                type: "single",
                text: "Which option is next?",
                options: [{ key: "A", text: "Option A" }],
                topic: "Responsive UI",
                difficulty: "easy",
                marks: 1,
              },
            ],
          }}
        />
      </MemoryRouter>,
    );

    const paletteToggle = screen.getByRole("button", {
      name: /toggle question palette/i,
    });
    const palette = screen.getByRole("complementary");

    expect(palette.className).toContain("hidden lg:block");
    fireEvent.click(paletteToggle);
    expect(palette.className).toContain("block");

    fireEvent.click(screen.getByRole("button", { name: "Question 2" }));
    expect(palette.className).toContain("hidden lg:block");
  });
});
