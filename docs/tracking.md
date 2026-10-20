# 📋 Mini ATS — Project Implementation & Progress Tracker (`tracking.md`)

> **Project:** Mini Applicant Tracking System (ATS) for EarlyJobs.ai  
> **Candidate Assignment:** Full Stack Developer Intern (Bengaluru Office)  
> **Primary Tech Stack:** Full MERN + TypeScript (React 18, Vite, Tailwind CSS, Node.js, Express, MongoDB Atlas, Mongoose)  
> **Target Effort:** ~6 Hours | **Single Source of Truth:** `docs/architecture.md`  
> **Status:** Phases 1–4 Verified & Implemented, Phase 5 Deployment Infrastructure Configured, Phase 6 Documentation & Video in Progress  

---

## ⏱️ Focused 6-Hour Execution Budget & Milestones

| Block | Planned Time | Output / Milestone | Status |
|---|---|---|---|
| **Block 1** | 0:00 – 0:30 (30m) | Monorepo scaffolding, TypeScript configs, env validation, Mongoose connect & `/api/health`, Playwright E2E scaffold | ✅ Completed & Verified |
| **Block 2** | 0:30 – 2:15 (1h 45m) | API endpoints, Zod schemas, single-query facet aggregation, 10 integration tests passing | ✅ Completed & Verified |
| **Block 3** | 2:15 – 4:00 (1h 45m) | Candidate directory table, modal form, 409 stale-state toast, instant stage updater | ✅ Completed & Verified |
| **Block 4** | 4:00 – 4:45 (45m) | Recruiter dashboard KPI cards, Recharts pipeline chart, candidate audit drawer | ✅ Completed & Verified |
| **Block 5** | 4:45 – 5:30 (45m) | Production deployment configs (Render blueprint + Vercel rewrite), CORS security, CLI seeding script, Playwright E2E verification | 🟡 Ready for Cloud Account Provisioning |
| **Block 6** | 5:30 – 6:00 (30m) | Professional README with architecture diagrams, setup guide, and 60–90s demo video recording | ⏳ Pending |

---

## 🎯 Scope Protection & Cut List (Guaranteed Timely Delivery)
- ✅ **Included (P0):**
  - Full candidate CRUD with strict Zod validation.
  - Email normalization + unique database index with clean `409 Conflict`.
  - Atomic conditional stage transitions with required `currentStage` guard and 409 stale state toast.
  - Single-query `$facet` dashboard metric aggregation (Total, Active, Interview, Hired, stage distribution).
  - Debounced search (Name, Email, Position) with regex escaping and pagination.
  - Accessible Candidate Modal Form and Candidate Audit Drawer.
  - Safe external `resumeUrl` (whitelisted `http(s)://` only).
  - 5 core automated integration tests with `mongodb-memory-server` + Supertest.
  - Idempotent CLI seeding script with 35 realistic fictional candidates.
  - Live deployment on Render and Vercel.
- 🚫 **Explicitly Cut / Out of Scope (P2):**
  - Multi-part binary resume uploads and S3 cloud storage.
  - LLM prompt-injection parsing pipeline.
  - Complex drag-and-drop Kanban (replaced by clean, robust table + stage dropdown).
  - Client-side optimistic UI complexities (TanStack Query cache invalidation handles refetching cleanly).
  - Enterprise role-based authentication (documented as production design; sandbox mode used for demo).

---

## 🔬 Benchmark Comparison & Standout Features

| Feature | Typical Submissions | Our Standout Implementation |
|---|---|---|
| **Database** | SQLite (Vijay) or Supabase (Vijayan) | **Real MongoDB Atlas + Mongoose** matching EarlyJobs' exact MERN stack. |
| **Type Safety** | Pure JavaScript (Himanshu) | **100% Strict TypeScript** across client and server. |
| **Concurrency** | Blind overwrites / lost updates | **Atomic conditional updates with required `currentStage`** returning `409 Conflict` and UI refresh toast. |
| **Dashboard Metrics** | Hardcoded or 6 sequential queries | **Single-query `$facet` aggregation** with in-memory zero-filling. |
| **Testing** | Untested or mock tests | **5 critical integration tests** covering uniqueness, concurrency, no-op, ID syntax, and invariants. |
| **Security** | Unprotected endpoints or exposed secrets | **`trust proxy` rate limiting (600/15m)**, Helmet, regex escaping, CLI-only seeding. |
