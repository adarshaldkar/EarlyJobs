# 🏗️ Mini ATS — Product Engineering Specification & System Architecture (`architecture.md`)

> **Project:** Mini Applicant Tracking System (ATS)  
> **Company:** EarlyJobs.ai (Full Stack Developer Intern Assignment)  
> **Stack:** MERN + TypeScript (React 18, Vite, Node.js, Express, MongoDB Atlas, Mongoose, Tailwind CSS)  
> **Authority:** Single Source of Truth for System Architecture, Contracts & Constraints  

---

## 1. 🏛️ Core System Architecture & Verified Fixes

### A. Access Policy & Demo Boundary
- **Model:** Open recruiter sandbox environment using **100% fictional seed records** (no real candidate PII).
- **Public Endpoint Protection:**
  - `app.set('trust proxy', 1)` enabled for correct IP resolution behind Render / cloud reverse proxies.
  - Rate limiting via `express-rate-limit`: **600 requests per 15 minutes** (generous for debounced searches and live polling), with `/api/health` completely exempt.
  - Request body size capped at `10kb`.
  - Cap total stored candidates at **200 records** to prevent demo memory exhaustion.
- **Seeding & Reset:** Executed strictly via idempotent local CLI script (`npm run seed`) using email-based upserts. Zero destructive endpoints exposed to public HTTP routes.

### B. Concurrency, Stage Changes & 409 Stale Detection
- **Required Stage Guard:** The endpoint `PATCH /api/candidates/:id/stage` **strictly requires** `{ stage: HiringStage, currentStage: HiringStage }`.
- **Atomic Conditional Transition:**
  ```typescript
  const updated = await Candidate.findOneAndUpdate(
    { _id: id, stage: currentStage },
    { 
      $set: { stage: newStage }, 
      $push: { stageHistory: { from: currentStage, to: newStage, changedAt: new Date() } } 
    },
    { new: true }
  );

  if (!updated) {
    const existing = await Candidate.findById(id);
    if (!existing) {
      throw new ApiError(404, 'NOT_FOUND', 'Candidate not found');
    }
    if (existing.stage === newStage) {
      // Idempotent same-stage no-op
      return res.status(200).json({ success: true, data: existing });
    }
    // Concurrency conflict: Candidate was modified by another session
    throw new ApiError(409, 'STALE_STATE', `Candidate was moved to ${existing.stage} by another recruiter. Refreshing state.`);
  }
  ```
- **UI Conflict Toast:** When a `409 STALE_STATE` occurs, the UI displays a warning toast: *"This candidate was updated by another recruiter. Refreshed."* and automatically re-fetches the latest record.

### C. Authoritative Database Indexes & Verification
- **Lean Index Plan (No Redundant Indexes):**
  - `{ email: 1 }` (unique constraint)
  - `{ stage: 1, createdAt: -1 }` (compound index; also covers stage-only prefix queries)
  - `{ createdAt: -1 }` (recent candidates and default sorting)
- **Safe Production Initialization:**
  - We use `await Candidate.init()` / `createIndexes()` on startup (avoiding `syncIndexes()` which dangerously drops unmanaged indexes in production).
  - Server startup aborts with an explicit error if index creation fails.

### D. Safe External Links & Query Injection Defense
- **Resume URL Scheme Whitelist:**
  - Backend Zod schema validates that `resumeUrl` (if provided) strictly matches `^https?://`.
  - Frontend renders the link only if `parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:'`, completely blocking `javascript:` XSS vectors.
- **Query Parameter Coercion & Allowlist:**
  - `search` and `stage` are coerced to plain strings (preventing Express `qs` query object injection like `?stage[$ne]=x`).
  - `sortBy` is strictly allowlisted to `['createdAt', 'fullName', 'experienceYears']`. Unsupported sort keys trigger `400 Bad Request`.
  - Search input is escaped against regex metacharacters and capped at 100 characters.

### E. Unified Schema Parity (Zod ⬌ Mongoose)
- `fullName`: String, 2–100 chars, trimmed.
- `email`: String, valid email, trimmed, lowercase.
- `position`: String, 2–100 chars, trimmed.
- `experienceYears`: Integer between `0` and `50`.
- `skills`: Array of max 20 strings, each string trimmed and max 30 chars.
- `notes`: String, max 2,000 chars, rendered strictly as plaintext.

---

## 2. 📊 High-Performance Dashboard Aggregation

### Single-Query Aggregation (No Multiple countDocuments):
```typescript
const [stats] = await Candidate.aggregate([
  {
    $facet: {
      total: [{ $count: 'count' }],
      stageCounts: [{ $group: { _id: '$stage', count: { $sum: 1 } } }],
      recent: [{ $sort: { createdAt: -1 } }, { $limit: 5 }]
    }
  }
]);

// In-memory zero-fill for guaranteed consistent response
const stageCountsMap: Record<string, number> = {
  Applied: 0,
  Screening: 0,
  Interview: 0,
  Offer: 0,
  Hired: 0,
  Rejected: 0
};

stats.stageCounts.forEach((s: { _id: string; count: number }) => {
  stageCountsMap[s._id] = s.count;
});

const total = stats.total[0]?.count || 0;
const activePipeline = stageCountsMap.Applied + stageCountsMap.Screening + stageCountsMap.Interview + stageCountsMap.Offer;
const interviewing = stageCountsMap.Interview;
const hired = stageCountsMap.Hired;
```

---

## 3. 🔌 Standardized API Specification

### Response Envelope:
```typescript
// Single / Mutation
{ "success": true, "data": { ... } }

// Paginated List
{
  "success": true,
  "data": {
    "items": [ ... ],
    "pagination": { "total": 48, "page": 1, "limit": 10, "totalPages": 5 }
  }
}

// Error
{ "success": false, "error": { "code": "DUPLICATE_EMAIL", "message": "A candidate with this email already exists." } }
```

### Endpoints Table:
| Method | Endpoint | Status Codes | Description |
|---|---|---|---|
| `GET` | `/api/health` | `200`, `503` | Database readiness check (`readyState === 1`). Rate-limit exempt. |
| `GET` | `/api/meta/stages` | `200` | Authoritative list of valid hiring stages. |
| `GET` | `/api/dashboard/summary` | `200`, `500` | Single-query MongoDB facet aggregation metrics. |
| `GET` | `/api/candidates` | `200`, `400` | Paginated search, filter, and sorted candidate list. |
| `POST` | `/api/candidates` | `201`, `400`, `409` | Creates candidate, checks total cap (<200), enforces unique email. |
| `GET` | `/api/candidates/:id` | `200`, `400`, `404` | Single candidate profile with complete stage timeline. |
| `PATCH` | `/api/candidates/:id` | `200`, `400`, `404`, `409` | Edits details (re-validates email uniqueness if updated). |
| `PATCH` | `/api/candidates/:id/stage` | `200`, `400`, `404`, `409` | Optimistic concurrent stage transition with required `currentStage`. |
| `DELETE` | `/api/candidates/:id` | `200`, `400`, `404` | Hard deletes candidate after user confirmation. |

---

## 4. 🧪 The 5 Critical Automated Integration Tests

Using **Vitest + Supertest** and `mongodb-memory-server`:
1. **Duplicate Email 409:** Attempting to insert a candidate with an existing normalized email returns `409 Conflict`.
2. **Concurrency 409:** Running two parallel stage updates with the same initial `currentStage` (`Promise.all`) yields exactly one `200 OK` and one `409 Conflict`.
3. **Same-Stage No-Op:** Transitioning to the stored stage returns `200 OK` and appends zero extra history entries.
4. **ID Syntax 400 vs Missing 404:** Malformed ID (`invalid123`) returns `400 Bad Request`; non-existent valid ObjectId returns `404 Not Found`.
5. **Dashboard Mathematical Invariant:** Verifies that $\text{Total} === \sum \text{stageCounts}$ and $\text{Active Pipeline} === \text{Total} - (\text{Hired} + \text{Rejected})$.

---

## 5. 📂 Project Scaffolding & Build Lifecycle

```
EarlyJobs/
├── client/                     # Vite + React 18 + TS + Tailwind CSS
│   ├── src/
│   │   ├── features/
│   │   │   ├── dashboard/      # MetricCards, FunnelChart, RecentApplicants
│   │   │   └── candidates/     # CandidateTable, CandidateModal, CandidateDrawer, StageDropdown
│   │   ├── lib/api-client.ts   # Axios envelope client + TanStack Query hooks
│   │   └── ...
├── server/                     # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── config/database.ts  # Mongoose connection & init()
│   │   ├── routes/             # REST endpoints
│   │   ├── controllers/        # Request handling & envelope responses
│   │   ├── services/           # Aggregations, conditional updates & business logic
│   │   ├── models/Candidate.ts # Schema, indexes & stageHistory
│   │   └── server.ts           # Express listener, Helmet, trust proxy & rate limiting
│   ├── tests/api.test.ts       # 5 core integration tests
│   └── src/scripts/seed.ts     # Safe idempotent CLI seeder
└── docs/architecture.md        # Single Source of Truth
```
