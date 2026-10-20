# 💼 EarlyJobs Mini Applicant Tracking System (ATS)

A high-performance, full-stack Mini Applicant Tracking System (ATS) built with **React 18, TypeScript, Express, and MongoDB Atlas**. Engineered for recruiters to streamline candidate intake, track stage progressions across an interactive Kanban pipeline, conduct structured interview feedback, and monitor real-time hiring metrics.

Designed following the **Ashby / Linear executive design standard**: Warm off-white `#FAFAF9` canvas, flat `#FFFFFF` card surfaces, 1px `#E7E5E4` borders, IBM Plex Sans typography, and Deep Teal `#0F766E` accents.

---

## 📸 Key Features & Capabilities

1. **Interactive Kanban Pipeline Board View (`PipelineBoard.tsx`)**:
   - Toggle seamlessly between **Table View** and **Kanban Pipeline Board**.
   - 6 canonical stage columns: `Applied`, `Screening`, `Interview`, `Offer`, `Hired`, and `Rejected`.
   - Candidate cards with initials avatar, star ratings (★ 1–5), job title & experience, recruitment tags (`Top Talent`, `Referral`, `Immediate Joiner`), and 1-click stage advancement buttons (`Screening >`, `Interview >`, etc.).

2. **Visual Stage Progression Stepper Bar (`CandidateDrawer.tsx`)**:
   - Sequential chevron stepper bar: `Applied` ➔ `Screening` ➔ `Interview` ➔ `Offer` ➔ `Hired`.
   - Completed stages marked with emerald checkmarks, active stage highlighted in Deep Teal, and future stages muted.
   - Dedicated 1-click **"Advance to Next Stage ➔"** and **"Reject Candidate"** action buttons.

3. **Recruiter Interview Feedback & Notes Composer**:
   - Categorized feedback logger (`Technical Interview`, `Phone Screen`, `Culture Fit`, `Offer Discussion`, `General Note`).
   - Textarea with character counter (max 2,000 characters).
   - Posts directly to `POST /api/candidates/:id/notes`, appending entries to the live chronological audit trail timeline.

4. **Job Requisitions & Roles Filter**:
   - Instant filtering across directory and Kanban board by job opening (`Full Stack Engineer`, `Frontend Developer`, `Backend Developer`, `DevOps Engineer`, `Mobile Developer`, `Product Manager`, etc.).
   - Multi-field server-side debounced search (Name, Email, Skills) with ReDoS-safe regex escaping.
   - Server-side sorting (`Highest Rated`, `Recently Added`, `Oldest Added`, `Name A–Z`, `Most Experience`).

5. **Recruitment Analytics Dashboard**:
   - Single-query MongoDB `$facet` aggregation computing Total Candidates, Active Pipeline, In Interview, Hired, and stage distribution charts.
   - Zero-filled stage counts guaranteeing consistent analytics rendering even with zero applicants in specific stages.

6. **Candidate Ratings & Tags**:
   - 1–5 Star Rating selector with instant API synchronization.
   - Tag management chips (`Top Talent`, `Referral`, `Immediate Joiner`, `High Priority`, `Ex-FAANG`).

---

## 🏛️ System Architecture

```
                                 ┌────────────────────────────────────────┐
                                 │             User Browser               │
                                 └───────────────────┬────────────────────┘
                                                     │ HTTPS
                          ┌──────────────────────────┴──────────────────────────┐
                          ▼                                                     ▼
           ┌─────────────────────────────┐                       ┌─────────────────────────────┐
           │      Vercel (Frontend)      │                       │     Render (Backend API)    │
           │  https://<app>.vercel.app   │                       │  https://<api>.onrender.com │
           │  - React 18 / Vite SPA      │                       │  - Express 4 / Node 20      │
           │  - vercel.json SPA rewrites │                       │  - Helmet / Rate Limiting   │
           │  - VITE_API_BASE_URL        │──[REST API Calls]────▶│  - Strict CORS / Logging    │
           └─────────────────────────────┘                       └──────────────┬──────────────┘
                                                                                │ TLS 1.3
                                                                 ┌──────────────▼──────────────┐
                                                                 │   MongoDB Atlas (Database)  │
                                                                 │   - 35 Idempotent Candidates│
                                                                 │   - Compound Indexes        │
                                                                 │   - In-Memory Dev Fallback  │
                                                                 └─────────────────────────────┘
```

---

## 🛡️ Technical Invariants & Concurrency Handling

* **Optimistic Stage Transition Locking:** Stage updates (`PATCH /api/candidates/:id/stage`) require `currentStage` in the request payload. If another recruiter moved the candidate concurrently, the update fails with `409 Conflict`, triggering an automatic UI refresh and warning toast.
* **Email Uniqueness:** Enforced at the MongoDB index level with case-insensitive normalization (`lowercase: true`), mapping collision errors cleanly to `409 Conflict`.
* **Application-Level Capacity Guard:** Enforces a maximum limit of 200 candidates (`422 CAPACITY_EXCEEDED`) to prevent demo sandbox storage exhaustion.
* **Strict Production CORS:** Development loopback origins (`localhost`, `127.0.0.1`) are permitted exclusively in `development`/`test` environments and strictly excluded when `NODE_ENV=production`.
* **Zero-Setup In-Memory Fallback:** When remote MongoDB Atlas is unreachable (e.g. initial IP whitelisting pending), the backend automatically falls back to `mongodb-memory-server` and auto-seeds the 35 candidates so development is never blocked.

---

## 🚀 Quick Start & Local Setup

### Prerequisites
* **Node.js** >= 18.x
* **npm** >= 9.x
* (Optional) **MongoDB Atlas** connection string or local MongoDB instance

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/adarshaldkar/EarlyJobs.git
cd EarlyJobs
npm install
```

### 2. Configure Environment Variables

**Server (`server/.env`):**
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.upiao4i.mongodb.net/earlyjobs_ats?retryWrites=true&w=majority
CLIENT_ORIGIN=http://localhost:5173
```

**Client (`client/.env`):**
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### 3. Run the Development Servers
```bash
# Starts both Express API (:5000) and Vite Client (:5173) concurrently
npm run dev
```

* Open **http://localhost:5173** in your browser.
* API health check endpoint: **http://localhost:5000/api/health**

### 4. (Optional) Run Database Seeding
To populate or reset the database with 35 realistic candidates across all 6 hiring stages:
```bash
npm run seed --prefix server
```

---

## 🧪 Automated Testing & Verification

The codebase includes comprehensive automated test coverage spanning unit, integration, and full-browser E2E testing:

### Backend Integration Tests (Vitest & Supertest)
```bash
npm test
```
* **12 / 12 Passing Tests:**
  * Candidate creation and duplicate email rejection (`409 Conflict`)
  * Optimistic concurrency stage locking and invalid transition handling
  * MongoDB `$facet` aggregation mathematics and zero-filling
  * Recruiter note/interview feedback composer appending to timeline
  * Star rating (0–5) and recruitment tags validation
  * 200-candidate capacity limit enforcement (`422 CAPACITY_EXCEEDED`)
  * Body parser security limits and health check probes

### End-to-End Browser Tests (Playwright)
```bash
npm run test:e2e
```
* **8 / 8 Passing Tests:**
  * Complete Recruiter Journey: intake, search, stage transition, drawer timeline audit
  * Candidate Validation & Error Recovery: empty field errors, invalid email/URL formats, 409 conflict feedback
  * Modern ATS Features: Kanban Pipeline Board 6 columns, Requisition Role filter, Stepper Bar, Star Ratings, Notes Composer
  * Responsive Layout: Desktop (1280px) and Mobile Viewport (375px) without horizontal overflow

### Full Production Build Check
```bash
npm run build
```
Compiles both the backend TypeScript server (`tsc`) and bundles the client Vite application (`vite build`).

---

## ☁️ Cloud Deployment Guide

### A. Deploy Backend API to Render
1. Create a new **Web Service** pointing to the repository.
2. Set **Root Directory** to `server`.
3. Set **Build Command** to `npm install && npm run build`.
4. Set **Start Command** to `npm start`.
5. Add Environment Variables:
   * `NODE_ENV`: `production`
   * `PORT`: `5000`
   * `MONGODB_URI`: `<your-secure-atlas-connection-string>`
   * `CLIENT_ORIGIN`: `https://<your-app>.vercel.app`

### B. Deploy Frontend SPA to Vercel
1. Import repository on Vercel.
2. Set **Root Directory** to `client`.
3. Framework Preset: **Vite**.
4. Set **Build Command** to `npm run build`.
5. Set **Output Directory** to `dist`.
6. Add Environment Variable:
   * `VITE_API_BASE_URL`: `https://<your-render-service>.onrender.com/api`
7. SPA routing is automatically handled via [`client/vercel.json`](file:///c:/Users/shrut/Desktop/EarlyJobs/client/vercel.json).

---

## 📹 60–90 Second Demonstration Video Guide

When recording the submission video walkthrough, follow this sequential 75-second script:

| Time | Action | What to Highlight |
|---|---|---|
| **0:00–0:15** | Open `http://localhost:5173` | Highlight executive Ashby styling, zero AI gradients, and the 4 top KPI metrics (Total Candidates, Active Pipeline, In Interview, Hired). |
| **0:15–0:30** | Click **Pipeline** view toggle | Show the 6-column Kanban Pipeline Board (`Applied` ➔ `Screening` ➔ `Interview` ➔ `Offer` ➔ `Hired` ➔ `Rejected`). Point out candidate initials, star ratings (★ 1–5), and tags. |
| **0:30–0:45** | Filter by **Job Role** | Select `Full Stack Engineer` from the Requisitions dropdown to show instant filtering. Switch back to Table view. |
| **0:45–1:00** | Click candidate to open **Drawer** | Showcase the **Stage Progression Stepper Bar**, rate candidate 5 stars, and click **"Advance to Next Stage ➔"**. |
| **1:00–1:15** | Add Interview Note | Select `Technical Interview` category, type brief feedback, click **"Post Feedback Note"**, and show it appearing on the audit trail timeline. |
| **1:15–1:20** | Show Terminal & Tests | Briefly display terminal running `npm test` (12 passing) and `npm run test:e2e` (8 passing). |

---

## 📄 License
MIT License. Developed for EarlyJobs.ai recruitment assessment.
