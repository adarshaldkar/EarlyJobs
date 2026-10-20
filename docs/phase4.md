# 📊 Phase 4: Recruiter Dashboard, Pipeline Analytics & Candidate Audit Drawer (`phase4.md`)

> **Phase:** 4 of 6  
> **Milestone:** Real-Time Analytics, Candidate Dossier & End-to-End Workflow Verification  
> **Target Timebox:** 45 Minutes  
> **Primary Stack:** React 18, TypeScript, Recharts, TanStack Query, Lucide React, Playwright  
> **Working Directories:** `client/` & `e2e/`  
> **Status:** Implemented & Verified 🚀  

---

## 🎯 1. Phase 4 Objective & Core Deliverables

Phase 4 completes the analytical and deep-dive inspection capabilities of the Mini ATS. It transforms raw candidate records into an executive recruiter dashboard with live pipeline metrics, a visual stage distribution chart, and an interactive candidate detail slide-over drawer that surfaces the full chronological audit trail of every stage transition.

### Key Deliverables:
1. **Live KPI Summary Cards (`client/src/features/dashboard/KpiCards.tsx`)**:
   - 4 live metric cards: **Total Candidates**, **Active Pipeline**, **In Interview**, and **Hired**.
   - Backed by the backend's single-query `$facet` aggregation (`GET /api/dashboard/summary`).
   - Human-crafted Ashby aesthetic: clean `#FFFFFF` surfaces, crisp 1px `#E7E5E4` borders, tabular numerals, and semantic descriptions. Strictly avoids fake growth badges (e.g. "+12% this week") or neon gradients.
2. **Hiring Pipeline Distribution Chart (`client/src/features/dashboard/PipelineChart.tsx`)**:
   - Responsive Recharts bar chart mapping candidate volume across all 6 canonical stages (`Applied`, `Screening`, `Interview`, `Offer`, `Hired`, `Rejected`).
   - Guaranteed zero-filling: every stage renders with its distinct semantic color token, even if candidate count is 0.
   - Interactive hover tooltip with candidate count and percentage distribution.
3. **Recent Applicants Widget**:
   - Displays the 5 most recently created applicants with instant stage dropdown changers, date applied, and click-to-open drawer triggers.
4. **Candidate Detail Slide-Over Drawer (`client/src/features/candidates/CandidateDrawer.tsx`)**:
   - Right-side slide-over dossier panel with backdrop dismissal and keyboard Escape support.
   - Full applicant profile: Two-letter monogram avatar, Full Name, Target Position, current StageBadge.
   - Contact channels: Clickable `mailto:` link, phone number, and whitelisted external resume link (`http(s)://` opening in a secure new tab with `rel="noopener noreferrer"`).
   - Tagged skills chips and recruiter notes.
   - **Chronological Stage History Audit Trail**:
     - Visual timeline showing every stage movement (`from` $\rightarrow$ `to`).
     - Formatted timestamps (date + time) and optional recruiter notes for each transition.
   - Quick stage transition selector with optimistic concurrency guard (`currentStage`).
   - Danger zone: Hard delete candidate action with confirmation dialog and query invalidation.
5. **Playwright Recruiter Journey E2E Suite (`e2e/candidate-workflow.spec.ts`)**:
   - End-to-end browser verification of the complete recruiter lifecycle:
     1. Reads initial dashboard KPI metrics.
     2. Creates a unique candidate through the Add Candidate modal.
     3. Searches and locates candidate in the directory table.
     4. Advances stage from `Applied` $\rightarrow$ `Interview`.
     5. Opens candidate detail drawer and verifies the `stageHistory` audit trail.
     6. Verifies dashboard metrics and funnel chart increment in real time.
     7. Reloads browser (`F5`) to verify persistent MongoDB state.
     8. Deletes test candidate and confirms clean teardown from directory and metrics.
6. **Playwright Responsive Layout E2E Suite (`e2e/responsive-layout.spec.ts`)**:
   - Verifies 1280px desktop workspace layout and 375px mobile viewport adaptations.

---

## 🏗️ 2. Architectural Decisions & Data Contracts

### 2.1 Single-Query Facet Aggregation Contract
The dashboard avoids N+1 counting queries by executing a single MongoDB aggregation pipeline on `GET /api/dashboard/summary`:

```typescript
export interface DashboardSummary {
  totalCandidates: number;
  activePipeline: number;
  inInterview: number;
  hired: number;
  stageCounts: Record<HiringStage, number>;
}
```

### 2.2 Mathematical Invariants Guaranteed by Backend
1. **Total Count Equality**: $\text{totalCandidates} === \sum_{\text{stage} \in \text{STAGES}} \text{stageCounts}[\text{stage}]$.
2. **Active Pipeline Definition**: $\text{activePipeline} === \text{totalCandidates} - (\text{stageCounts}['\text{Hired}'] + \text{stageCounts}['\text{Rejected}'])$.
3. **In-Memory Zero-Filling**: The backend guarantees that all 6 stage keys (`Applied`, `Screening`, `Interview`, `Offer`, `Hired`, `Rejected`) exist in the response object as numbers (default `0`), preventing undefined key crashes in chart rendering.

### 2.3 Stage History Timeline Data Shape
Every candidate document includes an audit trail conforming to:
```typescript
export interface StageHistoryEntry {
  from: HiringStage | null;
  to: HiringStage;
  changedAt: string; // ISO date string
  notes?: string;
}
```
- Initial candidate creation records: `{ from: null, to: 'Applied', notes: 'Initial application' }`.
- Stage transition records: `{ from: 'Applied', to: 'Interview', notes: 'Passed screening call' }`.

---

## 🎨 3. Dashboard & Drawer Visual Design Specifications

### 3.1 KPI Summary Cards Grid
- **Container**: `grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4`.
- **Card**: Flat `#FFFFFF` surface, 1px `#E7E5E4` border, `6px` radius.
- **Typography**: 
  - Title: Stone 500 (`#78716C`), 12px font-medium.
  - Metric Value: Stone 900 (`#1C1917`), 24px font-bold, `tabular-nums`.
  - Subtitle: Stone 500 (`#78716C`), 11px leading-tight.
- **Icons**: Lucide React 16px (`Users`, `UserCheck`, `PhoneCall`, `Award`) with light stone outline.

### 3.2 Pipeline Funnel Chart Tokens
- **Chart Library**: Recharts `ResponsiveContainer` + `BarChart`.
- **Stage Bar Colors**:
  - `Applied`: `#78716C` (Muted Stone)
  - `Screening`: `#0284C7` (Sky Blue)
  - `Interview`: `#D97706` (Amber)
  - `Offer`: `#7C3AED` (Purple)
  - `Hired`: `#059669` (Emerald)
  - `Rejected`: `#E11D48` (Rose)
- **Bar Radius**: `[4, 4, 0, 0]` (subtle modern rounding on top corners).
- **Tooltip**: Crisp white surface card with 1px border displaying candidate count and stage name.

### 3.3 Detail Drawer Design
- **Position**: Slide-over from the right (`fixed inset-y-0 right-0 max-w-full flex`).
- **Width**: `w-screen max-w-md` (adapts cleanly to mobile screens).
- **Backdrop**: Translucent stone overlay (`bg-stone-900/30`).
- **Audit Timeline**:
  - Vertical connecting line (`w-0.5 bg-subtle`).
  - Circular event node (`h-2.5 w-2.5 rounded-full bg-accent`).
  - Stage change label: `[From] → [To]` with formatted timestamp (`MMM D, YYYY, h:mm A`).

---

## 🎭 4. Automated Verification Specifications (Playwright)

### 4.1 Recruiter Journey Specification (`e2e/candidate-workflow.spec.ts`)
```typescript
test.describe('E2E Test 1: Complete Recruiter Journey', () => {
  test('executes end-to-end recruiter workflow with real-time UI updates and persistence', async ({ page }) => {
    // 1. Navigate to application; assert KPI cards render
    // 2. Open Add Candidate modal; fill fictional candidate data
    // 3. Submit candidate; assert success toast appears
    // 4. Search by email in directory; assert candidate row appears in table
    // 5. Change stage dropdown to 'Interview'; assert success toast and chip update
    // 6. Click candidate row; open detail drawer; assert audit trail displays "Applied → Interview"
    // 7. Navigate to Dashboard tab; assert KPI counts and chart update dynamically
    // 8. Reload browser (F5); assert persisted stage is still 'Interview'
    // 9. Delete candidate from table; assert cleanup and row disappears
  });
});
```

### 4.2 Responsive Layout Specification (`e2e/responsive-layout.spec.ts`)
```typescript
test.describe('E2E Test 3: Responsive Layout & Mobile Usability', () => {
  test('renders properly on desktop viewport (1280px)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    // Assert navigation tabs, KPI cards, table, and search are visible simultaneously
  });

  test('adapts cleanly to mobile viewport (375px) without horizontal page overflow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    // Assert mobile modal dialog fits viewport and buttons remain reachable
  });
});
```

---

## 🛑 5. Phase 4 Exit Gates & Verification Checklist

- [x] `GET /api/dashboard/summary` computes metrics via single-query `$facet` aggregation.
- [x] Mathematical invariant verified: $\text{Total} === \sum \text{stageCounts}$.
- [x] 4 Live KPI Cards display real database numbers without fake growth badges.
- [x] Recharts pipeline funnel chart renders all 6 stages with semantic colors.
- [x] Candidate Detail Drawer displays full candidate dossier, resume link, and stage history audit timeline.
- [x] Recruiter stage changes from within the drawer update database atomically and refresh dashboard metrics.
- [x] Hard delete candidate action prompts confirmation and removes candidate cleanly.
- [x] `candidate-workflow.spec.ts` passes in Chromium browser via Playwright.
- [x] `responsive-layout.spec.ts` passes for both desktop (1280px) and mobile (375px).
- [x] Full production bundle builds cleanly via `npm run build`.
- [x] All commits pushed to GitHub `main` branch.
