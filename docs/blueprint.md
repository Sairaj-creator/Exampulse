Online Examination & Performance Analytics System: Master Blueprint
Stack: MongoDB · Express · React · Node (MERN), JavaScript (ES modules) Working name: ExamPulse

1. Executive Summary
ExamPulse is a role-based web application where teachers build question banks and schedule timed online exams, students take those exams in a secure, timed, auto-saving exam room, and the system automatically grades, stores results, and turns them into analytics for students, teachers, and administrators.

The project's identity is the combination of the two halves in the title:

Online Examination: a server-authoritative exam engine (timer, autosave, resume, auto-submit, auto-grading).
Performance Analytics: MongoDB aggregation pipelines over graded attempts that answer questions like "Which topics is this student weak in?", "Which question was too hard?", "How did the batch perform?"
Why MongoDB is a natural fit (viva answer): an exam is a nested document (questions with options), an attempt is a nested document (answers and per-question evaluations), and analytics is "group, unwind, average, bucket", which is exactly what the aggregation framework does well. No joins are needed for most reads.

Complexity target: 3 roles, 6 collections, ~50 endpoints, ~25 screens, 1 background job. No microservices, no websockets, no queues.

2. Project Vision
What the finished product does
A teacher creates an exam from their question bank, assigns it to student batches, and publishes it with a time window.
A student sees it in their dashboard, starts it during the window, answers within the time limit, and is graded instantly on submit.
Results, answer review, rank, and percentile appear (according to the teacher's review policy).
Dashboards turn raw results into trends, subject and topic strengths and weaknesses, score distributions, question difficulty, and batch comparisons.
Why it is more than CRUD
The interesting engineering lives in: server-enforced timing, idempotent attempt start/resume, question snapshotting, anti-leak design (correct answers never reach the browser during an attempt), automatic grading with negative marking, lazy plus scheduled auto-submission, and aggregation-based analytics.

3. Scope
In scope
Authentication, role-based access (Admin, Teacher, Student)
Master data: users, batches, subjects
Question bank (MCQ single, MCQ multiple, True/False) with topic and difficulty
Exam builder, scheduling, assignment to batches, publish lifecycle
Exam-taking engine: timer, autosave, navigation palette, mark-for-review, resume, auto-submit
Auto-grading, results, answer review, exam leaderboard
Analytics for student, exam, question, subject, teacher, and admin
Seed script, tests, deployment, documentation
Intentionally out of scope
Excluded	Reason
Camera/mic proctoring, screen recording	Large complexity, privacy issues
Subjective / essay / coding questions	Needs manual grading UI or sandboxes
Real-time sockets, live monitoring	Polling and autosave are sufficient
Email/SMS, password-reset-by-email	Needs a mail service; admin reset instead
Payments, multi-tenant organisations	Not relevant
File/image uploads	Needs storage; allow image URL only (nice-to-have)
AI/ML recommendations	Rule-based insights are enough
Multiple attempts per student	Adds attempt-versioning complexity; teacher can reset an attempt instead
4. Requirements
4.1 Functional requirements (summary)
ID	Requirement
FR-1	Users authenticate with email/password; sessions persist across refresh
FR-2	Students self-register; teachers/admins are created by an admin
FR-3	Admin manages users (create, edit, activate/deactivate, reset password), batches, subjects
FR-4	Teacher manages a question bank (CRUD, filter, search, archive)
FR-5	Teacher builds exams (select questions, set marks, duration, window, rules), assigns batches, publishes
FR-6	Student sees only exams assigned to their batch, grouped as Upcoming / Live / Completed
FR-7	Student can start a live exam once, resume after refresh or disconnect, and the timer never resets
FR-8	Answers autosave; the attempt auto-submits at expiry (even if the browser closes)
FR-9	Submission triggers server-side grading and result storage
FR-10	Student views results, review (per policy), rank and percentile
FR-11	Teacher views submissions, per-exam analytics, and can export CSV
FR-12	All three roles have an analytics dashboard appropriate to them
FR-13	Teacher can reset a student's attempt (allows a retake)
4.2 Non-functional requirements
Area	Requirement
Performance	Typical API response < 300 ms on demo data (≤ 100 students, ≤ 5k attempts); analytics < 1 s
Security	Hashed passwords, httpOnly cookie auth, RBAC on every route, input validation, rate-limited login, correct answers never sent during attempts
Reliability	Timer enforced by server; autosave retries; expired attempts finalised even without client; idempotent start/submit
Usability	Exam room usable on mobile; keyboard navigation; clear loading/empty/error states
Responsiveness	Works from 360 px to 1440 px
Maintainability	Layered backend (routes → controllers → services → models), feature-based frontend, linting, consistent API envelope
Testability	Business logic (grading, timing, analytics) isolated in pure services with unit tests
Portability	.env-driven config; one-command local run; deployable on free tiers
5. Users and Roles
Role	Created how	Can do
Admin	Seeded; creates other admins	Manage users, batches, subjects; view platform analytics; view any exam/result; reset passwords; deactivate accounts
Teacher	Created by admin	Own question bank; create/edit/publish own exams; assign batches; view submissions and analytics for own exams; reset an attempt; export CSV; view student profile analytics for students who attempted their exams
Student	Self-register (batch chosen from a dropdown, or assigned by admin later)	View assigned exams; take exams; view own results, review, leaderboard; view own analytics
Permission rule of thumb: role middleware decides which kind of user may call an endpoint; ownership checks inside services decide which records they may touch (a teacher cannot read another teacher's exam; a student cannot read another student's attempt).

6. Feature Architecture
Core (must ship)
Auth (register, login, logout, session restore, change password)
Admin: users, batches, subjects
Question bank CRUD with filters
Exam builder with draft → published lifecycle
Student exam list and exam room (timer, autosave, resume, submit)
Auto-grading and result storage
Result page and answer review
Student analytics dashboard
Exam analytics for teachers (summary, distribution, question stats)
Seed data script
Important supporting
Mark-for-review and question palette in exam room
Shuffle questions and options (per-attempt order stored)
Negative marking option
Review policy (immediate / after exam ends / never)
Exam leaderboard with rank and percentile
Tab-switch counter (logged, shown to teacher, not punitive by default)
Teacher and admin dashboards
Duplicate exam; reset attempt
CSV export of exam results
Toast notifications, skeleton loaders, empty states, error boundary
Rate limiting, helmet, centralised error handler
Nice-to-have (only after core is stable)
Bulk question import via CSV
Dark mode
Print/PDF result card (browser print stylesheet)
At-risk student list on teacher dashboard
Question discrimination index
Image URL in question text
Explicitly not implemented
Proctoring, sockets, email, multi-attempt versioning, subjective grading, AI tutoring, role-permission editor UI, audit-log UI.

7. User Experience (by role)
Student
Land on /login → register (name, email, password, batch) or sign in.
Dashboard: greeting, stat cards (exams taken, average %, best score, rank trend), "Live now" banner with Start button, upcoming exams, recent results, performance trend chart.
My Exams: tabs Upcoming / Live / Completed; each card shows subject, duration, marks, window, status.
Exam Instructions page: rules, duration, marking scheme, negative marking, tab-switch notice; checkbox "I have read the instructions" → Start Exam.
Exam Room (focus layout): top bar (title, timer, Submit), question panel (stem, options, Mark for review, Prev/Next), palette (answered / unanswered / marked / current). Autosave indicator ("Saved ✓ / Saving… / Offline, retrying").
Submit confirmation dialog shows answered / unanswered / marked counts.
Result page: score ring, pass/fail, correct/wrong/skipped, time taken, rank and percentile (if allowed), topic-wise breakdown, "Review answers" (if policy allows).
My Analytics: trend line vs batch average, subject bars, topic strength/weakness lists, time efficiency, improvement indicator.
Teacher
Dashboard: active exams, total submissions, average pass rate, recent exams table, batch comparison chart, at-risk students (nice-to-have).
Question Bank: table with filters (subject, topic, type, difficulty, search); create/edit in a drawer or page; archive.
Exams: list with status chips; Exam Builder is a stepper: (1) Details → (2) Questions (pick from bank, set marks, reorder) → (3) Rules and schedule (batches, window, duration, negative marking, shuffle, review policy) → (4) Review and Publish.
Exam Detail: tabs Overview / Submissions / Analytics / Questions. Submissions table lets them open an attempt, reset it, or export CSV.
Exam Analytics: KPI cards, score distribution histogram, pass/fail donut, question difficulty chart, per-question table (with option distribution), leaderboard.
Admin
Dashboard: counts (users by role, exams by status), attempts-per-day chart, average % by subject.
Users: searchable/filterable table, create user modal, activate/deactivate, reset password.
Batches and Subjects: simple tables with CRUD and guarded deletion.
8. Complete System Flow
[Admin] creates Batches, Subjects, Teachers
   ↓
[Student] registers → joins Batch
   ↓
[Teacher] adds Questions → builds Exam (snapshots questions) → assigns Batches → Publishes
   ↓
[Exam window opens]
   ↓
[Student] opens exam → POST start (creates Attempt, sets expiresAt) → GET attempt (questions without answers)
   ↓                                  ↑ resume returns same attempt
   autosave answers (PUT per question) ... timer from server
   ↓
Submit (manual) ─┐
Timeout (client auto-submit) ─┼→ finalizeAttempt() → gradeAttempt() → result stored in attempt
Sweeper/lazy finalise (server) ─┘
   ↓
[Student] Result page ← attempt.result
   ↓
Analytics endpoints run aggregations over submitted attempts → dashboards
Single source of truth for finalisation: one service function, finalizeAttempt(attempt, reason), is the only code path that grades. It is idempotent (if already submitted, it returns the stored result).

9. System Architecture
React SPA (Vite) ──HTTPS/JSON──▶ Express API ──Mongoose──▶ MongoDB Atlas
   │  TanStack Query cache          │  routes → controllers → services → models
   │  AuthContext                   │  middleware: auth, role, validate, errors
                                    └─ node-cron: expired-attempt sweeper (every minute)
Single-origin production deployment: Express serves the built React app and the API from the same domain. This removes CORS and third-party-cookie problems.
Dev: Vite dev server proxies /api to Express (localhost:5000).
Stateless API: the session is a signed JWT in an httpOnly cookie; no server-side session store.
10. Frontend Architecture
Tooling: React 18, Vite, React Router v6, TanStack Query, Axios, React Hook Form + Zod, Tailwind CSS + shadcn/ui, Recharts, Lucide icons, Sonner (toasts), date-fns.

10.1 Route map
Path	Role	Page
/login, /register	public	Auth pages
/	any	Redirects to role dashboard
/student	student	Dashboard
/student/exams	student	Exam list (tabs)
/student/exams/:examId	student	Instructions and start
/student/attempts/:attemptId/take	student	Exam room (focus layout)
/student/attempts/:attemptId/result	student	Result and review
/student/analytics	student	My analytics
/teacher	teacher	Dashboard
/teacher/questions	teacher	Question bank
/teacher/exams	teacher	Exam list
/teacher/exams/new, /teacher/exams/:id/edit	teacher	Exam builder stepper
/teacher/exams/:id	teacher	Exam detail (tabs: overview, submissions, analytics)
/teacher/students/:id	teacher	Student analytics (read-only)
/admin	admin	Dashboard
/admin/users, /admin/batches, /admin/subjects	admin	Management tables
/profile	any	Profile and change password
*	any	404
10.2 Layouts
AuthLayout: centered card.
DashboardLayout: collapsible sidebar (role-specific menu), top bar (breadcrumbs, user menu), content area. On mobile the sidebar becomes a drawer.
ExamLayout: no sidebar; sticky top bar with title, timer, Submit.
10.3 State management (decision)
State type	Tool
Server data (lists, details, analytics)	TanStack Query (caching, loading/error states, invalidation)
Auth user	AuthContext (user, login, logout; hydrated by GET /auth/me on load)
Exam-room local state (answers, current index, marks, save status)	useReducer inside ExamRoom, with an autosave hook
Form state	React Hook Form + Zod
UI state (dialogs, tabs)	Local useState / URL search params for filters
No Redux. Server state is not copied into global stores.

10.4 API communication
One Axios instance with baseURL: "/api", withCredentials: true.
Response interceptor: on 401 (except on /auth/login) → clear auth, redirect to /login with a toast "Session expired".
Per-feature api files return unwrapped data; per-feature hooks wrap them (useExams, useCreateQuestion…).
Normalised error: { message, code, fieldErrors } is surfaced to forms.
10.5 Route protection
<ProtectedRoute roles={[...]}> checks AuthContext. Unauthenticated → /login. Wrong role → / (redirect to own dashboard) with a "not allowed" toast. This is UX only; the backend is the real guard.

10.6 Component architecture
components/ui/          shadcn primitives (Button, Card, Dialog, Table, Tabs, Badge, Skeleton…)
components/common/      DataTable, PageHeader, StatCard, EmptyState, ErrorState, ConfirmDialog,
                        StatusBadge, SearchInput, Pagination, ChartCard
features/auth/          LoginForm, RegisterForm, AuthContext, ProtectedRoute
features/questions/     QuestionTable, QuestionForm, OptionEditor, QuestionFilters
features/exams/         ExamStepper, QuestionPicker, ExamRulesForm, ExamCard, ExamTable
features/attempt/       ExamRoom, QuestionPanel, Palette, Timer, SubmitDialog, SaveIndicator, useAutosave, useCountdown
features/results/       ScoreRing, ResultSummary, ReviewList, Leaderboard
features/analytics/     TrendChart, SubjectBarChart, TopicList, ScoreHistogram, DifficultyChart, QuestionStatsTable
features/admin/         UserTable, UserForm, BatchTable, SubjectTable
10.7 Exam room mechanics (frontend)
Timer: server returns remainingSeconds and serverNow. Client computes the deadline from performance.now() offset, so changing the system clock cannot extend time. Every autosave response returns a fresh remainingSeconds, and the client re-syncs silently.
Autosave: on each answer change, debounce ~400 ms → PUT /attempts/:id/answers/:questionId. Failed saves go into a retry queue (exponential backoff); status indicator shows Saving / Saved / Offline.
Auto-submit: at 0, call POST submit; on 409 ALREADY_SUBMITTED or 410 EXPIRED just navigate to results.
Tab switches: visibilitychange → POST /attempts/:id/events {type:"tab_hidden"} (fire and forget).
Guard: beforeunload warning; refresh is safe because state restores from the server.
Accessibility: radio/checkbox semantics, keyboard shortcuts (←/→, 1–6 to select option, M to mark).
10.8 Responsive behaviour
Palette collapses into a bottom sheet on mobile; tables switch to card lists below md; charts use ResponsiveContainer.

11. Backend Architecture
Libraries: express, mongoose, zod, bcryptjs, jsonwebtoken, cookie-parser, helmet, cors (dev only), express-rate-limit, morgan, node-cron, dotenv, json2csv (or hand-rolled CSV).

11.1 Layering
routes: URL → middleware chain → controller.
controllers: parse request, call a service, shape the response. No business logic.
services: all business rules (grading, timing, exam lifecycle, analytics). Pure where possible, so they are unit-testable.
models: Mongoose schemas, indexes, and small instance methods.
middleware: authenticate, requireRole(...roles), validate(zodSchema, source), errorHandler, notFound, rateLimiters.
utils: ApiError, asyncHandler, sendSuccess, pagination, csv.
11.2 Response envelope
// success
{ "success": true, "data": { ... }, "meta": { "page": 1, "limit": 20, "total": 134 } }
// error
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "Invalid input", "details": [{ "path": "email", "message": "Invalid email" }] } }
Error codes: VALIDATION_ERROR 400, UNAUTHENTICATED 401, FORBIDDEN 403, NOT_FOUND 404, CONFLICT 409, EXAM_NOT_LIVE 409, ALREADY_SUBMITTED 409, ATTEMPT_EXPIRED 410, RATE_LIMITED 429, INTERNAL 500.

11.3 Validation and errors
Zod schemas per route (body, params, query), .strict() so unknown keys (including $-operators) are rejected.
Mongoose-level validators as the second line of defence; Mongoose CastError, duplicate key (11000), and validation errors are mapped by errorHandler.
Stack traces are hidden when NODE_ENV=production.
11.4 Core services
Service	Responsibility
authService	register, login, password change, token issue
examService	create/update, add/remove/reorder questions (snapshot), publish/unpublish rules, phase computation
attemptService	startOrResume, getAttemptState, saveAnswer, recordEvent, finalizeAttempt, finalizeExpired
gradingService	pure grade(examQuestions, answers, rules) → result object
analyticsService	aggregation pipelines for student, exam, question, subject, teacher, admin
leaderboardService	rank and percentile
11.5 Background job
node-cron runs every minute: find attempts where status = "in_progress" and expiresAt < now - 5s, finalise each with reason timeout. Plus lazy finalisation: whenever an attempt is read/saved, or submissions/analytics for an exam are requested, expired attempts are finalised first. This keeps results correct even if the host sleeps (free tiers) and the cron did not run.

12. MongoDB Architecture
12.1 Collections overview
Collection	Purpose
users	Admins, teachers, students
batches	Student groups (e.g. "CSE-A 2026")
subjects	Subject catalogue
questions	Teacher-owned question bank
exams	Exam config + embedded question snapshot
attempts	One per student per exam; embeds answers and the graded result
12.2 Schemas (fields)
users

{
  _id, name, email (unique, lowercase), passwordHash (select:false),
  role: "admin" | "teacher" | "student",
  batchId: ObjectId|null (students), rollNumber: String|null,
  isActive: Boolean (default true), lastLoginAt, createdAt, updatedAt
}
batches { _id, name (unique), year, createdAt } subjects { _id, name (unique), code (unique), description, createdAt }

questions

{
  _id, subjectId, topic: String, type: "single" | "multiple" | "truefalse",
  text: String,
  options: [{ key: "A", text: "..." }],   // 2–6 options; truefalse has A=True, B=False
  correctKeys: ["B"],                     // single/truefalse: exactly 1; multiple: ≥1
  explanation: String,
  difficulty: "easy" | "medium" | "hard",
  defaultMarks: Number (default 1),
  createdBy: ObjectId (teacher), isArchived: Boolean, createdAt, updatedAt
}
exams

{
  _id, title, description, instructions, subjectId, createdBy (teacher),
  batchIds: [ObjectId],
  startTime: Date, endTime: Date, durationMinutes: Number,
  passPercentage: Number (default 40),
  negativeMarking: { enabled: Boolean, penaltyFraction: Number (e.g. 0.25) },
  shuffleQuestions: Boolean, shuffleOptions: Boolean,
  reviewPolicy: "immediate" | "after_end" | "never",
  status: "draft" | "published" | "archived",
  totalMarks: Number (computed on save),
  questions: [{                         // SNAPSHOT
    _id (stable per-exam question id),
    sourceQuestionId, type, text, options:[{key,text}], correctKeys, explanation,
    topic, difficulty, marks
  }],
  publishedAt, createdAt, updatedAt
}
Derived (never stored): phase = upcoming | live | ended from startTime/endTime vs now.

attempts

{
  _id, examId, studentId,
  // denormalised for analytics (no joins needed):
  subjectId, teacherId, batchId, examTitle,
  status: "in_progress" | "submitted",
  submitReason: "manual" | "timeout" | "auto" | null,
  startedAt, expiresAt, submittedAt,
  presentation: [{ questionId, optionOrder: ["C","A","D","B"] }],  // per-attempt order, stored once
  answers: [{ questionId, selectedKeys: ["B"], markedForReview: Boolean, answeredAt }],
  tabSwitchCount: Number,
  result: {                             // present only after submit
    score, totalMarks, percentage, passed,
    correctCount, wrongCount, unansweredCount, timeTakenSeconds,
    evaluations: [{
      questionId, sourceQuestionId, topic, difficulty,
      selectedKeys, correctKeys, isCorrect, marksAwarded
    }]
  },
  createdAt, updatedAt
}
12.3 Relationships: reference vs embed
Relationship	Choice	Reason
exam → questions	Embed (snapshot)	Exam must be immutable once taken; one read loads the paper; later edits to the bank cannot corrupt past results
exam → batches, subject, teacher	Reference	Small, shared, rarely joined
attempt → answers	Embed	Always read/written with the attempt; bounded size
attempt → result and evaluations	Embed	One-document read for result page; one $unwind for analytics
attempt → exam/student	Reference + denormalised copies of subject/teacher/batch/title	Analytics group by subject/batch without $lookup
user → batch	Reference	Batch rename must reflect everywhere
12.4 Indexes
Collection	Index	Purpose
users	{email:1} unique	login, uniqueness
users	{role:1, batchId:1}	admin lists, batch rosters
questions	{createdBy:1, subjectId:1, topic:1, isArchived:1}	bank filters
questions	text index on text, topic	search
exams	{createdBy:1, status:1, startTime:-1}	teacher list
exams	{batchIds:1, status:1, startTime:1}	student's assigned exams
attempts	{examId:1, studentId:1} unique	one attempt per student per exam; makes start idempotent
attempts	{studentId:1, status:1, submittedAt:-1}	student history and trend
attempts	{examId:1, status:1, "result.score":-1}	leaderboard and exam analytics
attempts	{status:1, expiresAt:1}	sweeper
attempts	{teacherId:1, subjectId:1, submittedAt:-1}	teacher/subject analytics
12.5 Validation
Mongoose schema validators (enums, min/max, required) plus Mongo $jsonSchema is not required. Business-rule validation (e.g. "single type has exactly 1 correct key", "endTime > startTime", "durationMinutes ≤ window length") lives in Zod and in service methods.

12.6 Data lifecycle
Users are deactivated, never hard-deleted (attempt history stays intact).
Questions are archived (not deleted) once used in any exam; unused ones may be hard-deleted.
Exams: draft → published → archived. Drafts can be deleted; published exams with attempts cannot.
Batches/subjects cannot be deleted while referenced (409 CONFLICT).
12.7 Example documents
Question

{
  "_id": "665f...a1", "subjectId": "665f...s1", "topic": "Indexing", "type": "single",
  "text": "Which MongoDB index type supports queries on multiple fields?",
  "options": [{"key":"A","text":"Single field"},{"key":"B","text":"Compound"},{"key":"C","text":"TTL"},{"key":"D","text":"Hashed"}],
  "correctKeys": ["B"], "explanation": "A compound index covers several fields in order.",
  "difficulty": "medium", "defaultMarks": 2
}
Attempt (submitted)

{
  "examId": "665f...e1", "studentId": "665f...u9", "subjectId": "665f...s1", "teacherId": "665f...t1",
  "batchId": "665f...b1", "examTitle": "DBMS Unit Test 2", "status": "submitted", "submitReason": "manual",
  "startedAt": "2026-10-06T09:02:11Z", "expiresAt": "2026-10-06T09:47:11Z", "submittedAt": "2026-10-06T09:39:40Z",
  "answers": [{"questionId":"q1","selectedKeys":["B"],"markedForReview":false}],
  "tabSwitchCount": 1,
  "result": {
    "score": 17.5, "totalMarks": 20, "percentage": 87.5, "passed": true,
    "correctCount": 9, "wrongCount": 1, "unansweredCount": 0, "timeTakenSeconds": 2249,
    "evaluations": [{"questionId":"q1","topic":"Indexing","difficulty":"medium","selectedKeys":["B"],"correctKeys":["B"],"isCorrect":true,"marksAwarded":2}]
  }
}
12.8 Important queries (conceptual)
Student's exams: exams.find({status:"published", batchIds: user.batchId}) + one attempts.find({studentId, examId:{$in}}) to attach attempt status (two queries, merged in service).
Trend: attempts.find({studentId, status:"submitted"}).sort({submittedAt:1}) projecting examTitle, result.percentage, submittedAt.
Topic accuracy: $match student → $unwind result.evaluations → $group by topic summing correct and total.
Question stats: $match exam → $unwind evaluations → $group by sourceQuestionId.
Leaderboard: $match exam submitted → $sort score desc, timeTakenSeconds asc → $setWindowFields rank (or rank in Node).
13. Examination Architecture
13.1 Question rules
Type	Valid configuration	Grading
single	2–6 options, exactly 1 correct	Full marks if match
multiple	2–6 options, ≥1 correct	All-or-nothing: full marks only if selected set equals correct set (documented, simple, defensible)
truefalse	fixed options A=True, B=False	Same as single
Unanswered = 0 marks, never penalised. Wrong answer = -marks × penaltyFraction if negative marking is enabled, else 0. A student's total never goes below 0.

13.2 Exam lifecycle
draft ──publish──▶ published ──archive──▶ archived
  ▲                    │
  └──unpublish (only if zero attempts)
Publish validation: ≥1 question; all marks > 0; ≥1 batch; startTime in the future (or now); endTime > startTime; durationMinutes ≥ 1 and ≤ window length; totalMarks recomputed.

Edit rules

State	Editable
draft	Everything
published, no attempts yet	Unpublish to edit, or edit only title/description/instructions/endTime
published, has attempts	Only endTime extension and description; never questions, marks, or negative marking
13.3 Exam availability
phase is computed: now < startTime → upcoming; startTime ≤ now ≤ endTime → live; else ended. A student may start only while live. A student who starts at 9:50 in a 10:00-end window with a 45-minute duration gets expiresAt = min(startedAt + duration, endTime), so they get 10 minutes and are told so in the instructions screen.

13.4 Attempt handling
Start (POST /exams/:id/attempts, idempotent):

Exam must be published, live, and assigned to the student's batch.
Try to find an existing attempt for {examId, studentId}:
in progress and not expired → return it (resume).
submitted → 409 ALREADY_SUBMITTED with attemptId.
Else create it with expiresAt, a per-attempt presentation (shuffled question order and option order if enabled), and empty answers. The unique index guarantees that a double-click or two tabs cannot create two attempts (catch duplicate key and re-read).
Get attempt state (GET /attempts/:id): returns questions in presentation order without correctKeys or explanation, current saved answers, remainingSeconds, and serverNow. If expired, lazily finalise and respond 410 with result link.

Save answer (PUT /attempts/:id/answers/:questionId): validates ownership, status = in_progress, now ≤ expiresAt + 5 s grace, questionId belongs to the exam, selected keys ⊆ option keys, count rules per type. Upserts into answers[] using a positional update. An empty selectedKeys clears the answer.

Submit (POST /attempts/:id/submit): calls finalizeAttempt(attempt, "manual"). Idempotent.

13.5 Timing: server-authoritative
Only expiresAt (set by the server) matters. Client timers are cosmetic. Saves after expiresAt + 5 s are rejected; any later read finalises the attempt. The cron sweeper finalises abandoned attempts.

13.6 Evaluation
gradingService.grade(questions, answers, rules): for each exam question → find answer → compute isCorrect, marksAwarded → accumulate; then compute score, percentage = score / totalMarks × 100 (rounded to 2 dp), passed = percentage ≥ passPercentage, counts, and timeTakenSeconds = min(submittedAt, expiresAt) − startedAt. Output is written to attempt.result in a single findOneAndUpdate conditioned on status: "in_progress" (atomic guard against double grading).

13.7 Results and review
reviewPolicy	Student sees score	Student sees correct answers and explanations
immediate	immediately	immediately
after_end	immediately (score only)	after exam.endTime
never	immediately	never
Rank and percentile are shown only after the exam window ends (so the ranking is final), unless the teacher is viewing.

13.8 Anti-cheating (practical level)
Question and option shuffling, correct answers never sent during attempts, one attempt, server timer, tab-switch counter shown in the teacher's submissions table with a ⚠ badge above a threshold (default 3), and an instructions notice. Honest framing in the viva: deterrence and audit, not proctoring.

13.9 Teacher "reset attempt"
Deletes the attempt document (allowed only while the exam is live) so the student can start again. The action is logged as a console/server log line; an audit collection is out of scope.

14. Performance Analytics Architecture
Principle: store the facts once (graded result.evaluations inside each attempt, plus denormalised ids), and compute every metric on demand with indexed aggregation pipelines. No separate stats collections to keep in sync.

14.1 Student analytics
Metric	Definition	Visual
Exams taken	count of submitted attempts	Stat card
Average %	mean of result.percentage	Stat card
Best / latest score	max / most recent	Stat card
Performance trend	[ {exam, date, percentage, batchAvg} ] chronological	Line chart (student vs batch average)
Subject performance	avg % per subjectId	Bar chart (or radar)
Topic accuracy	correct ÷ attempted per topic (min 5 questions to qualify)	Strength list (≥ 75 %) and weak list (< 50 %)
Improvement indicator	avg of last 3 vs previous 3 exams	▲ / ▼ badge
Time efficiency	avg timeTakenSeconds ÷ duration	Small gauge
Rank / percentile per exam	see 14.5	Result page and table column
14.2 Exam analytics (teacher)
Participation: attempted ÷ eligible (students in assigned batches).
Score stats: average, median, highest, lowest, standard deviation (median and std-dev computed in Node over the percentage array for portability).
Pass rate: passed ÷ attempted (donut).
Distribution: histogram buckets 0–10 … 90–100 via $bucket.
Average time taken and time distribution.
Integrity: attempts with tabSwitchCount ≥ threshold.
Leaderboard: top N with rank.
14.3 Question analytics (per exam)
Metric	Definition
Correct % (difficulty index)	correct ÷ attempted
Observed difficulty	≥ 70 % easy, 40–70 % medium, < 40 % hard; flag mismatch against the teacher's tag
Unanswered %	skipped ÷ total attempts
Option distribution	how many chose each option (reveals misleading distractors)
Discrimination index (nice-to-have)	correct% of top 27 % scorers minus bottom 27 %
Presentation: a sortable table, plus a bar chart of correct % per question; "Hardest 5" and "Easiest 5" callouts.

14.4 Subject analytics
Avg % per exam over time (line), batch comparison for a subject (grouped bars), topic heat table (topic × avg accuracy).
14.5 Ranking
Sort by score desc, then timeTakenSeconds asc. Equal score and time share a rank (competition ranking: 1, 2, 2, 4). percentile = (attempts with a lower score ÷ total attempts) × 100. Computed on read (cheap at this scale).

14.6 Overview analytics
Teacher: active exams, total submissions, mean pass rate, recent exams, batch comparison (avg % by batchId), at-risk students (average of last 2 exams below pass %).
Admin: users by role, exams by status, attempts per day (last 14 days via $dateToString grouping), avg % by subject.
14.7 Pipelines (names only)
studentTrend, studentSubjectBreakdown, studentTopicAccuracy, examSummary, examDistribution, examQuestionStats, examLeaderboard, subjectOverTime, batchComparison, adminActivity. Each is a function in analyticsService taking ids and returning plain JSON, with a unit test against seeded data.

14.8 Scalability note (for viva)
At college scale on-demand aggregation is instant. If it ever grew, cache ended-exam stats in an examStats collection, since an ended exam's numbers never change. This is future scope.

15. API Architecture
Base: /api. All responses use the envelope in §11.2. Auth column: P public, A any authenticated user, S/T/Ad student/teacher/admin. Q = query params, B = body.

15.1 Auth
Method	Endpoint	Auth	Purpose · Request	Response	DB operation · Validation
POST	/auth/register	P	Student signup · B: name,email,password,batchId	user (no hash); sets cookie	users.insertOne · email format/unique, password ≥ 8 with letter+number, batch exists; role forced to student
POST	/auth/login	P	B: email,password	user; sets cookie	users.findOne({email}).select(+passwordHash), bcrypt compare · rate-limited; generic error message; reject inactive
POST	/auth/logout	A	Clear cookie	{}	none
GET	/auth/me	A	Session restore	user (+batch name)	users.findById
PATCH	/auth/me	A	B: name	user	updateOne
PATCH	/auth/me/password	A	B: currentPassword,newPassword	{}	verify current, hash new
15.2 Users, batches, subjects (Admin)
Method	Endpoint	Auth	Purpose	Notes
GET	/users	Ad	List · Q: role,batchId,search,isActive,page,limit	paginated, regex-escaped search
POST	/users	Ad	Create any role · B: name,email,password,role,batchId?	batch required for students
GET	/users/:id	Ad	Detail	
PATCH	/users/:id	Ad	Edit name, batch, role	cannot demote last admin
PATCH	/users/:id/status	Ad	B: isActive	cannot deactivate self
POST	/users/:id/reset-password	Ad	B: newPassword	
GET	/batches	A	List (needed by register form, so the list endpoint is public)	returns {id,name,studentCount} for authed, {id,name} for public
POST / PATCH / DELETE	/batches[/:id]	Ad	CRUD	delete blocked if students or exams reference it
GET	/subjects	A	List	
POST / PATCH / DELETE	/subjects[/:id]	Ad	CRUD	delete blocked if referenced
15.3 Question bank (Teacher)
Method	Endpoint	Auth	Purpose · Request	Response	Validation / DB
GET	/questions	T	Q: subjectId,topic,type,difficulty,search,page,limit,includeArchived	paginated list	filter createdBy = me; admin may view all
POST	/questions	T	B: question fields	question	per-type correct-key rules, unique option keys, subject exists
GET	/questions/:id	T		question	ownership
PATCH	/questions/:id	T	Partial update	question	ownership; does not change exams that already snapshotted it
DELETE	/questions/:id	T	Hard delete if unused, else archive	{archived:boolean}	check exams.questions.sourceQuestionId
GET	/questions/topics	T	Q: subjectId	distinct topics	distinct("topic")
POST	/questions/import	T	(nice-to-have) CSV	{created, errors[]}	row-level validation
15.4 Exams (Teacher)
Method	Endpoint	Auth	Purpose · Request	Response	Validation / DB
GET	/exams	T/Ad	Q: status,subjectId,phase,page	list with computed phase, attemptCount	owner filter; count via aggregation
POST	/exams	T	B: details + rules (draft)	exam	date and duration rules; batches exist
GET	/exams/:id	T/Ad	Full exam including answer keys	exam	ownership
PATCH	/exams/:id	T	Edit per §13.2	exam	state-dependent field whitelist
DELETE	/exams/:id	T	Draft only	{}	
POST	/exams/:id/questions	T	B: questionIds[]	exam	snapshot copy (skip duplicates), draft only
PATCH	/exams/:id/questions/:qid	T	B: marks	exam	marks > 0
DELETE	/exams/:id/questions/:qid	T	Remove	exam	draft only
PUT	/exams/:id/questions/order	T	B: orderedIds[]	exam	must be a permutation
POST	/exams/:id/publish	T	Validate and publish	exam	§13.2 checks
POST	/exams/:id/unpublish	T		exam	zero attempts only
POST	/exams/:id/duplicate	T	New draft copy	exam	resets schedule
GET	/exams/:id/attempts	T/Ad	Submissions table: student, status, score, %, time, tabSwitches, submittedAt	list	lazy-finalise expired first
DELETE	/exams/:id/attempts/:attemptId	T	Reset attempt	{}	exam live only
GET	/exams/:id/export	T/Ad	CSV of results	file	
15.5 Student exam discovery and attempts
Method	Endpoint	Auth	Purpose	Response / rules
GET	/student/exams	S	Q: phase	assigned exams: id, title, subject, duration, totalMarks, window, phase, attemptStatus, attemptId?
GET	/student/exams/:id	S	Instructions page	exam metadata only (no questions); 403 if not assigned
POST	/exams/:id/attempts	S	Start/resume (idempotent)	{attemptId, resumed} or 409s
GET	/attempts/:id	S (owner)	Exam-room payload	questions (sanitised, presentation order), answers, remainingSeconds, serverNow, expiresAt
PUT	/attempts/:id/answers/:questionId	S (owner)	B: selectedKeys[], markedForReview?	{savedAt, remainingSeconds}
POST	/attempts/:id/events	S (owner)	B: type: "tab_hidden"	204; increments tabSwitchCount ($inc)
POST	/attempts/:id/submit	S (owner)	Finalise	{attemptId, result summary}
GET	/attempts/:id/result	S (owner), T/Ad (exam owner)	Score + per-question review (per policy)	result; evaluations include correct keys/explanations only when allowed
GET	/attempts/mine	S	History	list of submitted attempts
GET	/exams/:id/leaderboard	S, T	Top N + the student's own rank	only after exam end for students
15.6 Analytics
Method	Endpoint	Auth	Purpose	Response
GET	/analytics/students/:id	S (own, me alias), T (students in their exams), Ad	Full student bundle	{overview, trend[], subjects[], topics{strengths[],weaknesses[]}, improvement, timeEfficiency}
GET	/analytics/exams/:id	T (owner), Ad	Exam summary	{participation, stats, passRate, distribution[], avgTime, flagged}
GET	/analytics/exams/:id/questions	T (owner), Ad	Question stats	[{questionId, text, correctPct, unansweredPct, observedDifficulty, taggedDifficulty, optionCounts, discrimination?}]
GET	/analytics/subjects/:id	T, Ad	Q: batchId?	{overTime[], batchComparison[], topicTable[]}
GET	/analytics/teacher/overview	T	Dashboard KPIs	{activeExams, submissions, avgPassRate, recentExams[], batchComparison[], atRisk[]}
GET	/analytics/admin/overview	Ad	Platform KPIs	{usersByRole, examsByStatus, attemptsPerDay[], avgBySubject[]}
15.7 Health
GET /health → {status:"ok", db:"connected"} (used by the host's health check).

16. Authentication & Security
Concern	Decision
Authentication	Email + password → server issues a JWT (sub, role, 8 h expiry) set as an httpOnly, Secure (prod), SameSite=Lax cookie
Passwords	bcryptjs, cost 10; password policy ≥ 8 chars with a letter and number; never logged or returned (select:false)
Session restore	GET /auth/me on app load
Logout	Clear cookie (stateless; acceptable for scope)
Authorization	authenticate loads the user (rejects deactivated), requireRole("teacher"), plus ownership checks in services
Protected routes	Frontend ProtectedRoute (UX) + backend middleware (security)
CSRF	SameSite=Lax cookie, JSON-only bodies (Content-Type enforced), single-origin deployment
Input safety	Zod strict schemas; no raw user objects passed to Mongo queries; regex input escaped for search
Brute force	express-rate-limit: login 10 attempts / 15 min / IP; global 300 req / 15 min
Headers	helmet defaults
Payload limits	express.json({ limit: "100kb" })
Secrets	.env only (JWT_SECRET, MONGO_URI); .env.example committed
Sensitive data	No hash in responses; correct answers stripped from attempt payloads; errors do not reveal whether an email exists
Privilege escalation	Role forced to student on public register; only admins set roles
Why not localStorage tokens? XSS could steal them. httpOnly cookies cannot be read by JS.

17. UI/UX Architecture
Visual direction: clean "SaaS dashboard": neutral slate background, white cards with subtle borders, indigo primary, green/amber/red for status, 8-pt spacing grid, Inter font, rounded-xl cards, minimal shadows.
Navigation: left sidebar with icons (collapsible), top bar with breadcrumbs and avatar menu; mobile drawer.
Dashboards: row of 4 stat cards → 2-column chart area → recent-activity table.
Forms: single-column, inline validation messages, disabled submit while pending, field-level server errors mapped from details[].
Tables: sortable headers, sticky header, pagination, filter bar, row actions in a kebab menu; card layout on mobile.
Charts (Recharts): line (trend), bar (subjects, question correct %), histogram (distribution), donut (pass/fail), radial score ring (result). Consistent palette, tooltips, accessible labels, "no data" states.
Notifications: toasts for success/failure; confirmation dialogs for destructive actions (publish, reset attempt, deactivate).
Loading: skeletons for cards/tables; spinner on buttons.
Empty states: illustration-free icon + one-line explanation + call-to-action ("No exams yet. Create your first exam").
Error states: inline ErrorState with Retry; top-level ErrorBoundary; dedicated 404 and 403 pages.
Exam room specifics: distraction-free, high-contrast, large touch targets, timer turns amber at 5 min and red at 1 min, palette colour-coded.
Responsive breakpoints: sm 640 / md 768 / lg 1024 / xl 1280.
Status chips: Draft (grey), Upcoming (blue), Live (green, pulsing dot), Ended (slate), Passed/Failed (green/red).
18. Project Folder Structure
exampulse/
├─ package.json                 # root scripts: dev (concurrently), build, start, seed, test
├─ README.md
├─ .gitignore
├─ server/
│  ├─ package.json
│  ├─ .env.example
│  └─ src/
│     ├─ server.js              # connect DB, start HTTP, start cron
│     ├─ app.js                 # express app (exported for tests)
│     ├─ config/                # env.js (validated with zod), db.js
│     ├─ models/                # User, Batch, Subject, Question, Exam, Attempt
│     ├─ routes/                # auth, users, batches, subjects, questions, exams, attempts, analytics, studentExams
│     ├─ controllers/           # thin HTTP handlers
│     ├─ services/              # auth, exam, attempt, grading, analytics, leaderboard
│     ├─ validators/            # zod schemas per resource
│     ├─ middleware/            # authenticate, requireRole, validate, errorHandler, rateLimit
│     ├─ jobs/                  # expiredAttemptsSweeper.js
│     ├─ utils/                 # ApiError, asyncHandler, response, pagination, csv, dates
│     ├─ seed/                  # seed.js, data generators
│     └─ tests/
│        ├─ unit/               # grading, timing, exam rules, analytics math
│        ├─ integration/        # supertest API flows (mongodb-memory-server)
│        └─ helpers/            # factories, auth helpers
└─ client/
   ├─ package.json, vite.config.js (proxy /api), tailwind.config.js, components.json
   └─ src/
      ├─ main.jsx, App.jsx, router.jsx
      ├─ lib/                   # axios.js, queryClient.js, utils.js, constants.js
      ├─ context/               # AuthContext.jsx
      ├─ hooks/                 # useDebounce, useCountdown, useAutosave, useRoleGuard
      ├─ components/
      │  ├─ ui/                 # shadcn primitives
      │  ├─ common/             # DataTable, StatCard, PageHeader, EmptyState, ErrorState, ConfirmDialog…
      │  └─ layout/             # DashboardLayout, AuthLayout, ExamLayout, Sidebar, Topbar
      ├─ features/              # auth, admin, questions, exams, attempt, results, analytics (each: api.js, hooks.js, components/, pages/)
      ├─ pages/                 # NotFound, Forbidden, Profile
      ├─ styles/                # globals.css (tailwind + tokens)
      └─ tests/                 # RTL tests
Purpose summary: server/services = rules; server/models = shape and indexes; client/features/* = everything for one domain in one place, so a new developer can find any feature quickly.

19. Testing Architecture
Tools: Vitest everywhere (one runner), Supertest, mongodb-memory-server, React Testing Library, optional Playwright for one E2E happy path.

19.1 Unit tests (fast, no DB)
gradingService: single correct/wrong/unanswered; multiple exact vs partial; negative marking; floor at 0; rounding; all-unanswered; pass boundary (exactly 40 %).
Timing: expiresAt = min(start + duration, endTime); grace window; phase computation.
Exam rules: publish validation, edit-permission matrix.
Analytics math: median, std-dev, percentile, ranking with ties, topic qualification threshold.
19.2 API and integration tests
Auth: register forces student; duplicate email 409; login success/fail/inactive; cookie flags; /me without cookie 401; rate limit trips.
RBAC: each role against each protected route family (matrix test); teacher A cannot read teacher B's exam; student cannot read another's attempt.
Exam lifecycle: draft → add questions → publish → validation failures → unpublish blocked after attempt.
Attempt engine: start before/after window; not-assigned student; double start returns same attempt; concurrent starts produce one doc; save after expiry rejected; submit twice idempotent; attempt payload never contains correctKeys; lazy finalisation of expired attempt; sweeper finalises abandoned attempt.
Results/review policy: each reviewPolicy value, before and after endTime.
Analytics: seeded fixtures with known expected numbers for every pipeline.
19.3 Frontend tests (selective)
Login form validation, ProtectedRoute redirects, useCountdown (fake timers), Palette states, QuestionForm per-type rules, exam-room autosave retry (mock Axios).

19.4 Manual test scenarios
Full happy path for each role. 2. Refresh mid-exam: timer and answers preserved. 3. Disconnect network for 30 s mid-exam: offline banner, then recovery. 4. Close the browser, wait past expiry, log in: attempt auto-submitted with correct score. 5. Open the same exam in two tabs. 6. Start at the last minute of the window. 7. Change system clock: timer unaffected. 8. Try URL tampering (another student's attempt id). 9. Mobile layout of exam room. 10. Result visibility under each review policy.
20. Error & Edge Case Handling
Situation	Handling
Double-click Start / two tabs	Unique {examId, studentId} index + catch 11000 → return existing attempt
Refresh or crash mid-exam	Resume from server state; timer from expiresAt
Browser closed, never submitted	Cron + lazy finalisation grade it at expiresAt using saved answers
Client clock wrong or tampered	Ignored; server time authoritative, client uses server-offset
Network drop during autosave	Retry queue with backoff; save indicator; final submit includes nothing extra, so answers must already be saved. Submit sends no answers; the server grades what it has, so the UI blocks submit until the queue is flushed (or warns if it cannot flush)
Late save after expiry	Rejected beyond 5 s grace (410)
Submit twice / race between cron and manual	Conditional update on status:"in_progress"; second call reads stored result
Student not in assigned batch	403 on start
Student's batch changed after exam published	Eligibility checked at start time; existing attempts unaffected
Exam end time passes while student is mid-attempt	expiresAt = min(...) already accounts for it
Teacher edits published exam	Blocked by edit matrix
Question edited/deleted in bank after use	Exam holds a snapshot; delete → archive
Teacher deletes batch/subject in use	409 CONFLICT with explanation
User deactivated while logged in	authenticate checks isActive each request → 401
Zero attempts → analytics	Return empty-shaped payload; UI shows EmptyState (no divide-by-zero)
Exam with all-unanswered attempt	Score 0, valid result
Invalid ObjectId in URL	Zod objectId validation → 400, not 500
Huge payloads / injection keys	Body limit; strict Zod rejects $ keys
Duplicate email on register	409 with field error
Last admin demotion/deactivation	Blocked
DB disconnected	/health fails; API returns 503 via error handler; Mongoose auto-reconnect
Timezones	Store UTC; display in the browser's local time; datetime-local inputs converted to UTC before sending
21. Development Roadmap
Strategy: build in vertical slices: each phase delivers backend + frontend + tests for one capability, and every phase ends in something demonstrable.

Phase 0: Foundation and tooling
Objective: a running skeleton.
Builds: monorepo layout, server (Express app, env validation, DB connection, /health, error handler, response utils), client (Vite, Tailwind, shadcn, router shell, Axios, QueryClient), ESLint/Prettier, root dev script, Vitest wired in both.
Depends on: nothing.
Result: npm run dev shows a React page that calls /api/health successfully.
Verify: health returns db: connected; lint and test commands run.
Next: models and auth.
Phase 1: Data models and seed skeleton
Objective: lock the schema before features.
Builds: all six Mongoose models with validators and indexes; factories for tests; minimal seed that creates the admin, a batch, and a subject.
Depends on: Phase 0.
Result: collections and indexes created in Atlas/local.
Verify: model unit tests (validation failures, unique indexes); inspect indexes in Compass.
Next: authentication.
Phase 2: Authentication and RBAC
Objective: secure identity before any feature.
Builds: register/login/logout/me/password; authenticate, requireRole, rate limit; frontend AuthContext, Login/Register pages, ProtectedRoute, role-based layouts and sidebar shells, empty dashboards.
Depends on: Phase 1.
Result: each role logs in and lands on its own empty dashboard; wrong-role URLs are blocked.
Verify: auth and RBAC test suite green; cookie flags confirmed; refresh keeps session.
Next: master data.
Phase 3: Admin master data
Objective: populate the people and groupings that exams depend on.
Builds: users, batches, subjects APIs + admin pages (tables, forms, status toggle, reset password), shared DataTable, ConfirmDialog, pagination, toasts; register form now loads batches.
Depends on: Phase 2.
Result: admin creates teacher, batches, subjects; students register into batches.
Verify: guarded deletes (409), last-admin protection, search/filter work.
Next: question bank.
Phase 4: Question bank
Objective: content for exams.
Builds: question CRUD + filters + topics endpoint; teacher Question Bank page, per-type QuestionForm with OptionEditor, archive logic.
Depends on: Phase 3 (subjects).
Result: teacher manages a searchable bank.
Verify: per-type validation tests; ownership tests; UI creates all three types.
Next: exam builder.
Phase 5: Exam builder and lifecycle
Objective: teachers can create and publish exams.
Builds: exam CRUD, snapshot add/remove/reorder, publish/unpublish/duplicate, edit matrix, computed phase; stepper UI with question picker.
Depends on: Phase 4, Phase 3 (batches).
Result: a published exam assigned to a batch.
Verify: publish validations, state matrix tests; snapshot independence (edit bank question → exam unchanged).
Next: student side and attempt engine.
Phase 6: Exam-taking engine
Objective: the heart of the system.
Builds: student/exams list + instructions; startOrResume, getAttemptState, saveAnswer, recordEvent, submit; gradingService, finalizeAttempt, lazy finalisation, cron sweeper; Exam Room UI (timer, palette, autosave, mark-for-review, submit dialog, resume).
Depends on: Phase 5.
Result: a student completes an exam end-to-end; results are stored.
Verify: all attempt-engine tests in §19.2; manual scenarios 2–7.
Next: results and review.
Phase 7: Results, review, leaderboard
Objective: close the student loop and give teachers visibility.
Builds: result endpoint with review policy, student history, leaderboard + ranking logic; Result page, review list; teacher Submissions tab, reset attempt, CSV export.
Depends on: Phase 6.
Result: students see scores and review; teachers see who submitted and how they did.
Verify: review-policy matrix; rank tie tests; CSV opens in Excel.
Next: analytics.
Phase 8: Analytics backend
Objective: correct numbers first, charts second.
Builds: all pipelines in analyticsService, endpoints in §15.6, empty-state shapes. Extend the seed to generate realistic attempts through gradingService (needed to develop and test analytics).
Depends on: Phase 7 (graded attempts); richer seed.
Result: analytics endpoints return correct JSON for seeded data.
Verify: fixture-based tests with hand-computed expected values; explain() shows index use on key pipelines.
Next: analytics UI.
Phase 9: Analytics dashboards (frontend)
Objective: make the insight visible.
Builds: chart components (trend, subject bars, histogram, donut, difficulty bars), student dashboard and analytics page, teacher dashboard and exam analytics tab, admin dashboard, student drill-down for teachers.
Depends on: Phase 8.
Result: all three dashboards populated with meaningful charts.
Verify: numbers on screen match API; every chart has loading, empty, and error states.
Next: polish and hardening.
Phase 10: Polish, hardening, nice-to-haves
Objective: professional finish.
Builds: responsive pass (esp. exam room on mobile), a11y pass, skeletons/empty/error states audit, profile page, security review (headers, limits), tab-switch badge, optional dark mode / CSV import / print card.
Depends on: Phases 2–9.
Result: consistent, demo-grade UI.
Verify: manual checklist §30, Lighthouse a11y ≥ 90, full test suite green.
Next: deployment.
Phase 11: Deployment
Objective: a public URL.
Builds: production build wiring (Express serves client/dist), Atlas cluster, Render service, env vars, seed in production DB, smoke test.
Depends on: Phase 10.
Result: live demo URL.
Verify: full happy path on the live URL; cron/lazy finalisation tested after the host has slept.
Next: documentation and demo rehearsal.
Phase 12: Documentation and demo rehearsal
Objective: academic deliverables and a flawless demo.
Builds: documents in §26; recorded backup demo video; rehearsed script.
Depends on: Phase 11.
Result: submission-ready package.
22. Implementation Dependency Map
Phase 0 Foundation
   └─▶ Phase 1 Models + Indexes
          └─▶ Phase 2 Auth + RBAC
                 └─▶ Phase 3 Users / Batches / Subjects
                        └─▶ Phase 4 Question Bank
                               └─▶ Phase 5 Exam Builder + Publish
                                      └─▶ Phase 6 Attempt Engine + Grading + Timer
                                             └─▶ Phase 7 Results + Review + Leaderboard
                                                    └─▶ Phase 8 Analytics API (+ rich seed)
                                                           └─▶ Phase 9 Analytics UI
                                                                  └─▶ Phase 10 Polish + Hardening
                                                                         └─▶ Phase 11 Deployment
                                                                                └─▶ Phase 12 Docs + Demo
Testing runs continuously inside every phase (not a final phase).
Why this order is forced: exams need questions; questions need subjects; exams need batches; attempts need exams and students; results need attempts; analytics need graded attempts (and a seed to test against); polish and deployment need working features.

Parallelisation for a team: after Phase 2, one member can do Phase 3 + 4 (master data, bank) while another builds the Exam Room UI shell against mocked data. Analytics UI (Phase 9) can start from Phase 8's agreed JSON shapes.

23. Deployment Architecture
Browser ──HTTPS──▶ Render Web Service (Node)
                     ├─ serves client/dist (static)
                     ├─ /api/* Express routes
                     └─ node-cron sweeper
                            │
                            └──▶ MongoDB Atlas (M0 free cluster)
Build: npm --prefix client run build → client/dist; Express serves it with a SPA fallback (* → index.html, excluding /api).
Render settings: build npm install && npm run build, start npm start, health check /api/health.
MongoDB: Atlas M0; create a DB user with a least-privilege role on one database; IP allow-list 0.0.0.0/0 (acceptable for a demo with a strong password) or Render's outbound IPs.
Environment variables: NODE_ENV=production, PORT, MONGO_URI, JWT_SECRET (32+ random bytes), JWT_EXPIRES_IN=8h, COOKIE_SECURE=true, CLIENT_ORIGIN (dev only, for CORS).
CORS: enabled only in development for http://localhost:5173; unnecessary in production (same origin).
Free-tier caveat: the service sleeps when idle, so cron may not run, but lazy finalisation guarantees correctness. Warm the service before the demo.
Alternative considered: Vercel (frontend) + Render (API). Rejected as the default because cross-site cookies need SameSite=None and are blocked by some browsers; it remains a valid fallback with a Vercel rewrite proxying /api to Render.
24. Demo Flow (≈ 12 minutes)
Context (1 min): problem statement, architecture slide (MERN, aggregation-driven analytics).
Admin (1.5 min): dashboard, show batches/subjects, create a teacher quickly.
Teacher (3 min): question bank (filters), build an exam in the stepper (pick questions, schedule, negative marking, shuffle), publish.
Student (3 min): log in on a second browser/phone, start the live exam, answer a few questions, refresh mid-exam to show resume, mark one for review, let the audience see the autosave indicator, submit; show instant result, rank, review.
Teacher analytics (2 min): submissions table, histogram, pass rate, question difficulty table (flag hard questions), leaderboard, CSV export.
Student analytics (1 min): trend vs batch average, topic strengths/weaknesses (rich from seed data).
Robustness shout-outs (30 s): server-side timer, auto-submit on abandonment, answers never sent to the browser during attempts, RBAC demonstration (student URL-guessing a teacher route).
Close: tech summary and future scope.
Prep: seeded DB with ~60 students and months of history, a pre-published exam scheduled to be live during the demo, two browser profiles, backup screen recording.

25. Seed / Demo Data
Data	Quantity and design
Admin	1 (admin@exampulse.dev)
Teachers	3, each owning 1–2 subjects
Batches	3 (e.g. CSE-A, CSE-B, IT-A)
Students	60 across batches, plus a named demo student student@exampulse.dev
Subjects	4 (DBMS, Operating Systems, Data Structures, Computer Networks)
Questions	~30 per subject (~120), mixed types and difficulties, 4–6 topics per subject, with explanations
Exams	6 ended (spread over ~10 weeks, 2 per main subject), 1 live (for the demo), 1 upcoming, 1 draft
Attempts	Generated for ended exams by simulating students via gradingService: each student has a latent skill level with noise, a per-topic strength, ~10 % absentees, realistic time taken, and 5 % with high tab-switch counts. The demo student shows an upward trend with one weak topic
The seed is idempotent (--reset flag drops and recreates) and uses the real services so data is always consistent. Credentials are listed in the README.

26. Documentation Plan
Technical: README (setup, scripts, env, seed credentials), architecture overview with diagrams, ER/collection diagram, API reference (table or OpenAPI-lite), data dictionary, analytics metric definitions, testing guide, deployment guide.

Academic: abstract; problem statement and objectives; literature/existing-systems comparison; SRS (functional and non-functional requirements from §4); system design (architecture, DFD level 0/1, use-case diagram, sequence diagrams for start exam and submit and grade, class/collection diagram); implementation details (key algorithms: grading, timing, aggregation pipelines); testing report (test cases table and results); screenshots; conclusion and future scope; references; viva Q&A sheet.

27. Future Scope
Email notifications and password reset by email; multiple attempts with versioning; subjective questions with manual grading; question images via cloud storage; webcam-based proctoring; WebSocket live monitoring; cached examStats; adaptive difficulty; AI-generated topic recommendations; LMS/SSO integration; PWA/offline mode; internationalisation; audit log UI.

28. Technology Stack
Layer	Tech	Why	Required?	Complexity added
Runtime / API	Node.js 20, Express 4	Mandated	Essential	Low
DB	MongoDB Atlas + Mongoose	Mandated; schemas, validation, indexes	Essential	Low
Validation	Zod	One validation language on API (and forms)	Essential	Low
Auth	jsonwebtoken, bcryptjs, cookie-parser	Standard, simple	Essential	Low
Security	helmet, express-rate-limit	Cheap, high value	Essential	Very low
Jobs	node-cron	Expired-attempt sweeper without queues	Essential (with lazy fallback)	Low
Logging	morgan	Request logs	Optional	Very low
CSV	json2csv	Result export	Optional	Very low
Frontend	React 18 + Vite	Mandated; fast dev	Essential	Low
Routing	React Router 6	Standard	Essential	Low
Server state	TanStack Query	Caching, loading/error, invalidation	Essential (big complexity reducer)	Low
Forms	React Hook Form + Zod resolver	Complex forms (question and exam builders)	Essential	Low
Styling/UI	Tailwind + shadcn/ui	Modern look quickly, accessible primitives	Strongly recommended	Low–medium
Charts	Recharts	React-native charting, enough for all needs	Essential	Low
Toasts / icons / dates	Sonner, Lucide, date-fns	Polish	Optional	Very low
Testing	Vitest, Supertest, mongodb-memory-server, RTL	One runner, realistic API tests	Essential (backend), selective (frontend)	Low
E2E	Playwright	One happy-path test	Optional	Medium
Tooling	ESLint, Prettier, concurrently	Consistency	Recommended	Very low
Deliberately not used: TypeScript (extra learning overhead), Redux, Socket.io, Redis, Docker (optional only), GraphQL.

29. Architectural Decisions
#	Decision	Reason	Alternative considered	Why chosen is better here
1	Embed question snapshot in exam	Immutable paper; one read; past results never change	Reference questionIds only	Referencing lets later bank edits silently change exams already taken; versioning is far more complex
2	Single attempts collection with embedded result	Result page is one read; analytics needs no joins	Separate results collection	Two collections add sync issues and $lookups with no benefit at this scale
3	Denormalise subjectId/teacherId/batchId/examTitle into attempts	Group by subject/batch directly	$lookup to exams in every pipeline	Faster, simpler pipelines; fields are immutable after creation
4	Compute analytics on demand with aggregation	Always correct; no sync	Precomputed stats collections / cron	Zero consistency bugs; trivial at college scale; cache is future scope
5	Server-authoritative timer (expiresAt)	Client clocks are untrustworthy	Client-side countdown only	Prevents extending time; enables auto-submit of abandoned attempts
6	Lazy finalisation + cron sweeper	Correct even if the host sleeps	Cron only	Free hosts sleep; cron alone could leave attempts ungraded
7	Autosave per answer, submit sends nothing	Crash-safe; resume works	Send all answers at submit	Browser crash would lose everything; payload at submit is tiny and failure-proof
8	Unique {examId, studentId} index	Atomic one-attempt guarantee	Check-then-insert in code	Check-then-insert races under double-click; DB constraint cannot race
9	JWT in httpOnly cookie, single-origin deploy	XSS-safe storage, no CORS/third-party cookie issues	JWT in localStorage / split hosting	Safer and simpler; fewer deployment failures
10	Roles: admin / teacher / student, string enum on user	Simple RBAC	Permission-based ACL, role collection	A permission editor adds UI and complexity with no demo value
11	Admin creates teachers; students self-register	Prevents teacher self-escalation without email verification	Open registration with approval queue	No email infra needed; clear trust model
12	Batches for exam assignment	Realistic classroom model; simple eligibility check	Assign per individual student / public exams	Individual assignment is tedious UI; public exams lose analytics comparisons
13	TanStack Query + Context + useReducer	Right tool per state type	Redux Toolkit everywhere	Less boilerplate; avoids duplicating server data in a store
14	Layered backend (routes→controllers→services→models)	Testable business logic, viva-explainable	Fat controllers / MVC only	Grading and timing become pure, unit-testable functions
15	Zod strict schemas	Validation plus injection protection	express-validator / Joi	Same library on forms and API; .strict() blocks operator injection
16	JavaScript, not TypeScript	Team speed	TypeScript	Zod gives runtime safety; less setup friction
17	Multiple-choice all-or-nothing marking	Clear, easy to explain	Partial credit	Partial credit adds ambiguity and edge cases
18	Soft delete (deactivate/archive)	Preserves history and analytics integrity	Hard delete cascade	Hard deletes would orphan attempts and distort analytics
19	Vertical-slice roadmap	Demonstrable at each phase	Layer-by-layer (all backend, then all frontend)	Early integration; fewer late surprises
20	Rank on read, not stored	Always consistent	Store rank on submit	Rank changes as others submit; stored values go stale
30. Final Project Specification & Checklist
30.1 Final application, in one paragraph
ExamPulse is a polished MERN web app with three role-based experiences. Admins manage users, batches and subjects. Teachers maintain a question bank, build and schedule exams with configurable rules, and monitor submissions through analytics (score distribution, pass rate, question difficulty, leaderboard). Students see their assigned exams, take them in a distraction-free, auto-saving, server-timed exam room that survives refreshes and disconnects, and receive instant results with rank, review, and a personal analytics dashboard showing trends, subject performance, and topic-level strengths and weaknesses. MongoDB aggregation pipelines power all analytics over embedded graded results.

30.2 Final implementation checklist
Foundation

 Repo, tooling, env validation, health check
 Six models with indexes Auth and admin
 Register/login/logout/me/password, cookie flags, rate limit
 RBAC middleware + frontend route guards
 Users, batches, subjects CRUD with guarded deletes Content and exams
 Question bank CRUD, filters, per-type validation, archive
 Exam builder stepper, snapshot logic, publish/unpublish/duplicate, edit matrix Exam engine
 Student exam list and instructions
 Idempotent start/resume; sanitised attempt payload
 Autosave with retry; server timer; auto-submit; tab-switch events
 gradingService with negative marking
 Lazy finalisation + cron sweeper Results
 Result page, review policy, history, leaderboard (ranks/percentile)
 Teacher submissions table, reset attempt, CSV export Analytics
 Student, exam, question, subject, teacher, admin pipelines + endpoints
 Charts and dashboards with loading/empty/error states Quality
 Unit tests (grading, timing, rules, analytics math)
 Integration tests (auth, RBAC matrix, lifecycle, attempt engine, analytics)
 Selected frontend tests
 Responsive, accessibility, security-header pass Delivery
 Seed script (idempotent, realistic history, demo accounts)
 Production build served by Express; Atlas + Render deployed; env vars set
 README, SRS/design docs, test report, screenshots
 Demo rehearsed + backup recording
30.3 Suggested instructions for the AI coding environment
Work one phase at a time in the order of §21. Before each phase, restate its objective and acceptance checks; after it, run the tests, then update the checklist. Treat §11.2 (envelope), §12.2 (schemas), §15 (API), and §13 (exam rules) as contracts: if implementation needs to deviate, update this blueprint first.