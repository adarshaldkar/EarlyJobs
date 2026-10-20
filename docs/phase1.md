# 📦 Phase 1: Scaffolding, Environment Setup & Health Check (`phase1.md`)

> **Phase:** 1 of 6  
> **Milestone:** Project Foundation & Database Readiness  
> **Target Timebox:** 30 Minutes  
> **Naming Convention:** `client/` for Frontend (React + Vite + TS) & `server/` for Backend (Express + Node + TS)  
> **Status:** Executing 🚀  

---

## 🎯 1. Phase 1 Objective & Core Deliverables

1. The **monorepo root** can coordinate both the `client/` and `server/` workspaces seamlessly.
2. The **backend (`server/`)** runs in TypeScript, validates environment variables on startup, connects to MongoDB Atlas with a 5000ms fast-fail timeout, and provides an authoritative database-aware health check endpoint.
3. The **frontend (`client/`)** is scaffolded with Vite, React 18, TypeScript, and Tailwind CSS, pre-configured with our **restrained, human-crafted design tokens** (Deep Teal `#0F766E` accent, warm off-white canvas, 6px border radius, and compact table layout).
4. **Verification Gate:** `curl http://localhost:5000/api/health` returns `200 OK` with `{ "success": true, "data": { "status": "healthy", "database": "connected" } }`.

---

## 🏗️ 2. Confirmed Architectural Decisions (Phase 1)

1. **Database lifecycle:** Phase 1 establishes the connection, error handlers, and graceful shutdown (`SIGTERM`/`SIGINT`). Index synchronization (`Candidate.init()`) is deferred to Phase 2 when the Mongoose model is introduced.
2. **Health Check Contract:**
   - When connected (`200 OK`):
     ```json
     {
       "success": true,
       "data": { "status": "healthy", "database": "connected", "uptime": 14.2, "timestamp": "2026-10-20T11:00:00.000Z" }
     }
     ```
   - When disconnected (`503 Service Unavailable`):
     ```json
     {
       "success": false,
       "error": { "code": "DATABASE_UNAVAILABLE", "message": "Database is not connected", "status": "unhealthy", "database": "disconnected" }
     }
     ```
3. **TypeScript Compilation:** Configured with CommonJS output (`rootDir: "src"`, `outDir: "dist"`), guaranteeing that `dist/server.js` builds and runs cleanly on Render without ESM file extension bugs.
4. **Fast-Fail DB Timeout:** `serverSelectionTimeoutMS: 5000` so invalid connection strings fail visibly in 5 seconds instead of hanging.
5. **Human Design System:**
   - **Canvas:** `#FAFAF9` (warm stone)
   - **Card/Table Surface:** `#FFFFFF`
   - **Borders:** `#E7E5E4` (crisp 1px borders, no shadows)
   - **Accent:** Deep Teal `#0F766E` (primary buttons, links, active rings)
   - **Radius:** Default `6px` via Tailwind theme
   - **Icons:** Lucide React constrained to 16px (`w-4 h-4`)
