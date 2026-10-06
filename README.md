# ExamPulse

ExamPulse is a MERN online examination and performance analytics system. Phases 0–10 of the supplied master blueprint are implemented: foundation, data models, authentication/RBAC, admin master data, question bank, exam builder/lifecycle, the student exam-taking engine, policy-controlled results and leaderboards, the analytics API, the analytics dashboards, and polish/hardening.

## Current capabilities

- Six Mongoose models with the blueprint indexes: users, batches, subjects, questions, exams, and attempts.
- Student registration, cookie-based login/logout, session restore, profile updates, password changes, and role guards.
- Admin user directory with search, role/status filters, pagination, create/edit, activate/deactivate, and password reset.
- Batch and subject CRUD with guarded deletion when records are referenced.
- Teacher-owned question repository with type-specific validation, filters, topic discovery, and history-safe archive behavior.
- Exam builder with embedded question snapshots, marks and ordering, batch scheduling, configurable rules, draft/publish/unpublish/archive/duplicate actions, and the published edit-permission matrix.
- Student exam discovery, instructions, idempotent start/resume, server-authoritative countdown, retrying autosave, question palette, mark-for-review, tab-switch auditing, automatic submission, and server-side grading.
- Expired-attempt background finalization plus lazy finalization on read, with immutable evaluation results stored in the attempt.
- Student result history, score and topic summaries, policy-controlled answer review, final rank and percentile, and exam leaderboards.
- Teacher submission inspection, full attempt review, live-window attempt reset, integrity flags, and Excel-safe CSV export.
- Aggregation-backed student, exam, question, subject, teacher, and administrator analytics with stable empty-state shapes and role/ownership enforcement.
- Student, teacher, and administrator analytics dashboards with score/cohort trends, subject comparisons, topic mastery, score histograms, pass/fail clearance, question difficulty and discrimination, activity trends, and at-risk student drill-downs.
- Query-backed loading, zero-data, retryable error, and responsive chart states across analytics views.
- Production bundle chunking, a root error boundary, mobile exam-room palette controls, printable result reports, and server security hardening checks.
- Responsive React layouts, mobile table cards, confirmation/form dialogs, and toast feedback.
- Idempotent analytics seed with one admin, three teachers, 60 students, three batches, four subjects, six ended exams, 300+ graded attempts, and live/upcoming/draft examples.

Deployment and final documentation/demo rehearsal belong to the remaining phases.

## Setup

Requires Node 20.19+ (Node 22.12+ recommended) and MongoDB.

1. Run `npm install` in the repository root.
2. Copy `server/.env.example` to `server/.env`.
3. Set `MONGO_URI` and replace `JWT_SECRET` with a random secret of at least 32 characters.
4. Run `npm run seed`.
5. Run `npm run dev`, then open http://127.0.0.1:5173.

Vite proxies `/api` to the Express server on port 5000. In production, Express serves `client/dist` from the same origin.

## Demo accounts

The seed creates these local development accounts:

| Role    | Email                    | Password      |
| ------- | ------------------------ | ------------- |
| Admin   | `admin@exampulse.dev`    | `Admin@123`   |
| Teacher | `teacher1@exampulse.dev` | `Teacher@123` |
| Student | `student@exampulse.dev`  | `Student@123` |

Seed credentials are for local/demo use only.

## Commands

- `npm run dev`: run API and frontend with reload.
- `npm run seed`: create missing demo records without deleting data.
- `npm run seed -- -- --reset`: clear ExamPulse collections and rebuild demo records.
- `npm test`: run server and client tests.
- `npm run lint`: run ESLint across both workspaces.
- `npm run build`: create the production frontend bundle.
- `npm start`: run the API and serve the built client when `NODE_ENV=production`.

## Architecture

The backend follows routes → controllers → services → models. Controllers shape HTTP responses; services own business rules such as student batch requirements, last-admin protection, and guarded deletion. API responses use `{ success, data, meta? }` and `{ success: false, error }` envelopes.

The client uses React Router for navigation, TanStack Query for server state, Axios with cookie credentials, and an authentication context for the active user. Feature APIs live under `client/src/features` and reusable controls under `client/src/components`.

See [the blueprint](docs/blueprint.md) for the full contract and [implementation progress](docs/progress.md) for verified phase details.

## Known dependency follow-up

`npm audit --omit=dev` currently reports two moderate React Router 6 advisories whose automated fix requires the React Router 7 migration. The complete audit also reports development-tool advisories in Tailwind 3 and Vitest 3. These upgrades are tracked for the hardening phase and must be resolved before public deployment.
