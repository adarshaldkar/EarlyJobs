# 🧪 Comprehensive Testing & Smoke-Test Strategy (`testing.md`)

> **Project:** Mini Applicant Tracking System (ATS) for EarlyJobs.ai  
> **Testing Strategy:** Multi-Tier Reliability Stack (Vitest + Supertest + Playwright + Smoke Gates)  
> **Status:** Active & Integrated  

---

## 🏗️ 1. The Multi-Tier Testing Pyramid

Our testing architecture balances speed, isolation, and end-to-end recruiter workflow validation:

| Layer | Tool | What it Proves | When to Run | Pass/Fail Criteria |
|---|---|---|---|---|
| **Unit** | Vitest | Zod schemas, URL sanitization, regex escaping, and calculations | During local development | Pure functions return expected values on valid/invalid inputs. |
| **Integration** | Vitest + Supertest + MongoMemoryServer | REST routes, concurrency races, unique indexes, database state, error envelopes | After backend changes (`npm test` in `server/`) | All 7 tests pass (2 health + 5 critical candidate tests). |
| **End-to-End (E2E)** | Playwright (Chromium) | Complete browser-driven recruiter workflows across frontend, API, and database | After UI integration (`npm run test:e2e`) | Real browser navigates, mutates data, verifies UI/chart updates, and cleans up. |
| **Smoke** | HTTP checks + Browser Walkthrough | Deployed production services are reachable, configured, and operational | Post-deployment on Render/Vercel | 7/7 checks on the Deployment Smoke Checklist pass. |
| **Regression** | Vitest + Playwright | Previously fixed edge cases and features remain intact | Before every Git push | Zero regressions across unit, API, and browser suites. |
| **Acceptance** | Human Walkthrough | Usability, Ashby/Linear aesthetics, accessibility, 375px mobile responsiveness | Final submission check | Meets all 17 MVP requirements on live staging URL. |

---

## 💨 2. Production Smoke-Test Checklist (7-Point Gate)

Run these checks immediately after deploying to Render and Vercel (target: 5–10 minutes):

- [ ] **1. Frontend Loads**: The deployed Vercel URL opens cleanly with zero white screens, runtime script crashes, or CSS bundle failures.
- [ ] **2. Backend Health**: `GET https://<api-domain>/api/health` returns `200 OK` with `{ success: true, data: { status: "healthy", database: "connected" } }`.
- [ ] **3. Metadata Resolves**: `GET https://<api-domain>/api/meta/stages` returns the 6 canonical hiring stages with design tokens.
- [ ] **4. Dashboard Aggregation Operational**: `GET https://<api-domain>/api/dashboard/summary` returns valid numeric metrics and zero-filled stages.
- [ ] **5. Candidate Directory Populated**: `GET https://<api-domain>/api/candidates?page=1&limit=10` responds successfully and the UI table displays rows.
- [ ] **6. Safe Mutation Check**: On staging (or using a dedicated fictional email `smoketest.<uuid>@example.com`), create a candidate, confirm they appear in the directory table, and delete them cleanly.
- [ ] **7. Production CORS & Security Headers**: DevTools Network tab shows `Access-Control-Allow-Origin` matches the Vercel frontend, and Helmet security headers are present.

---

## 🎭 3. Playwright E2E Test Specifications (`e2e/`)

Playwright verifies the integrated application from the perspective of an active recruiter.

### 🧪 E2E Test 1: Complete Recruiter Journey (`e2e/candidate-workflow.spec.ts`)
*Priority: P0 — Mandatory before final submission.*
1. **Initial State**: Navigate to dashboard; record the initial Total and Applied metrics.
2. **Creation**: Open Add Candidate modal, fill fictional persona (`Fictional Recruiter Test`, `e2e.test.<timestamp>@example.com`, `Full Stack Developer`, 3 years exp, `React, Node`), submit form.
3. **Table Verification**: Search for candidate in directory search bar; verify only the created candidate appears.
4. **Stage Transition**: Open stage dropdown on the table row; select `Interview`.
5. **Conflict-Free Update**: Verify table row stage chip updates immediately to `Interview`.
6. **Audit Trail Verification**: Click candidate row to open detail slide-over drawer; verify `stageHistory` displays:
   - Initial entry: `Applied`
   - Transition entry: `Applied` ➔ `Interview` with timestamp.
7. **Dashboard Metrics Propagation**: Navigate to dashboard; verify:
   - `In Interview` count incremented by 1.
   - Funnel chart renders updated bar for `Interview`.
8. **Persistence Across Reload**: Hard reload browser (`F5`); verify candidate remains in `Interview` stage.
9. **Teardown**: Click Delete Candidate button in drawer; confirm deletion dialog; verify row disappears and dashboard counts decrement cleanly.

### 🧪 E2E Test 2: Validation & Error Recovery (`e2e/candidate-validation.spec.ts`)
*Priority: P1 — Verifies human-centered usability and error boundaries.*
1. **Empty Form Rejection**: Open Add Candidate modal and click Submit without filling inputs; verify inline validation errors appear on Name, Email, Position, Experience.
2. **Invalid Email & Protocol Check**:
   - Enter `invalid-email-address` $\rightarrow$ verify inline error `"Invalid email address format"`.
   - Enter `javascript:alert(1)` in Resume URL $\rightarrow$ verify inline error `"resumeUrl must be a valid http: or https: URL"`.
3. **Duplicate Email Error Recovery**:
   - Create candidate `unique.e2e@example.com`.
   - Open modal again and enter `unique.e2e@example.com` $\rightarrow$ submit.
   - Verify server returns `409 Conflict` and UI displays error banner/toast: *"A candidate with this email address already exists"*.
   - Verify modal remains open and inputs are preserved so the recruiter does not lose their typed work.
4. **Stale Concurrency Simulation**:
   - Open candidate in two tabs (or mutate stage in background API call).
   - In frontend, attempt to move candidate from old stage $\rightarrow$ verify UI receives `409 STALE_STATE` toast: *"Candidate was updated in another session. Refreshed."*

---

## 🧪 4. The 5 Backend Integration Tests (`server/tests/candidate.api.test.ts`)

Executed via Vitest against an isolated `mongodb-memory-server`:
1. **Duplicate Email Rejection**: `POST` duplicate email returns `409 DUPLICATE_EMAIL`.
2. **Atomic Concurrency Conflict**: Parallel `Promise.all` stage updates return exactly one `200` and one `409 STALE_STATE`.
3. **Same-Stage Verification**: Genuine same-stage returns `200` (0 new history); out-of-band shifted stage returns `409 STALE_STATE`.
4. **ObjectId Boundary Validation**: Malformed ID returns `400 INVALID_ID` across all endpoints; missing valid ID returns `404 CANDIDATE_NOT_FOUND`.
5. **Dashboard Mathematical Invariant**: Proves $\text{Total} === \sum \text{stageCounts}$ and $\text{Active Pipeline} === \text{Total} - (\text{Hired} + \text{Rejected})$.
6. **Email Immutability**: `PATCH /api/candidates/:id` with `{ email }` returns `400 VALIDATION_ERROR`.

---

## 🔒 5. Test Data Isolation Rules

1. **Never use real applicant data**: All test records use designated fictional personas (e.g., `Aarav Patel`, `Priya Sharma`, `e2e.test.<uuid>@example.com`).
2. **Isolated in-memory test runner**: Vitest tests run against a disposable `mongodb-memory-server` that is torn down after the run.
3. **E2E Cleanup Hooks**: Playwright tests create unique records with timestamps and include `afterAll` / `afterEach` deletion cleanup to prevent demo data pollution.
4. **No Destructive Reset in Production**: No `/api/reset` or `flush` endpoints exist in the production API.
