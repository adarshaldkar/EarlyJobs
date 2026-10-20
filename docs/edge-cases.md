# 🛡️ Mini ATS — Comprehensive Edge-Case Matrix & Failure Defenses (`edge-cases.md`)

> **Project:** Mini Applicant Tracking System (ATS)  
> **Company:** EarlyJobs.ai (Full Stack Developer Intern Assignment)  
> **Purpose:** Exhaustive catalog of data, security, workflow, concurrency, and UI edge cases, their impact, and engineering defenses.

---

## 1. 📧 Data Integrity & Input Validation Edge Cases

| Edge Case | Root Cause | Failure Impact | Engineering Defense |
|---|---|---|---|
| **Email Casing Variants** | User enters `Rahul@example.com` when `rahul@example.com` exists. | Duplicate candidate created; confusing duplicate records in talent search. | Canonical normalization in service: `email.trim().toLowerCase()` applied before lookup and save. |
| **Email Whitespace Padding** | Accidental leading or trailing spaces (`" jane@work.com "`). | Fails regex checks or bypasses index checks. | Auto-trimmed via Zod string transform `.trim()` on frontend and backend schemas. |
| **Concurrent Duplicate Email Submission** | Two recruiters or double-clicks submit the same email within 50ms. | Both pass the `findOne({ email })` check simultaneously, creating duplicate records. | **MongoDB Unique Index (`email: 1`)** serves as the authoritative boundary. Mongoose `code === 11000` is caught and translated to a clean `409 Conflict`. |
| **Negative or Unbounded Experience** | Malformed input like `-3` or `999` years. | Corrupts data analytics and looks unprofessional. | Zod schema validation enforces integer between `min(0)` and `max(50)`. |
| **Blank / Whitespace-Only Name or Role** | User submits `"   "` for Full Name or Position. | Nameless candidate records break table UI. | Zod schema validates `.trim().min(2, "Name must be at least 2 characters")`. |
| **Invalid Stage Enum Injection** | Malicious or crafted HTTP request sends `{ stage: "HiredNow" }`. | Corrupts dashboard stage aggregations. | Strict backend enum validation against `HIRING_STAGES = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected']`. Rejects with `400 Bad Request`. |
| **Overly Long Input Fields** | User pastes entire 50,000-character resume into the `notes` or `name` field. | Database bloat and UI layout breakage. | Length constraints: Name max 100, Position max 100, Notes max 2,000, Skills max 20 tags. |

---

## 2. 🔄 Hiring Stages & Lifecycle Progression Edge Cases

| Edge Case | Root Cause | Failure Impact | Engineering Defense |
|---|---|---|---|
| **Redundant Same-Stage Transition** | Recruiter clicks `Interview` when the candidate is already in `Interview`. | Creates useless duplicate entries in `stageHistory` audit logs. | **Idempotent Transition Logic:** If `candidate.stage === requestedStage`, the controller skips DB write and returns `200 OK` with existing record. |
| **Stage Reversals / Corrections** | Recruiter accidentally marks candidate `Rejected` or `Hired` and needs to undo. | Inflexible ATS traps candidate in wrong stage. | The system permits explicit stage transitions back to active stages (`Screening`, `Interview`) and records the correction in the audit trail. |
| **Initial Stage Audit Gap** | Brand new candidate created in `Applied`. | History list is empty until their second stage change. | On candidate creation, `stageHistory` is seeded with `{ from: null, to: initialStage, changedAt: new Date() }`. |
| **Optimistic UI Network Failure** | Frontend instantly moves stage pill, but API request times out. | Recruiter thinks stage was saved, but refresh loses change. | TanStack Query mutation implements `onError` rollback to snapshot state and triggers an error toast alert. |
| **Deleting a Candidate with History** | Recruiter deletes a candidate. | Orphaned state or broken table references. | Candidate deletion cascades cleanly; confirmation modal prevents accidental deletion. |

---

## 3. 🔍 Search, Filter & Pagination Edge Cases

| Edge Case | Root Cause | Failure Impact | Engineering Defense |
|---|---|---|---|
| **Regex Metacharacters in Search Query** | User searches for `rahul(dev)*[react]` or `+`. | Unescaped regex throws a MongoDB syntax error (HTTP 500) or crashes Express. | **Regex Sanitization Utility:** Escapes metacharacters `.*+?^${}()|[]\` via `.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')` before building `$regex` filter. |
| **ReDoS (Regex Denial of Service)** | User inputs a 5,000-character repetitive search pattern. | Catastrophic backtracking in regex engine spikes CPU to 100% and freezes API. | Capped search query length (max 100 characters) enforced via query validation schema. |
| **Filter Change on High Page Number** | User is on page 5, then types a search term matching only 2 items. | Page 5 renders completely empty even though matches exist on page 1. | Changing search text or stage filter automatically resets pagination state back to `page = 1`. |
| **Zero Matches for Search** | Query returns no records. | Recruiter is unsure whether system crashed or no matches exist. | Friendly empty state: *"No candidates found matching '[query]'"* with a 1-click **"Reset Filters"** button. |
| **Malformed Page or Limit Query** | User requests `?page=-1&limit=100000`. | Negative offset crashes query; huge limit exhausts server memory. | Sanitized pagination: `page = Math.max(1, parseInt(page))`, `limit = Math.min(50, Math.max(1, parseInt(limit)))`. |

---

## 4. 📊 Dashboard & Mathematical Edge Cases

| Edge Case | Root Cause | Failure Impact | Engineering Defense |
|---|---|---|---|
| **Zero Candidates in Database** | Fresh installation or after database wipe. | Division by zero (`0 / 0`) produces `NaN%` or crashes chart rendering. | Guarded math: `total > 0 ? Math.round((hired / total) * 100) : 0`. All metric cards render `0`. |
| **Stage with 0 Applicants** | Database has candidates in `Applied` and `Interview`, but 0 in `Offer`. | Chart omits the `Offer` bar, causing inconsistent bar alignments and chart flickering. | Pipeline aggregation zero-fills all 6 stages so every stage is consistently represented in the Recharts dataset. |
| **Metric Inconsistency Across Cards** | Active pipeline calculation does not reconcile with stage totals. | Confuses recruiters and lowers trust in ATS analytics. | Strict mathematical invariant:  
$$\text{Total} = \text{Active Pipeline} + \text{Hired} + \text{Rejected}$$  
Where Active Pipeline is explicitly defined as `Applied + Screening + Interview + Offer`. |
| **Recent Applicants Race Condition** | Fast insertions close to midnight. | Ordering by ID instead of timestamp gives incorrect recent applicants. | Explicit descending index on `createdAt: -1` queried with `.sort({ createdAt: -1 }).limit(5)`. |

---

## 5. 🌐 Concurrency & Network Edge Cases

| Edge Case | Root Cause | Failure Impact | Engineering Defense |
|---|---|---|---|
| **Rapid Double-Clicking Submit** | Recruiter clicks "Save Candidate" multiple times rapidly. | Multiple identical requests fired within milliseconds. | UI submit button immediately disables and renders a loading spinner. |
| **Malformed MongoDB ObjectID** | User navigates to `/api/candidates/invalid12345`. | Mongoose throws an unhandled `CastError 500`. | Middleware validates `mongoose.isValidObjectId(id)` and returns clean `400 Bad Request` or `404 Not Found`. |
| **Database Connection Drop** | Render instance stays active, but MongoDB Atlas network times out. | API endpoints hang or crash on unhandled promise rejections. | Health check endpoint (`GET /api/health`) inspects `mongoose.connection.readyState === 1`. Returns `503 Service Unavailable` if disconnected. |
| **Stale Data Mutation** | Two recruiters have candidate open; Recruiter A updates name, Recruiter B updates stage. | Lost update anomalies. | Atomic update operations (`$set` and `$push` on `stageHistory`) so field-level updates do not overwrite each other. |

---

## 6. 🛡️ Security, Sanitization & Exposure Edge Cases

| Edge Case | Root Cause | Failure Impact | Engineering Defense |
|---|---|---|---|
| **Stored XSS via Candidate Fields** | Candidate or recruiter enters `<script>alert(document.cookie)</script>` in notes or name. | Malicious script execution in recruiter's browser. | React auto-escapes all rendered text strings. Candidate notes are stored and rendered strictly as plaintext. |
| **Public Database Wipe Endpoint** | Exposing `POST /api/candidates/reset` without authorization. | Anyone on the public internet can wipe the candidate database. | **Destructive reset endpoints removed from public HTTP routes**. Seeding runs via local CLI command (`npm run seed`). |
| **Sensitive Credential Leakage in 500 Responses** | Server crashes and dumps MongoDB connection string or stack trace in JSON response. | Attackers gain database credentials or internal filesystem paths. | Centralized error handler masks internal errors in production (`NODE_ENV === 'production'`) returning generic, clean messages. |
| **Cross-Origin API Abuse** | Third-party websites making unauthorized cross-origin calls to API. | CSRF / API exploitation. | Restrictive CORS middleware configured with `CLIENT_ORIGIN` matching the Vercel deployed URL. |
| **Security Header Missing** | Default Express headers leak `X-Powered-By: Express`. | Information disclosure aids automated bot targeting. | **Helmet middleware** enabled to strip sensitive headers, enforce HSTS, and block MIME-type sniffing. |

---

## 7. 💻 Frontend UX, Viewport & Accessibility Edge Cases

| Edge Case | Root Cause | Failure Impact | Engineering Defense |
|---|---|---|---|
| **Narrow Mobile Viewport (375px)** | Wide table overflows screen, cutting off action buttons. | Mobile recruiter cannot view or change candidate stages. | Responsive layout: Table wraps horizontally with smooth scroll, and key fields stack into card view on mobile screens. |
| **Super Long Candidate Names / Emails** | Candidate with a 60-character name (`Alexander Montgomery Featherstonehaugh...`). | Table layout breaks and pushes actions offscreen. | CSS truncation with ellipsis (`truncate max-w-[180px]`) with hover tooltip displaying full string. |
| **Keyboard-Only Usage** | Recruiter navigating via `Tab` and `Enter`. | Inaccessible modals or lost focus rings. | Semantic HTML buttons, visible focus outlines (`focus-visible:ring-2`), and `Escape` key listeners to dismiss modals/drawers. |
| **Reduced Motion Preference** | User has vestibular motion sensitivity. | Rapid transitions cause discomfort. | CSS `@media (prefers-reduced-motion: reduce)` disables non-essential animations. |

---

## 8. 🚀 Deployment & Operational Edge Cases

| Edge Case | Root Cause | Failure Impact | Engineering Defense |
|---|---|---|---|
| **Render Cold Start Delay** | Free-tier Render server spins down after inactivity (50s wake time). | Recruiter thinks application is broken. | Frontend displays a gentle "Waking up server..." diagnostic indicator during initial health check if response takes >3s. |
| **Missing Production Environment Variables** | `MONGODB_URI` or `CLIENT_ORIGIN` omitted in Render/Vercel settings. | Silent runtime crashes on first API call. | Server entry point validates required environment variables at startup and throws explicit console errors if missing. |
| **Browser Refresh on Routed URL (SPA 404)** | User refreshes on `/candidates`. | Static file server returns 404 because file does not exist on disk. | SPA rewrite rule configured for Vercel (`vercel.json` rewrites all routes to `index.html`). |
| **Production Build TypeScript Mismatch** | TypeScript errors ignored in dev break production build. | Render build fails during `npm run build`. | Root `package.json` runs strict `tsc -b` type checking during build pipeline. |
