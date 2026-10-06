# Implementation progress

## Phase 0 — Foundation and tooling

Objective: a running MERN skeleton with shared tooling and an honest database health check.

- [x] npm workspaces and combined development command.
- [x] Environment validation and ignored local config with generated secret.
- [x] Express, Mongoose connection, response envelope, error middleware and health endpoint.
- [x] React/Vite, router shell, Axios, QueryClient, Tailwind and Radix/shadcn-style button.
- [x] ESLint, Prettier and Vitest in both workspaces.
- [x] Automated verification: 4 backend tests and 1 frontend test passed; lint passed; production build passed.
- [x] Live health endpoint returned HTTP 200 and `db: connected` against the local MongoDB Windows service.

Verified on 2026-10-06. Development app: http://127.0.0.1:5173. API: http://127.0.0.1:5000/api/health. The local environment file is ignored by Git. No role workflows, seed accounts or exam features exist yet.

## Dependency follow-up

The installed baseline reports 2 moderate production findings in React Router 6. The full development audit reports 12 findings (5 moderate, 5 high, 2 critical) across React Router 6, Tailwind 3, and Vitest 3. Available fixes require major-version migrations. Resolve them during hardening before public deployment.

## Phase 1 — Data models and seed skeleton

Objective: lock the schema before features with all six Mongoose models, validation constraints, compound indexes, test coverage, and an idempotent seed script.

- [x] All six Mongoose models created:
  - `User` (`users`): RBAC role enum, email validation, hidden passwordHash, compound `{ role: 1, batchId: 1 }` index.
  - `Batch` (`batches`): unique name index and academic year bounds.
  - `Subject` (`subjects`): unique code (uppercased) and unique name indexes.
  - `Question` (`questions`): single, multiple, and truefalse schemas, option limits (2-6), correctKey consistency validation, difficulty enum, compound filter index, text search index.
  - `Exam` (`exams`): embedded question snapshot schema, phase virtual (`upcoming` | `live` | `ended`), totalMarks pre-save computation, teacher/batch indexes.
  - `Attempt` (`attempts`): unique `{ examId: 1, studentId: 1 }` index for idempotent exam starts, denormalized subject/teacher/batch IDs for zero-lookup analytics, embedded answers and evaluation results.
- [x] Password utility with bcryptjs (`hashPassword`, `comparePassword`).
- [x] Idempotent seed script (`server/src/seed/seed.js` and `npm run seed`) creating Admin, Batches, Subjects, Teachers, and Demo Student.
- [x] 16 model unit tests validating schema constraints, options, question types, virtuals, and defaults (total 20 tests passed).
- [x] Clean ESLint verification.

Verified on 2026-10-06.

## Phase 2 — Authentication and RBAC

Objective: secure identity before any feature with JWT in httpOnly cookie, role-based access control, registration, session restore, profile & password management, and role dashboards.

- [x] Backend authentication API and middleware (§15.1, §16):
  - `POST /api/auth/register`: student registration with batch verification; role forced to student; sets httpOnly `ep_session` cookie.
  - `POST /api/auth/login`: rate-limited (10 attempts / 15 min), generic error messages, deactivated account check, updates `lastLoginAt`.
  - `POST /api/auth/logout`: clears httpOnly cookie.
  - `GET /api/auth/me`: session restoration with populated batch information.
  - `PATCH /api/auth/me`: user profile name update.
  - `PATCH /api/auth/me/password`: secure password rotation requiring verified current password.
  - `authenticate` middleware: verifies JWT cookie, queries active user from MongoDB, populates session.
  - `requireRole(...roles)` middleware: role authorization guard.
  - `validate` middleware: strict Zod schema parsing.
  - Rate limiting with `express-rate-limit` (login limiter & general API limiter).
  - Standard response envelope and error mapping (§11.2).
- [x] Frontend authentication experience:
  - `AuthContext` and `useAuth` hook for user state, session restoration, login, logout, register, profile, and password rotation.
  - `ProtectedRoute` guard redirecting unauthenticated visitors to `/login` and routing unauthorized roles to their respective dashboards.
  - `LoginPage` with input validation, error alerts, and one-click demo credentials (`admin@exampulse.dev`, `teacher1@exampulse.dev`, `student@exampulse.dev`).
  - `RegisterPage` with batch selection dropdown from `GET /api/batches`.
  - `DashboardLayout` with role-aware collapsible sidebar, brand topbar, role badges, and mobile drawer.
  - Role-specific dashboard views (`/student`, `/teacher`, `/admin`).
  - `ProfilePage` for identity management, display name modification, and password updates.
  - `ForbiddenPage` (403) and `NotFoundPage` (404).
- [x] Automated test verification:
  - 10 integration tests in `server/tests/auth.test.js` covering register, duplicate email 409, invalid batch 400, login success, incorrect password, inactive account rejection, cookie flags, `/me` session restore, and logout.
  - Frontend test suite verifying health check and login form rendering.
  - Phase 2 verification was rerun after the Phase 3 review; invalid credentials now correctly return HTTP 401.
  - ESLint passed with 0 errors and 0 warnings across all workspaces.
  - Production build passed (`vite build` completed in 12.86s).

Verified on 2026-10-06.

## Phase 3 — Admin master data

Objective: provide the people and academic catalogues required by question banks and exams.

- [x] Mounted and verified `/api/users`, `/api/batches`, and `/api/subjects` routes.
- [x] User directory with escaped search, filters, pagination, create/edit, active-state control, and password reset.
- [x] Student updates enforce a valid batch; changing a user away from student clears batch and roll-number fields.
- [x] Self-deactivation and last-active-admin protections.
- [x] Batch and subject CRUD with uniqueness checks and guarded deletion for referenced records.
- [x] Strict body/query/parameter validation, including ObjectId validation before database access.
- [x] Thin controllers with batch, subject, user, and authentication business rules in services.
- [x] Responsive admin pages with desktop tables, mobile cards, dialogs, confirmations, pagination, and toast feedback.
- [x] Fixed global landing-page CSS selectors that previously overrode authenticated layouts.
- [x] Verified all MongoDB collection indexes against the live local database.
- [x] Live flow verified: health → admin login → admin dashboard → populated user directory.
- [x] Automated verification: 36 server tests and 3 client tests passed; ESLint and the production build passed.

Verified on 2026-10-06.

## Phase 4 — Question bank

Objective: allow teachers to maintain an organized, searchable question repository across subjects, topics, and difficulties with single, multiple, and true/false types, strict answer validation, and exam-referential archiving.

- [x] Mounted and verified `/api/questions` routes (§15.3):
  - `GET /api/questions`: paginated list with search, topic, subject, type, difficulty, and archive filters; teachers only see their own questions, admins see all.
  - `POST /api/questions`: creates question with strict cross-field validation for type-specific rules (single: 1 key, multiple: ≥1 keys, true/false: 2 options and 1 key), options in bounds (2-6), and unique option keys.
  - `GET /api/questions/topics`: distinct topics endpoint filtered by teacher ownership and subject.
  - `GET /api/questions/:id`: question detail with strict teacher ownership verification.
  - `PATCH /api/questions/:id`: question update with schema revalidation; exam snapshots remain unaffected.
  - `DELETE /api/questions/:id`: smart deletion logic — hard deletes if unreferenced; archives (`isArchived: true`) if snapshotted in any exam.
- [x] Question bank frontend interface:
  - `OptionEditor`: dynamic options manager handling single choice (radio), multiple choice (checkboxes), and true/false (fixed A=True, B=False).
  - `QuestionFilters`: real-time filter bar with search, subject select, topic select, type select, difficulty select, archive toggle, and reset action.
  - `QuestionFormDialog`: modal with accessible inputs, subject selection, topic autocomplete datalist, type selector, difficulty chips, marks, and explanation.
  - `QuestionDetailDialog`: inspection dialog showing formatted stem, options, correct answer indicator, and solution explanation.
  - `QuestionTable`: responsive view supporting desktop tabular display and mobile card layout with action triggers (View, Edit, Delete/Archive).
  - `QuestionBankPage`: full teacher repository page with statistics header, pagination, and feedback alerts.
  - Wired into `App.jsx` router at `/teacher/questions` with teacher and admin role guards.
- [x] Automated test verification:
  - 16 server integration tests in `server/tests/questions.test.js` covering RBAC (student forbidden 403), question creation across all 3 types, invalid correct keys validation, topic distinct queries, teacher ownership isolation, update rules, and hard-delete vs archive behavior.
  - Client component test in `client/src/tests/questions.test.jsx` verifying table rendering, create modal opening, and type switching to true/false.
  - All 56 tests passed (52 server, 4 client).
  - ESLint verified with 0 errors and 0 warnings.
  - Client production build verified (`vite build` in 10.62s).

Verified on 2026-10-06.

## Phase 5 — Exam builder and lifecycle

Objective: let teachers turn question-bank content into scheduled, batch-assigned exams and control the full draft-to-published lifecycle.

- [x] Mounted and verified `/api/exams` routes (§15.4):
  - Exam list/detail/create/update/delete with teacher ownership, admin visibility, status/subject/phase filters, pagination, computed phase, and attempt counts.
  - Embedded question snapshots with duplicate skipping, subject/ownership checks, per-exam marks, removal, and strict permutation-based ordering.
  - Publish validation for questions, positive marks, assigned batches, future schedule, window order, and duration.
  - Publish, zero-attempt unpublish, archive, and duplicate-as-draft lifecycle actions.
  - Draft, published-without-attempts, and published-with-attempts edit matrix; end times can only be extended after attempts exist.
  - Subject changes are blocked while a draft contains question snapshots.
- [x] Teacher exam interface:
  - Filterable exam list with status/phase badges, totals, attempts, and lifecycle actions.
  - Four-step builder: Details → Questions → Rules & schedule → Review.
  - Subject-specific question picker, per-question marks, paper ordering, batch assignment, time window, pass percentage, negative marking, shuffle controls, and review policy.
  - Draft editing synchronizes added/removed questions, marks, and order with the embedded exam snapshot.
  - Exam detail view shows schedule, assignments, rules, instructions, attempt count, and the immutable paper snapshot.
- [x] Automated verification:
  - 7 Phase 5 server integration tests cover RBAC and ownership, schedule and publish validation, snapshot independence, question operations and total recomputation, edit permissions with and without attempts, unpublish/delete restrictions, and duplication.
  - 2 Phase 5 frontend tests cover the lifecycle list and all four builder steps.
  - Full suite: 66 tests passed (60 server, 6 client); ESLint and the production build passed.
- [x] Live browser verification: teacher demo login → Details → question selection → batch/rules/schedule → Review → Publish; the resulting Upcoming exam showed its copied question, totals, assignment, and configured rules.

Verified on 2026-10-06.

## Phase 6 — Exam-taking engine

Objective: give students a secure, resumable, server-timed exam room that persists answers and grades submissions reliably.

- [x] Student discovery and instructions API:
  - `GET /api/student/exams` lists only published exams assigned to the student's batch, with strict phase filtering, computed phase, attempt state, and stored result summary.
  - `GET /api/student/exams/:id` returns rules, schedule, effective duration, and attempt state without question content or answer keys.
  - Expired in-progress attempts are finalized lazily before student lists are returned.
- [x] Attempt engine API:
  - Idempotent `POST /api/exams/:id/attempts` with live-window and batch checks, unique attempt enforcement, double-start race recovery, per-attempt question/option presentation, and `expiresAt = min(start + duration, exam end)`.
  - Student-owned `GET /api/attempts/:id` returns presentation-ordered questions without `correctKeys` or explanations, saved answers, and server timing data.
  - Atomic per-question autosave validates option keys and question types, preserves review flags, prevents concurrent answer-array overwrites, and provides a five-second expiry grace window.
  - Tab-hidden event recording, manual submission, timeout submission, idempotent finalization, lazy expiry, and a one-minute background sweeper.
  - Teacher/admin submissions feed plus a teacher-only live-window attempt reset endpoint, ready for the Phase 7 submissions UI.
- [x] Pure grading service:
  - Single, multiple exact-match, and true/false grading; unanswered handling; configurable negative marking including an explicit zero penalty; score floor at zero; pass boundary; bounded time taken; and embedded per-question evaluations.
- [x] Student interface:
  - Assigned Exams tabs for Live, Upcoming, and Completed states.
  - Instructions screen with effective duration, marking rules, audit notice, agreement gate, and start/resume behavior.
  - Focused exam room with a server-synchronized monotonic timer, question navigation, answer palette, mark-for-review, clear answer, tab-switch notice, and completion summary.
  - Debounced autosave with bounded exponential retries, visible save state, server-time resynchronization, queue flush before manual submit, and automatic submission at zero.
- [x] Verification:
  - 12 attempt integration tests and 7 grading tests cover role/ownership boundaries, assignment and time windows, concurrent starts, sanitization, answer validation, grace timing, resume, idempotent submit, lazy finalization, and the sweeper.
  - 7 Phase 6 frontend tests cover discovery, instructions, exam-room interaction, monotonic countdown, autosave retry, pre-submit queue flushing, and auto-submit.
  - Live API flow: assigned exam discovery → sanitized instructions → start/resume → sanitized paper → two autosaves → tab event → submit → 5/5 result → restart rejection → teacher submissions visibility.
  - Full suite: 92 tests passed (79 server, 13 client); ESLint passed; production build passed.

Verified on 2026-10-06.

## Phase 7 — Results, review, and leaderboard

Objective: provide students with transparent, policy-governed result review and fair competition rankings while giving teachers candidate audit visibility and export capabilities.

- [x] Attempt Result & Review Policy API:
  - `GET /api/attempts/:id/result`: enforces exam review policies (`immediate`, `after_end`, `never`). A locked policy returns the score summary without any question-level evaluations; teachers and admins receive the full review.
  - Full reviews reconstruct the student's stored question and option presentation order from the immutable exam snapshot.
  - Expired in-progress attempts are finalized lazily when their result is requested.
  - `GET /api/attempts/mine`: lists the authenticated student's submitted attempt history with exam details, score, total marks, percentage, pass status, and timing.
  - Returns ranking and percentile on the individual attempt result once the exam window has concluded.
- [x] Competition Ranking & Leaderboard API:
  - `GET /api/exams/:id/leaderboard`: implements standard competition ranking (1, 2, 2, 4 tied ranking) sorted by score descending, then time taken ascending.
  - Calculates percentile ranking via `(lowerScoreCount / totalParticipants) * 100`.
  - Enforces student timing restriction (§15.5): students requesting standings before `exam.endTime` receive `403 EXAM_NOT_ENDED`. Teachers and admins can view real-time standings at any time.
  - Returns formatted `topEntries` (with podium rank, student details, score, percentage, time, percentile) plus personalized `myEntry` for the calling student.
- [x] Teacher Candidate Submissions & CSV Export:
  - `GET /api/exams/:id/attempts`: populated with student names, emails, roll numbers, status, scores, time taken, and academic integrity audit metrics (tab switch counts).
  - `DELETE /api/exams/:id/attempts/:attemptId`: teacher-only reset capability allowing students to retake during live exam windows, with a server audit log entry.
  - `GET /api/exams/:id/export`: UTF-8 BOM CSV download with Excel formula-injection protection, escaped values, ranks, scores, percentages, and timestamps.
- [x] Student Result & Leaderboard Interface:
  - `/student/attempts/:id/result`: visual performance dashboard featuring an SVG circular progress `ScoreRing`, summary metric cards (correct, incorrect, unanswered, duration, rank/percentile badge), topic performance cards, and filterable question-by-question `ReviewList` (all, correct, incorrect, unanswered) with choice vs correct answer badges, explanations, and review restriction policy notices.
  - `/student/exams/:id/leaderboard`: podium medals (#1, #2, #3), current student row highlight with "You" pill, responsive table, and a dedicated locked banner when window has not closed.
  - Direct navigation integrated across student exams list, exam completion screens, and exam room finish modal.
- [x] Teacher Exam Detail Submissions Tab:
  - Tabs added to `ExamDetailPage.jsx` for "Overview & Paper" and "Submissions".
  - Submissions table showing candidate details, scores, completion status, time taken, submission dates, and highlighted academic integrity warning badges for candidates with >= 3 tab switches.
  - Full attempt review link, live attempt reset modal, load-error recovery, and instant CSV export button.
- [x] Verification:
  - 9 server integration tests in `results.test.js`: immediate review, score-only policy gating and unlock, permanent student hiding for never review, lazy result finalization, ownership/RBAC, student history, competition ties (1, 1, 3), and Excel-safe CSV export.
  - 5 client component tests in `results.test.jsx`: result and topic rendering, restriction banner display, leaderboard standings and locked banner handling, and teacher submissions inspection with review/reset/export actions.
  - Live API flow: in-progress submission visibility → teacher reset → student retake → 5/5 submit → student and teacher review → history → live leaderboard lock → ended rank → CSV export.
  - Full suite: 106 tests passed (88 server, 18 client); ESLint clean; production build successful.

Verified on 2026-10-06.

## Phase 8 — Analytics backend

Objective: compute all performance insights with MongoDB aggregation framework pipelines and statistical methods, producing verified metrics before building charts.

- [x] Student Analytics Pipeline & API (`GET /api/analytics/students/:id`):
  - Overview cards: count of submitted attempts, mean percentage, best score, latest score.
  - Performance trend: chronological attempts with individual percentage alongside the student's same-batch exam average.
  - Subject breakdown: grouped by `subjectId` with exams taken count and average percentage.
  - Topic accuracy: unwinds `result.evaluations`, applies the five-question qualification minimum, separates strengths ($\ge 75\%$) and weaknesses ($< 50\%$), and returns low-sample topics separately.
  - Improvement indicator: compares the latest three exams with the previous three and reports an unavailable neutral state until six attempts exist.
  - Time efficiency: calculates average time taken versus effective exam duration.
  - Role access: students restricted to their own ID or `"me"` alias; teachers permitted only after the student attempted one of their exams; admins permitted.
  - Safe zero/empty state for students with zero attempts.
- [x] Exam Analytics Pipeline & API (`GET /api/analytics/exams/:id`):
  - Participation metrics: eligible student count in assigned batches, distinct attempted and submitted counts, and participation rate.
  - Score statistics: mean, median (exact percentile sort), highest, lowest, and standard deviation.
  - Pass rate: passed count, failed count, pass percentage.
  - Distribution histogram: 10 fixed score buckets (`0-10`, `10-20`, … `90-100`).
  - Average completion time vs duration plus four relative-duration buckets.
  - Academic integrity flags: identifies candidates with $\ge 3$ tab switches.
  - Enforces teacher creator ownership and triggers lazy finalization of expired attempts before computing metrics.
- [x] Question Analytics Pipeline & API (`GET /api/analytics/exams/:id/questions`):
  - Per-question difficulty index (correct %), unanswered %, and wrong answer rates.
  - Observed difficulty categorization (`easy` $\ge 70\%$, `medium` $40\text{–}70\%$, `hard` $< 40\%$) with mismatch detection against tagged difficulty.
  - Complete option selection frequency distribution across all choices.
  - Item discrimination index computed as top 27% scorers correct rate minus bottom 27% scorers correct rate.
  - Exams without submissions return `observedDifficulty: null` rather than misclassifying every question as hard.
- [x] Subject Analytics Pipeline & API (`GET /api/analytics/subjects/:id`):
  - Performance over time: chronological exam progression with date, title, and average score.
  - Batch comparison: cross-batch performance for the subject.
  - Topic accuracy table: topic-by-topic evaluation volume and accuracy percentage.
  - Optional validated `batchId` query filtering and teacher ownership scoping prevent cross-teacher data mixing.
- [x] Overview Dashboards API:
  - Teacher overview (`GET /api/analytics/teacher/overview`): active live exams, total exams, total submissions, mean per-exam pass rate, recent 5 exams, batch performance comparison, and at-risk detection from the latest two results against their exams' pass thresholds.
  - Admin overview (`GET /api/analytics/admin/overview`): user counts by role, exams by lifecycle status, 14-day chronological daily attempt volume, and average score by subject.
- [x] Database Indexing & Optimization:
  - Added composite indexes to `Attempt` schema: `{ teacherId: 1, status: 1 }` and `{ subjectId: 1, status: 1 }`.
  - Verified index scan utilization (`IXSCAN`) via `.explain("executionStats")`.
- [x] Rich Demonstration Seed:
  - Extended `seed.js` to populate 60 students across three batches, six ended exams across ten weeks, 308 valid historical attempts, deterministic absences and tab-switch flags, and live/upcoming/draft examples.
  - Every historical result is produced through `gradeAttempt()`; assignment checks prevent generated attempts outside an exam's batches.
  - Running the seed twice is a verified no-op.
- [x] Verification:
  - 21 analytics tests cover hand-computed student/exam metrics, exact 3-vs-3 improvement, histogram boundaries, RBAC/ownership, zero-attempt shapes, batch filtering, teacher/admin summaries, and index scans for student, exam, teacher, and subject queries.
  - Live seeded API verification exercised all six analytics endpoints and four role/ownership denial paths. The current seeded run returned 7 student trend points, 37 submitted attempts matching the histogram/pass-fail totals, 5 question rows, 7 subject trend points, 14 admin activity days, and HTTP 403 for every forbidden request; observed local endpoint times were 33–289 ms.
  - Full suite: 127 tests passed (109 server, 18 client); ESLint clean; Vite production build successful.

Verified on 2026-10-06.

## Phase 9 — Analytics dashboards UI

Objective: transform Phase 8 MongoDB aggregation analytics into responsive, rich Recharts visualization dashboards for students, teachers, and platform administrators.

- [x] Client Analytics API Layer:
  - `client/src/features/analytics/api.js`: axios-backed client hooks for `getStudentAnalyticsApi`, `getExamAnalyticsApi`, `getExamQuestionsAnalyticsApi`, `getSubjectAnalyticsApi`, `getTeacherOverviewApi`, and `getAdminOverviewApi`.
- [x] Reusable Chart & Visualization Components:
  - `TrendChart.jsx`: dual-line trajectory comparing candidate exam percentage against cohort batch average across chronological assessments, with tooltips and empty states.
  - `SubjectBarChart.jsx`: curriculum course performance bar chart with color-coded bars, tooltips, and assessment counts.
  - `TopicStrengthList.jsx`: topic-level mastery cards categorizing strengths ($\ge 75\%$) and areas for improvement ($< 50\%$) with accuracy progress bars, question counters, and insufficient-data qualification counters.
  - `ScoreHistogram.jsx`: 10-decile score distribution bar chart (`0-10`, `10-20`, … `90-100`).
  - `PassFailDonut.jsx`: circular clearance rate donut chart with passed/failed counts and centered pass percentage.
  - `QuestionStatsTable.jsx`: comprehensive item analysis table with observed vs tagged difficulty mismatch alerts, distractor option frequencies, discrimination index ($D$), and callout cards for hardest and easiest questions.
  - `DailyActivityChart.jsx`: 14-day chronological submission volume area chart with gradient fills.
  - `AtRiskStudentsList.jsx`: flagged at-risk candidate list (< 40% recent average) with cutoff indicators and direct link to candidate drilldown profiles.
- [x] Student Analytics Interfaces:
  - `/student/analytics` (`StudentAnalyticsPage.jsx`): comprehensive learning analytics dashboard displaying exams taken, overall average, 3-vs-3 trajectory comparison, time efficiency, trend chart, subject bar chart, and topic strengths/weaknesses.
  - `/student` (`StudentDashboard.jsx`): enriched with live student metrics (exams taken, average percentage, peak score, 3-vs-3 trajectory) and an assessment trajectory chart preview linking to the full analytics report.
- [x] Teacher Analytics Interfaces:
  - `/teacher` (`TeacherDashboard.jsx`): enriched with active exams, total submissions, average pass rate, at-risk students counter, batch cohort performance bar chart, recent exams table with pass rates, and the at-risk candidates list.
  - `/teacher/exams/:id` (`ExamDetailPage.jsx`): dedicated "Analytics" tab rendering participation rate, cohort mean/median/stdDev, pass clearance, average time taken, anti-cheat tab-switch integrity warnings, score distribution histogram, pass/fail clearance donut, and full question item analysis table.
  - `/teacher/students/:id` (`TeacherStudentAnalyticsPage.jsx`): faculty drilldown page inspecting individual candidate performance profiles with RBAC restriction error handling.
- [x] Platform Administrator Analytics:
  - `/admin` (`AdminDashboard.jsx`): enriched with live user role split (students, teachers, admins), exam pipeline statuses, 14-day chronological activity chart, and subject performance benchmarks.
- [x] API Contract & State Handling:
  - Student views consume the Phase 8 `{ subjects, topics }` bundle directly; exam KPIs consume `{ average, standardDeviation }`, and administrator subject tooltips use `attemptsCount`.
  - A shared analytics query state provides explicit loading and retryable error views. Charts and item analysis distinguish zero-valued API series from meaningful data, including the fixed 10-bucket histogram and 14-day activity series.
  - Question accuracy is rendered as a difficulty bar and percentage; zero-submission questions remain in an honest empty state.
- [x] Verification:
  - 11 frontend tests in `analytics.test.jsx`: all three role dashboards, student/candidate analytics, exam analytics and item analysis, live API contract field shapes, loading, retryable errors, and zero-value empty states.
  - Phase 8 was reverified end to end before Phase 9: 21/21 targeted backend analytics tests plus live seeded calls to all six analytics endpoints and RBAC boundaries.
  - Full test suite: 138/138 tests passed (109 server, 29 client).
  - ESLint: 0 errors, 0 warnings.
  - Production build: successful Vite build; the existing large-chunk optimization warning is deferred to Phase 10.

Verified on 2026-10-06.

## Phase 10 — Polish and hardening

Objective: apply professional finish across performance, responsive mobile usability, accessibility, error resilience, and production security.

- [x] Bundle Optimization & Chunk Splitting:
  - Configured `build.rollupOptions.output.manualChunks` in `vite.config.js` separating `vendor-react` (163 kB), `vendor-charts` (432 kB), `vendor-query` (93 kB), and `vendor-icons` (31 kB).
  - Clean production build: resolved the large-chunk warning completely (0 chunks exceeding 500 kB threshold).
- [x] Application Error Resilience:
  - Implemented `ErrorBoundary.jsx` with error lifecycle capture (`componentDidCatch`, `getDerivedStateFromError`), friendly recovery diagnostics, "Reload Page" action, and home redirect.
  - Wrapped `App.jsx` root routes with `ErrorBoundary` to prevent unhandled render exceptions from white-screening the application.
- [x] Mobile & Responsive Exam Room Polish:
  - Refactored `ExamRoom.jsx` with fluid heights and a responsive question palette drawer toggle (`lg:hidden`) displaying live progress `(Q X/Y)`.
  - Mobile candidates can switch questions instantly without scrolling past long question texts.
- [x] Printable Examination Report Card:
  - Added `@media print` rules in `globals.css` hiding headers, sidebars, navigation breadcrumbs, and interactive buttons.
  - Integrated "Print Report" button on `ResultPage.jsx` bound to `window.print()` for candidate report-card saving and printing.
- [x] Security & Server Hardening:
  - Verified Helmet HTTP security headers, CORS origin whitelisting in non-production, JSON payload size caps (100kb), HttpOnly cookie authentication, and Express rate limiters (`loginLimiter`, `generalLimiter`).
  - Production error handler sanitizes stack traces and internal error payloads for $5xx$ responses.
- [x] Verification:
  - 4 targeted hardening tests in `hardening.test.jsx`: error boundary catch and fallback rendering, error boundary normal pass-through, student result print button triggering `window.print()`, and mobile exam-room palette open/close navigation.
  - Phase 9 and Phase 10 live smoke checks: student, teacher, admin, profile, and public route shells returned 200; Helmet CSP/nosniff/referrer headers were present; `X-Powered-By` was absent; disallowed origins received no CORS grant; oversized JSON was rejected with HTTP 413; print stylesheet selectors were present.
  - Full test suite: 142/142 tests passed (109 server, 33 client across 8 test suites).
  - ESLint: 0 errors, 0 warnings.
  - Production build: successful warning-free Vite build with React, chart, query, icon, and application chunks all below 500 kB.
  - Lighthouse and axe CLIs are not installed in this workspace, so the blueprint's numeric Lighthouse accessibility score remains unverified; semantic RTL assertions and route smoke checks passed.

Verified on 2026-10-06.

## Remaining phases

11. Deployment.
12. Documentation and demo rehearsal.
