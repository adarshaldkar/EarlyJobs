# ⏱️ Mini ATS — Execution Phases & Deliverables Roadmap (`phases.md`)

> **Project:** Mini Applicant Tracking System (ATS) for EarlyJobs.ai  
> **Total Time Budget:** ~6 Hours (Structured into 6 Focused Phases)  
> **Target:** Production-grade, threat-modeled MERN ATS deployed on Vercel & Render  

---

## 🗺️ Phases Overview at a Glance

| Phase | Milestone Name | Allocated Time | Core Output |
|---|---|---|---|
| **Phase 1** | Scaffolding & Health Check | **30 mins** | Monorepo setup, TypeScript configs, MongoDB connect, working `GET /api/health` |
| **Phase 2** | Backend REST Engine & Core Tests | **1h 45m** | Full candidate CRUD, Zod schemas, single-query aggregation, 5 critical tests passing |
| **Phase 3** | Candidate Directory & Modal Form | **1h 45m** | Compact Ashby-style table, debounced search, stage dropdown, Add Candidate modal, 409 toast |
| **Phase 4** | Recruiter Dashboard & Audit Drawer | **45 mins** | 4 Dynamic KPI cards, Recharts funnel chart, recent applicants, stage audit drawer |
| **Phase 5** | Cloud Deployment & Seeding | **45 mins** | Live on Render & Vercel, MongoDB Atlas connected, 35 realistic seed records populated |
| **Phase 6** | Documentation & Demo Video | **30 mins** | Comprehensive README, API docs, trade-offs writeup, 60–90s demo video walkthrough |

---

## 🛠️ Detailed Phase Breakdown

### 📦 Phase 1: Scaffolding, Architecture & Health Check (30 mins)
* **Goal:** Initialize both client and server projects with strict TypeScript and verify system health.
* **Tasks:**
  1. Initialize root monorepo `package.json` with scripts: `install:all`, `dev`, `build`, `test`, `seed`, `start`.
  2. Setup `server/` with Express, TypeScript, Helmet, CORS, and `express-rate-limit`.
  3. Configure MongoDB connection lifecycle with `createIndexes()` / `Candidate.init()`.
  4. Implement `GET /api/health` checking `mongoose.connection.readyState === 1`.
  5. Setup `client/` with Vite, React 18, TypeScript, Tailwind CSS, and Inter typography.
* **Exit Gate:** Server boots on `http://localhost:5000/api/health` returning `200 OK` `{ "status": "healthy", "database": "connected" }`.

---

### ⚙️ Phase 2: Backend REST Engine & Automated Tests (1h 45 mins)
* **Goal:** Implement the authoritative business logic, aggregation pipeline, and verification test suite.
* **Tasks:**
  1. Define Mongoose `Candidate` model with indexes:
     - `{ email: 1 }` (unique)
     - `{ stage: 1, createdAt: -1 }` (compound)
     - `{ createdAt: -1 }` (recent/sorting)
  2. Implement Zod validation schemas for candidates, query params (`sortBy` allowlist), and safe `http(s)://` resume links.
  3. Implement candidate CRUD endpoints:
     - `GET /api/candidates` (pagination, debounced regex-escaped search, stage filter).
     - `POST /api/candidates` (email normalization, 200 candidate cap, duplicate detection).
     - `GET /api/candidates/:id` (single candidate + audit trail).
     - `PATCH /api/candidates/:id` (profile edits).
     - `PATCH /api/candidates/:id/stage` (atomic conditional update requiring `currentStage`).
     - `DELETE /api/candidates/:id` (hard delete).
  4. Implement single-query `$facet` dashboard summary endpoint (`GET /api/dashboard/summary`).
  5. Implement metadata endpoint (`GET /api/meta/stages`).
  6. Write and run the **5 Critical Integration Tests** using Vitest + Supertest:
     - Duplicate email returns `409 Conflict`.
     - Stale stage update returns `409 Conflict`.
     - Same-stage transition returns `200 OK` with zero duplicate history.
     - Malformed ID returns `400 Bad Request` vs missing ID `404 Not Found`.
     - Dashboard invariant: $Total = \sum stageCounts$.
* **Exit Gate:** All 5 automated integration tests pass in terminal.

---

### 👥 Phase 3: Candidate Directory & Form Workflow (1h 45 mins)
* **Goal:** Deliver the primary recruiter workspace with high information density (Ashby/Linear style).
* **Tasks:**
  1. Setup TanStack Query API client with Axios envelope handling.
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
* **Exit Gate:** A recruiter can create a candidate, search for them, change their stage, and see immediate UI feedback without page reloads.

---

### 📊 Phase 4: Recruiter Dashboard & Candidate Detail Drawer (45 mins)
* **Goal:** Provide real-time hiring metrics and individual candidate audit trails.
* **Tasks:**
  1. Build 4 Live KPI Cards (Total Candidates, Active Pipeline, In Interview, Hired) with subtle neutral cards and clean typography.
  2. Build Pipeline Funnel Chart (Recharts horizontal distribution bar chart with zero-filled stages).
  3. Build Recent Applicants widget showing the 5 latest candidates with instant stage changers.
  4. Build Candidate Detail Slide-Over Drawer:
     - Candidate dossier: contact links (with safe `http(s)://` external resume URL), skills chips, and recruiter notes.
     - **Chronological Stage History Timeline:** Visual audit log of all stage transitions (`Applied` ➔ `Screening` ➔ etc.) with timestamps.
* **Exit Gate:** Creating or moving a candidate instantly recalculates all dashboard metric cards and charts in real time.

---

### 🚀 Phase 5: Cloud Deployment & Idempotent Seeding (45 mins)
* **Goal:** Deploy the application early to catch and resolve any cloud environment issues.
* **Tasks:**
  1. Build safe CLI seeding script (`server/src/scripts/seed.ts`) populating **35 realistic fictional candidates** across all 6 stages (idempotent upserts).
  2. Setup MongoDB Atlas database with secure dedicated user credentials.
  3. Deploy Backend API to **Render**:
     - Environment variables: `PORT=5000`, `NODE_ENV=production`, `MONGODB_URI`, `CLIENT_ORIGIN`.
     - Test `https://<render-app>.onrender.com/api/health`.
  4. Deploy Frontend to **Vercel**:
     - Environment variable: `VITE_API_BASE_URL=https://<render-app>.onrender.com/api`.
     - Configure `vercel.json` SPA rewrite rules.
  5. Run end-to-end sanity test on the live production URL from a clean private browser window.
* **Exit Gate:** Live Vercel frontend connects seamlessly to live Render backend with persistent MongoDB Atlas data.

---

### 📝 Phase 6: Documentation, README & Demo Video (30 mins)
* **Goal:** Package the repository with senior-grade documentation and a crisp demo video.
* **Tasks:**
  1. Write production **`README.md`**:
     - Project overview, Live App URL, and GitHub Repo links.
     - Architecture diagram and folder structure.
     - Local installation & startup guide (`npm run install:all`, `npm run dev`, `npm run seed`).
     - Documented **Design Decisions & Trade-offs** (hard delete vs soft delete, Candidate/Application MVP simplification, open demo policy, out-of-scope resume upload threat model).
     - API contracts summary and environment variable table.
  2. Record 60–90 second demo video:
     - 0:00–0:15: Dashboard overview & real-time metrics.
     - 0:15–0:35: Candidate table, search, and Add Candidate form.
     - 0:35–0:55: Duplicate email rejection & stage transition.
     - 0:55–1:15: Candidate drawer with stage audit timeline & live dashboard metric recalculation.
     - 1:15–1:30: Summary of live deployment and architecture.
* **Exit Gate:** All submission links (Live URL, GitHub Repo, Demo Video, Google Form) verified and ready for submission.
