# 🧠 Mini ATS — Master Engineering Strategy & Architecture Blueprint (`brain.md`)

> **Project:** Mini Applicant Tracking System (ATS)  
> **Company:** EarlyJobs.ai (Full Stack Developer Intern Assignment)  
> **Core Stack:** MERN + TypeScript (React 18, Vite, Node.js, Express, MongoDB Atlas, Mongoose, Tailwind CSS)  
> **Target:** Robust, threat-modeled, production-deployable recruitment platform  

---

## 1. 🏛️ Core Engineering Approach & Explicit Scope Decisions

### A. Access Policy & Blueprint Authority
* **Single Source of Truth:** System architecture, database constraints, API envelopes, and concurrency rules are authoritatively defined in [`docs/architecture.md`](file:///c:/Users/shrut/Desktop/EarlyJobs/docs/architecture.md).
* **Assessment Decision:** Built as a **High-Fidelity Public Recruiter Demo** using 100% fictional seed records (no real PII).
* **Destructive Endpoint Protection:** Destructive wipe/reset endpoints are completely removed from public HTTP routes. Seeding is executed strictly via local CLI command (`npm run seed`).
* **Production Path (Documented in Architecture):** JWT/Session-based authentication, RBAC (`Admin`, `Recruiter`, `Hiring Manager`), and audit logging (`changedBy: userId`).

### B. Entity Modeling: Candidate vs. Application
* **Assessment MVP Simplification:** A unified `Candidate` document containing the candidate's active application fields (`position`, `experienceYears`, `skills`, `stage`, `stageHistory`).
* **Production Multi-Application Design (Documented in Docs):** Separation into `Candidate` (identity, email, phone) and `Application` (candidateId, jobOpeningId, resumeVersion, stage, stageHistory) to support candidates applying to multiple openings over time.

---

## 2. 🛡️ Threat Model & Edge-Case Protection Strategy

| Risk Category | Threat / Edge Case | Architectural Defense |
|---|---|---|
| **Data Integrity** | Case/whitespace variants of duplicate emails (`John@test.com` vs `john@test.com `) | Canonical field `email` is strictly normalized with `.trim().toLowerCase()` in services & schema. Protected by a MongoDB unique index. Returns standard `409 Conflict`. |
| **Security** | ReDoS / Regex Injection via search input (`?search=(*` or huge strings) | Server-side sanitizer escapes all regex metacharacters (`.*+?^${}()|[]\`) before building queries. Search strings are capped at 100 characters. |
| **Validation** | Malformed payloads or invalid stage values bypassed via direct API calls | Strict schema validation at the HTTP boundary using **Zod**. Rejects invalid enums, negative experience, and blank names with `400 Bad Request`. |
| **Reliability** | Redundant stage clicks creating duplicate history | Idempotent stage transitions: if `candidate.stage === requestedStage`, the controller returns `200 OK` without appending duplicate history. |
| **Concurrency** | Recruiter clicks "Save" twice in rapid succession | Client disables submit buttons with loading spinners; database unique index prevents duplicate email inserts. |
| **Database Readiness** | API process starts but MongoDB connection drops / fails | Health check (`GET /api/health`) verifies `mongoose.connection.readyState === 1`. Returns `503 Service Unavailable` if database is disconnected. |
| **Dashboard Math** | Zero candidate records or zero hires causing `0 / 0` | Mathematical guardrails: checks avoid division by zero; conversion percentages default to `0%` and handle empty collections safely without `NaN` or crashes. |
| **Output Safety** | Stored XSS via candidate notes or fields | React auto-escapes rendered text; notes are stored and rendered strictly as plaintext strings. |

---

## 3. 📂 Monorepo Architecture & Folder Structure

```
EarlyJobs/
├── client/                               # Frontend Application (Vite + React + TS)
│   ├── src/
│   │   ├── app/
│   │   │   ├── App.tsx                   # Main recruiter shell & tabs
│   │   │   └── router.tsx                # Client-side routing
│   │   ├── components/
│   │   │   ├── layout/                   # Header, Navigation, LiveDbIndicator
│   │   │   └── shared/                   # LoadingState, ErrorState, EmptyState, ConfirmDialog
│   │   ├── features/
│   │   │   ├── dashboard/                # MetricCards, PipelineChart, RecentCandidates, dashboard.api.ts
│   │   │   └── candidates/               # CandidateTable, CandidateForm, CandidateDrawer, StageBadge, candidates.api.ts
│   │   ├── hooks/                        # useDebounce, useCandidates, useDashboard
│   │   ├── lib/                          # api-client.ts (Axios envelope handling)
│   │   ├── constants/                    # stages.ts (Frontend stage definitions)
│   │   └── main.tsx
│   ├── .env.example
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── server/                               # Backend REST API (Node + Express + TS)
│   ├── src/
│   │   ├── config/                       # database.ts (Mongoose connection & lifecycle checks)
│   │   ├── constants/                    # stages.ts (Authoritative stage enum)
│   │   ├── controllers/                  # candidate.controller.ts, dashboard.controller.ts
│   │   ├── middleware/                   # validate-request.ts, error-handler.ts, not-found.ts
│   │   ├── models/                       # Candidate.ts (Mongoose schema, indexes, hooks)
│   │   ├── routes/                       # candidate.routes.ts, dashboard.routes.ts, meta.routes.ts
│   │   ├── schemas/                      # candidate.schema.ts, query.schema.ts (Zod validation)
│   │   ├── services/                     # candidate.service.ts, dashboard.service.ts
│   │   ├── scripts/                      # seed.ts (CLI candidate seeder)
│   │   ├── utils/                        # ApiError.ts, asyncHandler.ts, sanitizeRegex.ts
│   │   ├── app.ts                        # Express app configuration & middleware
│   │   └── server.ts                     # HTTP listener & database connection
│   ├── tests/                            # Vitest + Supertest integration tests
│   │   ├── candidates.test.ts
│   │   └── dashboard.test.ts
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── docs/                                 # Architecture diagrams & threat model documentation
│   ├── architecture.md
│   ├── brain.md
│   └── tracking.md
├── tracking.md                           # Progress tracker
├── package.json                          # Root monorepo script runner
└── README.md                             # Production documentation & submission guide
```

---

## 4. 🗄️ Database Design (`Candidate` Schema)

```typescript
export const HIRING_STAGES = [
  'Applied',
  'Screening',
  'Interview',
  'Offer',
  'Hired',
  'Rejected'
] as const;

export type HiringStage = typeof HIRING_STAGES[number];

export interface IStageEvent {
  from: HiringStage | null;
  to: HiringStage;
  changedAt: Date;
  changedBy?: string; // Prepared for authenticated recruiter identity
}

export interface ICandidate {
  _id: string;
  fullName: string;
  email: string;             // Canonical: lowercase, trimmed, unique index
  phone?: string;
  position: string;
  experienceYears: number;
  skills: string[];
  stage: HiringStage;
  source?: string;           // E.g. LinkedIn, Referral, Job Board, Direct
  resumeUrl?: string;        // Portfolio or document link
  notes?: string;
  stageHistory: IStageEvent[];
  createdAt: Date;
  updatedAt: Date;
}
```

### Essential Database Indexes:
```typescript
candidateSchema.index({ email: 1 }, { unique: true });
candidateSchema.index({ stage: 1 });
candidateSchema.index({ createdAt: -1 });
```

---

## 5. 🔌 Standardized API Specification & Envelope

### Standard Response Envelope:
```typescript
// Success Response
{
  "success": true,
  "data": { ... }
}

// Error Response
{
  "success": false,
  "error": {
    "code": "DUPLICATE_EMAIL",
    "message": "A candidate with this email already exists."
  }
}
```

### Endpoints Table:

| Method | Endpoint | Description | Status Codes |
|---|---|---|---|
| `GET` | `/api/health` | Verifies process and MongoDB connection (`readyState === 1`) | `200` (ready), `503` (DB down) |
| `GET` | `/api/meta/stages` | Authoritative list of valid hiring stages | `200` |
| `GET` | `/api/dashboard/summary` | Real-time counts (total, active, interview, hired, stage counts) | `200`, `500` |
| `GET` | `/api/candidates` | List with `?search=`, `?stage=`, `?page=`, `?limit=`, `?sortBy=`, `?sortOrder=` | `200`, `400` |
| `POST` | `/api/candidates` | Create candidate (validates body, normalizes email, prevents duplicates) | `201`, `400`, `409` |
| `GET` | `/api/candidates/:id` | Fetch single candidate & complete stage history timeline | `200`, `400` (bad ID), `404` |
| `PATCH` | `/api/candidates/:id` | Edit candidate details (name, phone, position, experience, skills, notes) | `200`, `400`, `404` |
| `PATCH` | `/api/candidates/:id/stage` | Update candidate stage (appends history, idempotent) | `200`, `400`, `404` |
| `DELETE` | `/api/candidates/:id` | Delete candidate | `200`, `400`, `404` |

*Note: Destructive seeding/resetting is executed via local CLI (`npm run seed`) to prevent exposing unauthenticated wipe endpoints in production.*

---

## 6. 🧪 Automated Test Plan (Vitest + Supertest)

Planned integration tests to verify the critical paths:

- [ ] **Creation & Uniqueness:**
  - Create valid candidate ➔ Returns `201 Created` with initialized `stageHistory`.
  - Create candidate with duplicate normalized email ➔ Returns `409 Conflict`.
  - Create candidate with invalid email or missing required fields ➔ Returns `400 Bad Request`.
- [ ] **Stage Progression & Idempotency:**
  - Move stage `Applied` ➔ `Interview` ➔ Returns `200 OK`, updates stage, and appends 1 history entry.
  - Move stage to the *same* stage ➔ Returns `200 OK` without appending duplicate history.
  - Move stage with invalid enum value (e.g. `"Accepted"`) ➔ Returns `400 Bad Request`.
- [ ] **Search & Injection Safety:**
  - Search with special regex characters (`?search=foo(bar)*[test]`) ➔ Does not crash; escapes regex safely.
  - Filter by `stage=Interview` ➔ Returns strictly candidates in the Interview stage.
- [ ] **Dashboard Aggregation:**
  - Compute metrics with empty database ➔ Returns zeros safely without `NaN` or crashes.
  - Metric consistency: `Total Candidates === sum(stageCounts)` and `Active Pipeline === Total - (Hired + Rejected)`.
- [ ] **System Readiness:**
  - `GET /api/health` returns `200` with status `connected` when MongoDB is up.

---

## 7. 💻 NPM Commands & Build Lifecycle

### Root Monorepo Commands:
```bash
# 1. Install all dependencies (client + server)
npm run install:all

# 2. Run local development (concurrent client & server)
npm run dev

# 3. Seed demo candidate data (safe CLI execution)
npm run seed

# 4. Run automated test suite
npm run test

# 5. Production build (typecheck + bundle)
npm run build

# 6. Production start
npm start
```

---

## 8. 🚀 Deployment Plan (Vercel + Render)

- **Backend (Render):**
  - Build command: `npm install && npm run build`
  - Start command: `node dist/server.js`
  - Environment variables: `PORT=5000`, `NODE_ENV=production`, `MONGODB_URI`, `CLIENT_ORIGIN`
- **Frontend (Vercel):**
  - Framework preset: `Vite`
  - Root directory: `client`
  - Build command: `npm run build`
  - Output directory: `dist`
  - Environment variable: `VITE_API_BASE_URL=https://<your-render-app>.onrender.com/api`
