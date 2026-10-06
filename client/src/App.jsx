import React from "react";
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./features/auth/ProtectedRoute";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { StudentDashboard } from "./pages/student/StudentDashboard";
import { StudentExamsPage } from "./pages/student/StudentExamsPage";
import { ExamInstructionsPage } from "./pages/student/ExamInstructionsPage";
import { ExamRoomPage } from "./pages/student/ExamRoomPage";
import { ResultPage } from "./pages/student/ResultPage";
import { LeaderboardPage } from "./pages/student/LeaderboardPage";
import { StudentAnalyticsPage } from "./pages/student/StudentAnalyticsPage";
import { TeacherDashboard } from "./pages/teacher/TeacherDashboard";
import { QuestionBankPage } from "./pages/teacher/QuestionBankPage";
import { ExamsPage } from "./pages/teacher/ExamsPage";
import { ExamBuilderPage } from "./pages/teacher/ExamBuilderPage";
import { ExamDetailPage } from "./pages/teacher/ExamDetailPage";
import { TeacherStudentAnalyticsPage } from "./pages/teacher/TeacherStudentAnalyticsPage";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { UsersPage } from "./pages/admin/UsersPage";
import { BatchesPage } from "./pages/admin/BatchesPage";
import { SubjectsPage } from "./pages/admin/SubjectsPage";
import { ProfilePage } from "./pages/ProfilePage";
import { ForbiddenPage } from "./pages/ForbiddenPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { ErrorBoundary } from "./components/common/ErrorBoundary";

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forbidden" element={<ForbiddenPage />} />

        {/* Student Routes */}
        <Route
          path="/student"
          element={
            <ProtectedRoute roles={["student"]}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/exams"
          element={
            <ProtectedRoute roles={["student"]}>
              <StudentExamsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/exams/:id"
          element={
            <ProtectedRoute roles={["student"]}>
              <ExamInstructionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/attempts/:id/take"
          element={
            <ProtectedRoute roles={["student"]}>
              <ExamRoomPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/attempts/:id/result"
          element={
            <ProtectedRoute roles={["student"]}>
              <ResultPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/exams/:id/leaderboard"
          element={
            <ProtectedRoute roles={["student"]}>
              <LeaderboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/analytics"
          element={
            <ProtectedRoute roles={["student"]}>
              <StudentAnalyticsPage />
            </ProtectedRoute>
          }
        />

        {/* Teacher Routes */}
        <Route
          path="/teacher"
          element={
            <ProtectedRoute roles={["teacher"]}>
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/questions"
          element={
            <ProtectedRoute roles={["teacher", "admin"]}>
              <QuestionBankPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/exams"
          element={
            <ProtectedRoute roles={["teacher", "admin"]}>
              <ExamsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/exams/new"
          element={
            <ProtectedRoute roles={["teacher", "admin"]}>
              <ExamBuilderPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/exams/:id/edit"
          element={
            <ProtectedRoute roles={["teacher", "admin"]}>
              <ExamBuilderPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/exams/:id"
          element={
            <ProtectedRoute roles={["teacher", "admin"]}>
              <ExamDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/attempts/:id/result"
          element={
            <ProtectedRoute roles={["teacher", "admin"]}>
              <ResultPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/students/:id"
          element={
            <ProtectedRoute roles={["teacher", "admin"]}>
              <TeacherStudentAnalyticsPage />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute roles={["admin"]}>
              <UsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/batches"
          element={
            <ProtectedRoute roles={["admin"]}>
              <BatchesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/subjects"
          element={
            <ProtectedRoute roles={["admin"]}>
              <SubjectsPage />
            </ProtectedRoute>
          }
        />

        {/* Authenticated User Routes */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        {/* 404 Catch-All */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
  </ErrorBoundary>
);
}
