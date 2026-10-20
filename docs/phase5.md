# 🚀 Phase 5: Cloud Deployment & Idempotent Seeding (`phase5.md`)

> **Phase:** 5 of 6  
> **Milestone:** Cloud Production Deployment & Remote Acceptance Verification  
> **Target Timebox:** 45 Minutes  
> **Primary Stack:** Render (Backend API), Vercel (Frontend SPA), MongoDB Atlas (Database), Playwright (Remote Acceptance)  
> **Working Directories:** `server/`, `client/`, `docs/`, `e2e/`  
> **Status:** Deployment Ready & Verified 🚀  

---

## 🎯 1. Phase 5 Objective & Scope

Phase 5 deploys the full-stack Mini ATS to free-tier cloud infrastructure, verifying that production builds, reverse proxies, environment secrets, CORS policies, database connections, and SPA rewrites function flawlessly in a live public environment.

### Target Architecture:
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
                                                                 └─────────────────────────────┘
```

---

## 🛠️ 2. Deployment Blueprint & Configurations

### A. Backend API on Render (`render.yaml` & Dashboard)

1. **Service Type:** Web Service
2. **Repository:** `https://github.com/adarshaldkar/EarlyJobs.git`
3. **Branch:** `main`
4. **Root Directory:** `server`
5. **Runtime:** Node
6. **Build Command:** `npm install && npm run build`
7. **Start Command:** `npm start` (runs `node dist/server.js`)
8. **Health Check Path:** `/api/health`
9. **Environment Variables:**
   | Variable | Value | Description |
   |---|---|---|
   | `NODE_ENV` | `production` | Enables production optimizations, logging, and security |
   | `PORT` | `5000` | Render injects port automatically or defaults to 5000 |
   | `MONGODB_URI` | `mongodb+srv://...` | Secure connection string to MongoDB Atlas |
   | `CLIENT_ORIGIN` | `https://<vercel-project>.vercel.app` | Whitelisted frontend origin for CORS (or `*` for initial setup) |

### B. Frontend SPA on Vercel (`client/vercel.json` & Dashboard)

1. **Framework Preset:** Vite
2. **Root Directory:** `client`
3. **Build Command:** `npm run build`
4. **Output Directory:** `dist`
5. **SPA Rewrites (`client/vercel.json`):**
   ```json
   {
     "rewrites": [
       {
         "source": "/(.*)",
         "destination": "/index.html"
       }
     ]
   }
   ```
6. **Environment Variables:**
   | Variable | Value | Description |
   |---|---|---|
   | `VITE_API_BASE_URL` | `https://<render-service>.onrender.com/api` | Base URL for all typed Axios requests |

---

## 🗄️ 3. Database Seeding & Production Persistence

The backend includes a dedicated idempotent seed script at `server/src/scripts/seed.ts` that populates **35 realistic candidates** across all 6 hiring stages:
* **Applied (10)**: Varied entry-level and experienced roles.
* **Screening (8)**: Engineering, design, and product roles under recruiter review.
* **Interview (6)**: Active candidates in technical/culture rounds.
* **Offer (4)**: Candidates with pending offers.
* **Hired (4)**: Candidates who accepted offers.
* **Rejected (3)**: Candidates who did not meet current role requirements.

**Seed Execution Command:**
```bash
npm run seed --prefix server
```
*Note: The seed script uses `Candidate.bulkWrite()` with `updateOne` and `upsert: true` matching on `email`, ensuring safe idempotency without duplicate key collisions.*

---

## 🚦 4. 7-Point Live Cloud Smoke Test Gate

Execute these sequential smoke checks immediately after deployment:

1. **Health Check Probe:**
   ```bash
   curl -i https://<render-app>.onrender.com/api/health
   # Expected: HTTP 200 OK, {"success":true,"data":{"status":"ok",...}}
   ```
2. **Metadata Contract Check:**
   ```bash
   curl -s https://<render-app>.onrender.com/api/meta/stages | grep -o '"key"' | wc -l
   # Expected: 6 stages returned
   ```
3. **Dashboard Aggregation Check:**
   ```bash
   curl -s https://<render-app>.onrender.com/api/dashboard/summary
   # Expected: Total matches sum of all 6 stages; zero-filling confirmed
   ```
4. **Candidate Directory Query:**
   ```bash
   curl -s "https://<render-app>.onrender.com/api/candidates?page=1&limit=10"
   # Expected: 10 items returned with pagination metadata
   ```
5. **Frontend Asset Load:**
   Open `https://<vercel-app>.vercel.app` in an incognito window.
   Confirm zero console errors, IBM Plex Sans font rendering, and clean off-white `#FAFAF9` canvas.
6. **Recruiter Lifecycle Smoke:**
   Create candidate `Smoke Test Recruiter` (`smoke@test.org`, Frontend Engineer, 3 yrs).
   Move candidate from `Applied` ➔ `Interview`. Confirm dashboard KPI update.
   Delete `smoke@test.org` candidate to clean database.
7. **SPA Refresh Resilience:**
   Press `F5` / hard refresh on the browser while viewing the candidate directory.
   Confirm page reloads without a 404 Not Found error (verifying `vercel.json`).

---

## ⚠️ 5. Known Production Constraints & Mitigations

1. **Render Free-Tier Spin-Down (Cold Start):**
   - **Behavior:** Inactive services spin down after 15 minutes. The initial HTTP request may take 40–50 seconds to wake the service.
   - **Mitigation:** The frontend Axios client includes polite loading states, and the health check probe (`/api/health`) can be pinged before demoing.
2. **Vercel Preview URL CORS:**
   - **Behavior:** Vercel generates unique preview deployment URLs (`https://<project>-git-<branch>.vercel.app`).
   - **Mitigation:** The backend CORS origin validator in `server/src/app.ts` dynamically permits any origin ending in `.vercel.app` when `CLIENT_ORIGIN` contains `vercel.app`.
