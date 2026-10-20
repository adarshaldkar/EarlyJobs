# ⏱️ Mini ATS — Execution Phases & Deliverables Roadmap (`phases.md`)

> **Project:** Mini Applicant Tracking System (ATS) for EarlyJobs.ai  
> **Total Time Budget:** ~6 Hours (Structured into 6 Focused Phases)  
> **Target:** Production-grade, threat-modeled MERN ATS deployed on Vercel & Render with 3-tier testing (Vitest, Supertest, Playwright)  

---

## 🗺️ Phases Overview at a Glance

| Phase | Milestone Name | Allocated Time | Core Output | Testing Gate |
|---|---|---|---|---|
| **Phase 1** | Scaffolding, Health Check & E2E Setup | **30 mins** | Monorepo setup, TypeScript configs, MongoDB connect, working `/api/health`, Playwright configured | `GET /api/health` 200/503 Vitest passing |
| **Phase 2** | Backend REST Engine & Core Tests | **1h 45m** | Full candidate CRUD, Zod schemas, single-query aggregation, atomic stage updates | 7 Vitest + Supertest integration tests passing |
| **Phase 3** | Candidate Directory & Modal Form | **1h 45m** | Compact Ashby-style table, debounced search, stage dropdown, Add Candidate modal, 409 toast | Playwright `candidate-validation.spec.ts` |
| **Phase 4** | Recruiter Dashboard & Audit Drawer | **45 mins** | 4 Dynamic KPI cards, Recharts funnel chart, recent applicants, stage audit drawer | Playwright `candidate-workflow.spec.ts` & `responsive-layout.spec.ts` |
| **Phase 5** | Cloud Deployment & Seeding | **45 mins** | Live on Render & Vercel, MongoDB Atlas connected, 35 realistic seed records populated | Full `npm run test:e2e` execution against staging |
| **Phase 6** | Documentation & Demo Video | **30 mins** | Comprehensive README, API docs, trade-offs writeup, 60–90s demo video walkthrough | All submission deliverables verified |

---

## 🛠️ Detailed Phase Breakdown

### 📦 Phase 1: Scaffolding, Architecture & Health Check (30 mins) — ✅ COMPLETED
* **Goal:** Initialize client, server, and end-to-end testing projects with strict TypeScript and verify system health.
* **Tasks:**
  1. Initialize root monorepo `package.json` with scripts: `install:all`, `dev`, `build`, `test`, `test:e2e`, `start`.
  2. Setup `server/` with Express, TypeScript, Helmet, CORS, and `express-rate-limit`.
  3. Configure MongoDB Atlas connection lifecycle with fast-fail `serverSelectionTimeoutMS: 5000`.
  4. Implement `GET /api/health` checking `mongoose.connection.readyState === 1`.
  5. Setup `client/` with Vite, React 18, TypeScript, Tailwind CSS, and IBM Plex Sans.
  6. **Playwright E2E Setup**: Install `@playwright/test`, install Chromium engine, configure `playwright.config.ts`, create `e2e/` scaffold.
* **Exit Gate:** Server boots on `http://localhost:5000/api/health` returning `200 OK`; health test passes in Vitest.

---

### ⚙️ Phase 2: Backend REST Engine & Automated Tests (1h 45 mins) — ✅ COMPLETED
* **Goal:** Implement the authoritative business logic, aggregation pipeline, and verification test suite.
* **Tasks:**
  1. Define Mongoose `Candidate` model with indexes:
     - `{ email: 1 }` (unique)
     - `{ stage: 1, createdAt: -1 }` (compound)
     - `{ createdAt: -1 }` (recent/sorting)
     - `stageHistory` audit trail: `{ from, to, changedAt, notes? }`.
  2. Implement Zod validation schemas for candidates, query params (`sortBy` allowlist), and safe `http(s)://` resume links via `new URL()`.
  3. Implement candidate CRUD endpoints with global ObjectId validation middleware:
     - `GET /api/candidates` (pagination, debounced regex-escaped search, stage filter).
     - `POST /api/candidates` (email normalization, duplicate detection).
     - `GET /api/candidates/:id` (single candidate + audit trail).
     - `PATCH /api/candidates/:id` (profile edits + email correction).
     - `PATCH /api/candidates/:id/stage` (atomic conditional update requiring `currentStage`, same-stage DB state check, 409 stale detection).
     - `DELETE /api/candidates/:id` (hard delete).
  4. Implement single-query `$facet` dashboard summary endpoint (`GET /api/dashboard/summary`) with guaranteed zero-filling of all 6 stages.
  5. Implement metadata endpoint (`GET /api/meta/stages`).
  6. Write and run the **5 Critical Integration Tests** using Vitest + Supertest (`candidate.api.test.ts`).
* **Exit Gate:** All 7 automated tests pass (2 health + 5 candidate integration tests) in Vitest; server builds cleanly.

---

### 👥 Phase 3: Candidate Directory & Form Workflow (1h 45 mins) — ⏳ READY
* **Goal:** Deliver the primary recruiter workspace with high information density (Ashby/Linear style) and browser validation tests.
* **Tasks:**
  1. Setup TanStack Query API client with Axios envelope handling and type-safe hooks.
  2. Build Candidate Directory Table:
     - Compact table with subtle borders and clear column alignments.
     - Candidate initials avatar, Full Name, Email, Position, Experience badge, Date Applied.
     - Semantic stage chips with quick stage dropdown selector.
     - 409 conflict detection toast: *"Candidate was updated by another session. Refreshed."*
  3. Build Search & Filter Toolbar:
     - Real-time debounced search across Name, Email, and Position.
     - Stage filter pills (`All`, `Applied`, `Screening`, `Interview`, `Offer`, `Hired`, `Rejected`).
     - Clean empty state with 1-click **"Reset Filters"**.
  4. Build Add Candidate Modal:
     - Accessible dialog with programmatic labels, focus trapping, and keyboard support.
     - React Hook Form + Zod validation with inline error messages.
     - Submit button with loading spinner preventing rapid double-clicks.
  5. **Playwright E2E Test Suite (`e2e/candidate-validation.spec.ts`)**:
     - Tests invalid candidate form submissions (empty name/position, invalid email, negative experience).
     - Verifies inline validation messages and submit-button disabling.
     - Verifies duplicate email submission displays `409 Conflict` error toast in UI.
* **Exit Gate:** A recruiter can create a candidate, search for them, change their stage, and see immediate UI feedback without page reloads; Playwright validation spec passes.

---

### 📊 Phase 4: Recruiter Dashboard & Candidate Detail Drawer (45 mins) — ⏳ PENDING
* **Goal:** Provide real-time hiring metrics, individual candidate audit trails, and end-to-end recruiter workflow verification.
* **Tasks:**
  1. Build 4 Live KPI Cards (Total Candidates, Active Pipeline, In Interview, Hired) with subtle neutral cards and clean typography.
  2. Build Pipeline Funnel Chart (Recharts horizontal distribution bar chart with zero-filled stages).
  3. Build Recent Applicants widget showing the 5 latest candidates with instant stage changers.
  4. Build Candidate Detail Slide-Over Drawer:
     - Candidate dossier: contact links (with safe `http(s)://` external resume URL), skills chips, and recruiter notes.
     - **Chronological Stage History Timeline:** Visual audit log of all stage transitions (`Applied` ➔ `Screening` ➔ etc.) with timestamps.
  5. **Playwright E2E Recruiter Workflow Test (`e2e/candidate-workflow.spec.ts`)**:
     - Opens dashboard and verifies initial metrics load.
     - Creates candidate via modal.
     - Searches for candidate in directory.
     - Moves candidate from `Applied` ➔ `Interview`.
     - Confirms dashboard KPI cards and funnel chart update in real time.
     - Refreshes browser to verify state persistence.
  6. **Playwright Responsive Layout Test (`e2e/responsive-layout.spec.ts`)**:
     - Verifies layout adaptations at mobile (375px) vs desktop (1280px).
* **Exit Gate:** Creating or moving a candidate instantly recalculates all dashboard metric cards and charts in real time; Playwright workflow spec passes.

---

### 🚀 Phase 5: Cloud Deployment & Idempotent Seeding (45 mins) — ⏳ PENDING
* **Goal:** Deploy the application early to catch and resolve any cloud environment issues, gating release with Playwright.
* **Tasks:**
  1. Build safe CLI seeding script (`server/src/scripts/seed.ts`) populating **35 realistic fictional candidates** across all 6 stages (idempotent upserts).
  2. Setup MongoDB Atlas database with secure dedicated user credentials.
  3. Deploy Backend API to **Render**:
     - Environment variables: `PORT=5000`, `NODE_ENV=production`, `MONGODB_URI`, `CLIENT_ORIGIN`.
     - Test `https://<render-app>.onrender.com/api/health`.
  4. Deploy Frontend to **Vercel**:
     - Environment variable: `VITE_API_BASE_URL=https://<render-app>.onrender.com/api`.
     - Configure `vercel.json` SPA rewrite rules.
  5. **Automated E2E Acceptance Gate**:
     - Run `npm run test:e2e` against the staging/preview environment to verify complete browser workflow before marking deployment complete.
* **Exit Gate:** Live Vercel frontend connects seamlessly to live Render backend with persistent MongoDB Atlas data, verified by passing E2E tests.

---

### 📝 Phase 6: Documentation, README & Demo Video (30 mins) — ⏳ PENDING
* **Goal:** Package the repository with senior-grade documentation and a crisp demo video.
* **Tasks:**
  1. Write production **`README.md`**:
     - Project overview, Live App URL, and GitHub Repo links.
     - Architecture diagram, testing strategy (Vitest, Supertest, Playwright), and folder structure.
     - Local installation & startup guide (`npm run install:all`, `npm run dev`, `npm run test`, `npm run test:e2e`).
     - Documented **Design Decisions & Trade-offs** (atomic conditional concurrency, single-query facet aggregation, open demo policy, out-of-scope resume upload threat model).
     - API contracts summary and environment variable table.
  2. Record 60–90 second demo video:
     - 0:00–0:15: Dashboard overview & real-time metrics.
     - 0:15–0:35: Candidate table, search, and Add Candidate form.
     - 0:35–0:55: Duplicate email rejection & stage transition.
     - 0:55–1:15: Candidate drawer with stage audit timeline & live dashboard metric recalculation.
     - 1:15–1:30: Summary of live deployment and architecture.
* **Exit Gate:** All submission links (Live URL, GitHub Repo, Demo Video, Google Form) verified and ready for submission.
