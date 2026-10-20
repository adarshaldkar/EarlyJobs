# 💼 EarlyJobs Mini Applicant Tracking System (ATS)

[![Node.js Version](https://img.shields.io/badge/Node.js-%3E%3D18.0-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-4.19-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB Atlas](https://img.shields.io/badge/MongoDB%20Atlas-8.3-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![Vitest](https://img.shields.io/badge/Vitest%20Tests-15%2F15%20Passing-green?logo=vitest&logoColor=white)](https://vitest.dev/)
[![Playwright](https://img.shields.io/badge/Playwright%20E2E-11%2F11%20Passing-2EAD33?logo=playwright&logoColor=white)](https://playwright.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A modern, full-stack **Mini Applicant Tracking System (ATS)** built with **React 18, TypeScript, Express, and MongoDB Atlas**. Engineered from the ground up to provide recruiters with a centralized command center to manage the complete hiring lifecycle: job requisitions, candidate sourcing, resume reviews, 6-stage visual Kanban pipeline movement, scheduled interview loops, and structured evaluation feedback.

Styled strictly according to the **Ashby / Linear executive design standard**: Warm off-white `#FAFAF9` canvas, crisp `#FFFFFF` surfaces, 1px `#E7E5E4` borders, IBM Plex Sans typography, and Deep Teal `#0F766E` accents.

---

## 📑 Table of Contents
- [Recruiter Workspace Navigation](#-recruiter-workspace-navigation)
- [Key Features & ATS Workflows](#-key-features--ats-workflows)
- [System Architecture](#-system-architecture)
- [API Reference & Endpoints](#-api-reference--endpoints)
- [Data Models & Schema Design](#-data-models--schema-design)
- [Concurrency & Enterprise Reliability](#-concurrency--enterprise-reliability)
- [Quick Start & Local Development](#-quick-start--local-development)
- [Automated Testing Suite (Vitest & Playwright)](#-automated-testing-suite)
- [Cloud Deployment (Render + Vercel)](#-cloud-deployment-render--vercel)
- [90-Second Demonstration Video Script](#-90-second-demonstration-video-script)

---

## 🧭 Recruiter Workspace Navigation

The application shell features a **persistent recruiter sidebar** (desktop) and **responsive command header** (mobile/desktop) organizing the ATS into five primary destinations:

| View | Icon | Purpose |
| :--- | :---: | :--- |
| **Overview** | 📊 | Recruitment command center with high-level KPI metrics, pipeline funnel chart, quick action shortcuts, and upcoming interview rounds schedule widget. |
| **Jobs & Openings** | 💼 | First-class job requisitions with department, location, experience range, target openings count, live applicant count badges, and "+ Create Job Opening" modal. |
| **Candidates Directory** | 👥 | Comprehensive candidate directory with multi-field search, requisition role dropdown filter, stage filter, experience filter, star ratings, and tags. |
| **Hiring Pipeline** | 📋 | Interactive 6-column Kanban board (`Applied`, `Screening`, `Interview`, `Offer`, `Hired`, `Rejected`) with stage movement and candidate dossier inspection. |
| **Interviews** | 📅 | Scheduled interview loops, round formats, interviewers, date/time, Google Meet links, and a structured "Log Feedback" modal with 1–5 star ratings and evaluation notes. |

---

## 🚀 Key Features & ATS Workflows

### 1. In-App Resume Dossier & Viewer (`ResumePreviewModal.tsx`)
Recruiters never need to leave the ATS to inspect candidate CVs:
* **In-App Document Preview:** Click **Preview** on any candidate record to view their PDF resume inside an embedded document viewer with zoom, download, and external tab controls.
* **Direct Download & Replace:** 1-click **Download** button and **Replace** file picker connected to Multer static storage (`POST /api/candidates/:id/resume`).
* **Creation File Attachment:** Attach candidate PDF resumes directly during candidate intake in the `CandidateModal`.
* **Instant Demo Experience:** All demo candidates are pre-seeded with fictional resumes (`sample_resume.pdf`) for immediate previewing.

### 2. First-Class Job Requisitions (`JobsView.tsx`)
* **Real Database Records:** Positions are first-class `Job` models rather than hardcoded strings.
* **Dynamic Applicant Count:** Real-time aggregation calculates candidate volume per job opening.
* **Requisition Re-routing:** Clicking **"View Applicants"** on any job opening automatically filters the candidate directory to that specific role.
* **Create & Manage Openings:** Modal to create new roles with department, location (Hybrid/Remote), employment type, experience ranges, requirements, and job descriptions.

### 3. Visual 6-Stage Kanban Pipeline Board (`PipelineBoard.tsx`)
* **6 Canonical Stages:** `Applied` ➔ `Screening` ➔ `Interview` ➔ `Offer` ➔ `Hired`, plus `Rejected`.
* **Actionable Cards:** Cards display candidate initials, 5-star ratings, job title, experience years, tags, and 1-click next-stage advancement buttons.
* **Optimistic Updates:** Immediate UI stage transitions backed by optimistic concurrency locking (`409 Conflict` detection).

### 4. Candidate Dossier & Chronological Audit Timeline (`CandidateDrawer.tsx`)
* **Stage Progression Stepper:** Interactive chevron stepper showing progression from intake to hire with emerald checkmarks for completed milestones.
* **5-Star Recruiter Rating:** 1–5 star rating system with instant database sync.
* **Recruitment Tags:** Tag chips (`Top Talent`, `Referral`, `Immediate Joiner`, `High Priority`, `Ex-FAANG`).
* **Interview Feedback & Notes Composer:** Categorized logger (`Technical Interview`, `Phone Screen`, `Culture Fit`, `Offer Discussion`, `General Note`) that automatically appends entries to the chronological audit timeline.

### 5. Structured Interview Loops & Evaluation (`InterviewsView.tsx`)
* **Loop Scheduling:** Schedule interview rounds (e.g., `Technical Architecture & System Design`, `Live Coding Challenge`, `UI Architecture`, `Culture Fit`) with interviewers, dates, durations, and meeting links.
* **Evaluation Submission:** Interviewers can log structured feedback and 1–5 star ratings. Submissions automatically log an entry to the candidate's stage history.

---

## 🏛️ System Architecture

```
                                 ┌────────────────────────────────────────┐
                                 │             Recruiter Browser          │
                                 └───────────────────┬────────────────────┘
                                                     │ HTTPS
                          ┌──────────────────────────┴──────────────────────────┐
                          ▼                                                     ▼
           ┌─────────────────────────────┐                       ┌─────────────────────────────┐
           │      Vercel (Frontend)      │                       │     Render (Backend API)    │
           │  https://<app>.vercel.app   │                       │  https://<api>.onrender.com │
           │  - React 18 / Vite SPA      │                       │  - Express 4 / Node 20      │
           │  - vercel.json SPA rewrites │                       │  - Helmet / Rate Limiting   │
           │  - Persistent Sidebar & Tabs│──[REST API Calls]────▶│  - Multer Resume Storage    │
           │  - TanStack React Query     │                       │  - Strict CORS / Logging    │
           └─────────────────────────────┘                       └──────────────┬──────────────┘
                                                                                │ TLS 1.3
                                                                 ┌──────────────▼──────────────┐
                                                                 │   MongoDB Atlas (Database)  │
                                                                 │   - Candidates, Jobs, Loops │
                                                                 │   - Compound Indexes        │
                                                                 │   - In-Memory Dev Fallback  │
                                                                 └─────────────────────────────┘
```

---

## 📡 API Reference & Endpoints

All endpoints return uniform JSON responses wrapped in `{ success: boolean, data: T, error?: { code, message, details } }`.

### Candidate Endpoints (`/api/candidates`)
| Method | Endpoint | Description | Status Codes |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/candidates` | Paginated candidate directory with search, filter, and sorting | `200` |
| `GET` | `/api/candidates/:id` | Fetch candidate details by ID | `200`, `400`, `404` |
| `POST` | `/api/candidates` | Create candidate (enforces 200-capacity limit and email uniqueness) | `201`, `400`, `409`, `422` |
| `PATCH` | `/api/candidates/:id` | Update candidate fields (rating, tags, notes, contact info) | `200`, `400`, `404` |
| `PATCH` | `/api/candidates/:id/stage` | Transition stage with optimistic concurrency locking (`currentStage`) | `200`, `400`, `404`, `409` |
| `POST` | `/api/candidates/:id/notes` | Append categorized recruiter interview feedback note to timeline | `200`, `400`, `404` |
| `POST` | `/api/candidates/:id/resume`| Upload candidate PDF resume (multipart form-data, max 5MB) | `200`, `400`, `404` |
| `DELETE`| `/api/candidates/:id` | Delete candidate record | `200`, `400`, `404` |

### Job Requisition Endpoints (`/api/jobs`)
| Method | Endpoint | Description | Status Codes |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/jobs` | List all job openings with dynamic applicant counts | `200` |
| `GET` | `/api/jobs/:id` | Fetch job opening details | `200`, `400`, `404` |
| `POST` | `/api/jobs` | Create new job requisition | `201`, `400` |
| `PATCH` | `/api/jobs/:id` | Update job requisition details | `200`, `400`, `404` |
| `DELETE`| `/api/jobs/:id` | Delete job requisition | `200`, `400`, `404` |

### Interview Endpoints (`/api/interviews`)
| Method | Endpoint | Description | Status Codes |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/interviews` | List scheduled and completed interview rounds | `200` |
| `POST` | `/api/interviews` | Schedule new interview round | `201`, `400` |
| `PATCH` | `/api/interviews/:id`| Submit feedback score or update interview status | `200`, `400`, `404` |
| `DELETE`| `/api/interviews/:id`| Remove scheduled interview round | `200`, `400`, `404` |

### Analytics & System Endpoints
| Method | Endpoint | Description | Status Codes |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/dashboard/summary` | Real-time single-query `$facet` pipeline analytics | `200` |
| `GET` | `/api/meta/stages` | Canonical stages metadata and badge styling tokens | `200` |
| `GET` | `/api/health` | Uptime probe and database connectivity health check | `200`, `503` |
| `GET` | `/uploads/*` | Static file serving for uploaded candidate resumes | `200`, `404` |

---

## 🗄️ Data Models & Schema Design

### Candidate Model (`Candidate.ts`)
```typescript
interface ICandidate {
  name: string;                         // 2-100 characters, trimmed
  email: string;                        // Unique, normalized lowercase
  phone?: string;                       // Optional contact number
  position: string;                     // Requisition title
  experienceYears: number;              // 0-50 years
  skills: string[];                     // Indexed skill tags
  resumeUrl?: string;                   // Static upload path or external URL
  notes?: string;                       // General recruiter notes (max 2,000 chars)
  rating?: number;                      // 0-5 Stars
  tags?: string[];                      // ['Top Talent', 'Referral', ...]
  stage: HiringStage;                   // 'Applied'|'Screening'|'Interview'|'Offer'|'Hired'|'Rejected'
  stageHistory: {
    from: HiringStage | null;
    to: HiringStage;
    changedAt: Date;
    notes?: string;                     // Reason or feedback category
  }[];
}
```

### Job Model (`Job.ts`)
```typescript
interface IJob {
  title: string;                        // Requisition title (e.g. 'Full Stack Engineer')
  department: string;                   // 'Engineering'|'Design'|'Product'|'Infrastructure'
  location: string;                     // 'Bengaluru (Hybrid)'|'Remote'
  type: string;                         // 'Full-time'|'Part-time'|'Contract'
  status: 'Open' | 'Closed' | 'Draft';  // Current requisition status
  experienceMin: number;                // Minimum years of experience
  experienceMax: number;                // Maximum years of experience
  openingsCount: number;                // Target headcount
  description: string;                  // Role overview
  requirements: string[];               // Required skills and qualifications
}
```

### Interview Model (`Interview.ts`)
```typescript
interface IInterview {
  candidateId?: ObjectId;               // Optional link to Candidate record
  candidateName: string;                // Candidate full name
  candidateEmail: string;               // Candidate email
  position: string;                     // Role interviewed for
  round: string;                        // Round name (e.g. 'System Design')
  interviewer: string;                  // Interviewer name and title
  scheduledAt: Date;                    // Date and time of interview
  durationMinutes: number;              // 15-180 minutes
  meetingLink?: string;                 // Video meeting link
  status: 'Scheduled'|'Completed';     // Loop status
  feedback?: string;                    // Evaluation notes
  rating?: number;                      // 1-5 Stars score
}
```

---

## 🛡️ Concurrency & Enterprise Reliability

1. **Optimistic Concurrency Control:**
   Stage transitions require passing `currentStage`. If another recruiter changes the candidate's stage in another tab, the update returns `409 Conflict`, prompting the UI to automatically refresh with zero data corruption.
2. **Normalized Email Uniqueness:**
   Enforced at the MongoDB index level with case-insensitive normalization (`lowercase: true`), mapping collision errors cleanly to `409 Conflict`.
3. **Capacity Guard:**
   Enforces a 200-candidate maximum ceiling (`422 CAPACITY_EXCEEDED`) to prevent demo resource exhaustion.
4. **Strict Production CORS:**
   Local development loopback origins (`localhost`, `127.0.0.1`) are enabled exclusively in `development`/`test` environments and excluded in production.
5. **Zero-Setup In-Memory Fallback:**
   If MongoDB Atlas is unreachable during local evaluation, the server automatically boots an in-memory database (`mongodb-memory-server`) and seeds 35 candidates, 6 job requisitions, and 4 scheduled interview rounds.

---

## 🚀 Quick Start & Local Development

### Prerequisites
* **Node.js** >= 18.x
* **npm** >= 9.x

### 1. Clone & Install
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
*(Note: If `MONGODB_URI` is omitted or network access is blocked, the server seamlessly boots in-memory MongoDB).*

**Client (`client/.env`):**
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### 3. Run Development Servers
```bash
# Starts both Express API (:5000) and Vite Client (:5173) concurrently
npm run dev
```
* **Frontend Application:** [http://localhost:5173](http://localhost:5173)
* **Backend Health Probe:** [http://localhost:5000/api/health](http://localhost:5000/api/health)

### 4. Database Seeding (Optional)
To re-seed or reset realistic data (35 candidates, 6 job requisitions, 4 interview loops):
```bash
npm run seed --prefix server
```

---

## 🧪 Automated Testing Suite

The codebase has complete test coverage across unit, integration, and full-browser E2E testing:

### 1. Backend Integration Tests (Vitest & Supertest)
```bash
npm test
```
* **15 / 15 Passing Tests across 3 test suites:**
  * Candidate creation and duplicate email rejection (`409 Conflict`)
  * Optimistic concurrency stage locking and invalid transition handling
  * MongoDB `$facet` aggregation mathematics and zero-filling
  * Recruiter note/interview feedback composer appending to timeline
  * Star rating (0–5) and recruitment tags validation
  * 200-candidate capacity limit enforcement (`422 CAPACITY_EXCEEDED`)
  * Job requisition lifecycle and dynamic applicant count aggregation
  * Interview loop scheduling and automated stage history logging
  * Candidate resume upload endpoint (`POST /api/candidates/:id/resume`)

### 2. End-to-End Browser Tests (Playwright)
```bash
npm run test:e2e
```
* **11 / 11 Passing Tests across 5 test suites:**
  * **Test 1:** Complete Recruiter Journey: intake, search, stage transition, drawer timeline audit
  * **Test 2:** Candidate Validation & Error Recovery: empty field errors, invalid email/URL formats, 409 conflict feedback
  * **Test 3:** Responsive Layout: Desktop (1280px) and Mobile Viewport (375px) without horizontal overflow
  * **Test 4:** Modern ATS Pipeline Features: Kanban Pipeline Board 6 columns, Requisition Role filter, Stepper Bar, Star Ratings, Notes Composer
  * **Test 5:** Mini ATS Recruiter Workspace: Job requisitions navigation, applicant filtering, interview scheduling, and in-app resume preview modal

### 3. Production Build Validation
```bash
npm run build
```
Compiles both the backend TypeScript server (`tsc`) and bundles the client Vite application (`vite build`) with **0 errors**.

---

## ☁️ Cloud Deployment (Render + Vercel)

### Backend Deployment (Render)
1. Create a new **Web Service** pointing to this repository.
2. Set **Root Directory** to `server`.
3. Set **Build Command** to `npm install && npm run build`.
4. Set **Start Command** to `npm start`.
5. Configure Environment Variables:
   * `NODE_ENV`: `production`
   * `PORT`: `5000`
   * `MONGODB_URI`: `<your-atlas-connection-string>`
   * `CLIENT_ORIGIN`: `https://<your-vercel-app>.vercel.app`

### Frontend Deployment (Vercel)
1. Import the repository on Vercel.
2. Set **Root Directory** to `client`.
3. Framework Preset: **Vite**.
4. Set **Build Command** to `npm run build`.
5. Set **Output Directory** to `dist`.
6. Configure Environment Variable:
   * `VITE_API_BASE_URL`: `https://<your-render-service>.onrender.com/api`
7. SPA client-side routing is handled via [`client/vercel.json`](file:///c:/Users/shrut/Desktop/EarlyJobs/client/vercel.json).

---

## 📹 90-Second Demonstration Video Script

When recording your video walkthrough, follow this concise script:

| Time | Screen | Action | What to Say / Highlight |
|---|---|---|---|
| **0:00–0:15** | **Overview** | Show Dashboard | "EarlyJobs is an executive Mini ATS with Ashby-inspired design. Notice the real-time KPI metrics, the pipeline funnel chart, and the upcoming interviews widget." |
| **0:15–0:30** | **Jobs** | Click Jobs Tab | "Under Jobs & Openings, we have first-class requisitions with applicant count badges. Clicking 'View Applicants' instantly filters the directory to that role." |
| **0:30–0:45** | **Pipeline** | Click Pipeline Tab | "Here is the visual 6-stage Kanban board (`Applied` through `Rejected`). Cards show ratings, experience, tags, and 1-click stage advancement." |
| **0:45–1:05** | **Candidates & Resume** | Open Candidate Drawer | "In the candidate dossier, we see the Stage Stepper and the Resume section. Clicking 'Preview' opens our in-app PDF document viewer without leaving the ATS." |
| **1:05–1:20** | **Interviews** | Click Interviews Tab | "Under Interviews, recruiters can manage scheduled loops with meeting links and submit structured feedback with 1–5 star ratings that log directly to the candidate's audit history." |
| **1:20–1:30** | **Terminal** | Show Tests | "All 15 Vitest backend integration tests and 11 Playwright E2E tests pass with 100% green." |

---

## 📄 License
MIT License. Developed for EarlyJobs.ai recruitment assessment.
