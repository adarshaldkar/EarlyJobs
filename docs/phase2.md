# ⚙️ Phase 2: Backend REST Engine, Candidate Model & Core Integration Tests (`phase2.md`)

> **Phase:** 2 of 6  
> **Milestone:** Data Layer, Business Logic Engine & Automated Verification  
> **Target Timebox:** 1 Hour 45 Minutes  
> **Working Directory:** `server/`  
> **Status:** Approved with Review Revisions 🚀  

---

## 🎯 1. Phase 2 Objective & Core Deliverables

Phase 2 builds the core business engine of the Mini ATS. It establishes the Mongoose candidate schema with strict indexes, input validation through Zod, atomic conditional stage transitions, single-query dashboard aggregations, and an automated integration test suite that proves correctness before any UI code is written.

### Key Deliverables:
1. **Candidate Data Model (`server/src/models/Candidate.ts`)**:
   - Strict Mongoose schema with embedded `stageHistory` timeline (`from`, `to`, `changedAt`, `notes?`).
   - Lean indexes: Unique `{ email: 1 }`, Compound `{ stage: 1, createdAt: -1 }`, and Single `{ createdAt: -1 }`.
   - Index building via `Candidate.init()` called once during database boot and test setup.
2. **Validation Layer (`server/src/schemas/candidate.schema.ts`)**:
   - Zod schemas validating candidate creation, updates, and stage transitions.
   - Robust `new URL()` parsing validating `http:` and `https:` protocols for resume links.
   - Normalized emails (`.trim().toLowerCase()`).
   - Query parameter validation with allowlisted `sortBy` fields (`createdAt`, `name`, `experienceYears`) and bounded pagination (`limit` capped at 50).
   - Global ObjectId validator middleware covering all `:id` endpoints (`GET`, `PATCH`, `PATCH /stage`, `DELETE`).
3. **Candidate Service & Controllers**:
   - **`POST /api/candidates`**: Creates a candidate with initial `stageHistory` entry (`from: null, to: 'Applied'`), handles email collision (`409 DUPLICATE_EMAIL`).
   - **`GET /api/candidates`**: Paginated list with ReDoS-safe regex escaping for name/email search, stage filtering, and sorting.
   - **`GET /api/candidates/:id`**: Fetches single candidate with full stage history audit trail.
   - **`PATCH /api/candidates/:id`**: Updates profile fields (including email correction with unique index collision handling).
   - **`PATCH /api/candidates/:id/stage`**: Optimistic concurrency control requiring `currentStage`. Returns `409 STALE_STATE` if changed concurrently, or `200 OK` (no-op) if already in target stage and verified against DB.
   - **`DELETE /api/candidates/:id`**: Hard deletes candidate record.
4. **Dashboard Summary Aggregation (`GET /api/dashboard/summary`)**:
   - High-performance single-query MongoDB `$facet` aggregation computing total candidates, stage breakdown, active pipeline count, and recent 5 applicants without N+1 count queries.
   - In-memory zero-filling guaranteeing consistent numeric keys even when stages have 0 candidates.
5. **Metadata Endpoint (`GET /api/meta/stages`)**:
   - Returns the immutable list of hiring stages (`Applied`, `Screening`, `Interview`, `Offer`, `Hired`, `Rejected`) and their visual metadata.
6. **5 Critical Integration Tests (`server/tests/candidate.api.test.ts`)**:
   - Executed against `mongodb-memory-server` in Vitest:
     1. Duplicate email returns `409 Conflict` (`DUPLICATE_EMAIL`).
     2. Stale stage update returns `409 Conflict` (`STALE_STATE`).
     3. Same-stage transition returns `200 OK` without appending duplicate history when matching DB state; returns `409 STALE_STATE` if DB already changed.
     4. Malformed MongoDB ID returns `400 Bad Request` vs missing ID returns `404 Not Found` across endpoints.
     5. Mathematical dashboard invariant: $\text{Total} === \sum \text{stageCounts}$.

---

## 🏗️ 2. Architectural Decisions Frozen for Phase 2

1. **Optimistic Concurrency Strategy**:
   - The stage transition endpoint requires `{ currentStage, newStage, notes? }`.
   - If `currentStage === newStage`:
     - Service reads candidate from DB. If candidate's actual `stage === currentStage`, it's an authentic no-op $\rightarrow$ return `200 OK` with zero new history entries.
     - If candidate's actual stage is different from `currentStage`, client was stale $\rightarrow$ return `409 Conflict` (`STALE_STATE`).
     - If candidate not found $\rightarrow$ return `404 Not Found`.
   - If `currentStage !== newStage`:
     - Execution uses an atomic `findOneAndUpdate({ _id: id, stage: currentStage }, { $set: { stage: newStage }, $push: { stageHistory: { from: currentStage, to: newStage, changedAt: new Date(), notes } } }, { new: true })`.
     - If `null` returned, inspect whether candidate exists:
       - If exists $\rightarrow$ return `409 Conflict` with code `STALE_STATE`.
       - If not exists $\rightarrow$ return `404 Not Found` with code `CANDIDATE_NOT_FOUND`.
2. **Explicit Audit Trail**:
   - `stageHistory` entries explicitly track `{ from, to, changedAt, notes? }`.
3. **Email Editable with Uniqueness Guard**:
   - Candidates' emails can be corrected via `PATCH /api/candidates/:id`. Normalized with `.trim().toLowerCase()`.
   - Duplicate key collision (E11000) caught and mapped to `409 DUPLICATE_EMAIL`.
4. **ReDoS Defense in Search**:
   - Raw user input in `search` query parameter is sanitized using a regex escape helper before passing into MongoDB `$regex`:
     ```typescript
     export function escapeRegex(text: string): string {
       return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
     }
     ```
5. **Resume Link Validation**:
   - Validated via standard `new URL(val)` ensuring `parsed.protocol === 'http:' || parsed.protocol === 'https:'`.
6. **Standardized Response Envelope**:
   - Success: `{ "success": true, "data": ... }`
   - List Success: `{ "success": true, "data": { "items": [...], "pagination": { "total": 48, "page": 1, "limit": 10, "totalPages": 5 } } }`
   - Error: `{ "success": false, "error": { "code": "ERROR_CODE", "message": "Human-readable message" } }`

---

## 📋 3. Schema & Data Contracts

### 3.1 Candidate Mongoose Schema
```typescript
export interface IStageHistory {
  from: string | null;
  to: string;
  changedAt: Date;
  notes?: string;
}

export interface ICandidate {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  position: string;
  experienceYears: number;
  skills: string[];
  resumeUrl?: string;
  notes?: string;
  stage: 'Applied' | 'Screening' | 'Interview' | 'Offer' | 'Hired' | 'Rejected';
  stageHistory: IStageHistory[];
  createdAt: Date;
  updatedAt: Date;
}
```

### 3.2 Indexes
- `CandidateSchema.index({ email: 1 }, { unique: true });`
- `CandidateSchema.index({ stage: 1, createdAt: -1 });`
- `CandidateSchema.index({ createdAt: -1 });`

### 3.3 Zod Validation Rules
- `name`: String, 2–100 characters, trimmed.
- `email`: Valid email format, trimmed, lowercase.
- `phone`: Optional string, 7–20 characters.
- `position`: String, 2–100 characters, trimmed.
- `experienceYears`: Integer between 0 and 50.
- `skills`: Array of max 20 strings, each string trimmed and max 30 characters.
- `resumeUrl`: Optional string with valid `http:` or `https:` protocol.
- `notes`: Optional string, max 2,000 characters.
- `stage`: Enum matching `HIRING_STAGES`. Default: `'Applied'`.

---

## 🔌 4. API Endpoints Specification

### 1. `GET /api/candidates`
- **Query Params**:
  - `page`: Integer $\ge 1$ (default `1`)
  - `limit`: Integer between `1` and `50` (default `10`)
  - `search`: String (escaped, matches `name` or `email` case-insensitively)
  - `stage`: Enum filter (`Applied` | `Screening` | `Interview` | `Offer` | `Hired` | `Rejected` | `All`)
  - `sortBy`: `'createdAt'` | `'name'` | `'experienceYears'` (default `'createdAt'`)
  - `sortOrder`: `'asc'` | `'desc'` (default `'desc'`)

### 2. `POST /api/candidates`
- **Body**: `{ name, email, phone?, position, experienceYears, skills, resumeUrl?, notes?, stage? }`
- **Responses**:
  - `201 Created`: Returns newly created candidate document with initial `stageHistory` (`from: null, to: initialStage`).
  - `400 Bad Request`: Validation failure.
  - `409 Conflict`: Duplicate email (`DUPLICATE_EMAIL`).

### 3. `GET /api/candidates/:id`
- **Params**: `id` (24-character hexadecimal MongoDB ObjectId)
- **Responses**:
  - `200 OK`: Returns full candidate with populated `stageHistory`.
  - `400 Bad Request`: Malformed ObjectId syntax (`INVALID_ID`).
  - `404 Not Found`: Candidate not found (`CANDIDATE_NOT_FOUND`).

### 4. `PATCH /api/candidates/:id`
- **Body**: Partial candidate profile fields (`name`, `email`, `phone`, `position`, `experienceYears`, `skills`, `resumeUrl`, `notes`).
- **Responses**:
  - `200 OK`: Returns updated candidate document.
  - `400 Bad Request`: Malformed ID or validation failure.
  - `404 Not Found`: Candidate not found.
  - `409 Conflict`: Duplicate email collision.

### 5. `PATCH /api/candidates/:id/stage`
- **Body**: `{ "currentStage": "Screening", "newStage": "Interview", "notes": "Passed technical round" }`
- **Responses**:
  - `200 OK`: Stage updated atomically; new history item appended (`from: Screening, to: Interview`).
  - `400 Bad Request`: Malformed ID, missing `currentStage`, or invalid stage enum.
  - `404 Not Found`: Candidate not found.
  - `409 Conflict`: `STALE_STATE` (candidate is currently in another stage in the database).

### 6. `DELETE /api/candidates/:id`
- **Responses**:
  - `200 OK`: `{ "success": true, "data": { "message": "Candidate deleted successfully" } }`
  - `400 Bad Request`: Malformed ObjectId (`INVALID_ID`).
  - `404 Not Found`: Candidate not found.

### 7. `GET /api/dashboard/summary`
- **Description**: Computes metrics via single `$facet` query with in-memory zero-filling.
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "data": {
      "total": 35,
      "activePipeline": 28,
      "interviewing": 8,
      "hired": 3,
      "rejected": 4,
      "stageCounts": {
        "Applied": 12,
        "Screening": 8,
        "Interview": 8,
        "Offer": 0,
        "Hired": 3,
        "Rejected": 4
      },
      "recentCandidates": [ ... ]
    }
  }
  ```

### 8. `GET /api/meta/stages`
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "data": [
      { "id": "Applied", "label": "Applied", "color": "#64748B" },
      { "id": "Screening", "label": "Screening", "color": "#D97706" },
      { "id": "Interview", "label": "Interview", "color": "#2563EB" },
      { "id": "Offer", "label": "Offer", "color": "#7C3AED" },
      { "id": "Hired", "label": "Hired", "color": "#059669" },
      { "id": "Rejected", "label": "Rejected", "color": "#DC2626" }
    ]
  }
  ```

---

## 🧪 5. The 5 Automated Integration Tests Specification

The test suite runs in `server/tests/candidate.api.test.ts` via Vitest against an isolated in-memory MongoDB instance (`mongodb-memory-server`), ensuring `Candidate.init()` completes before testing:

| Test # | Test Name | Invariant Checked | Expected Result |
|---|---|---|---|
| **Test 1** | Duplicate Email Rejection | Unique index and service layer conflict check | Second `POST` with `test@example.com` returns `409` with code `DUPLICATE_EMAIL`. |
| **Test 2** | Concurrency Conflict Detection | Atomic conditional stage transition | Two simultaneous `Promise.all` PATCH stage requests with same `currentStage`: exactly one succeeds `200`, one fails `409 STALE_STATE`. |
| **Test 3** | Same-Stage Verification & Stale No-Op | Verifies persisted DB state vs client | Submitting same stage returns `200 OK` (0 new history) if DB has that stage; returns `409 STALE_STATE` if DB already transitioned. |
| **Test 4** | ObjectId Validation Boundary Across Endpoints | Distinguishing syntax error from missing record | Any candidate endpoint with `invalid-id` returns `400 INVALID_ID`; non-existent valid ObjectId returns `404 CANDIDATE_NOT_FOUND`. |
| **Test 5** | Dashboard Aggregation Invariant | Mathematical consistency of metrics | After seeding varied candidates, verifies $\text{Total} === \sum \text{stageCounts}$, all 6 stages appear (even with 0), and $\text{Active Pipeline} === \text{Total} - (\text{Hired} + \text{Rejected})$. |

---

## 🛑 6. Phase 2 Exit Gates & Verification Checklist

- [ ] TypeScript compilation (`npm run build` in `server/`) succeeds with zero errors.
- [ ] All 5 integration tests in `candidate.api.test.ts` plus the 2 health check tests pass in Vitest (`7/7 passed`).
- [ ] `Candidate.init()` builds indexes on MongoDB connection without throwing errors.
- [ ] Atomic concurrency test passes reliably under parallel execution.
- [ ] Clean git commit made with scope limited to backend engine and tests.
