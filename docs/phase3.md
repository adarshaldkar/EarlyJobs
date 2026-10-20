# 👥 Phase 3: Candidate Directory, Modal Form & E2E Validation (`phase3.md`)

> **Phase:** 3 of 6  
> **Milestone:** Primary Recruiter Workspace, Form Workflow & Browser Validation  
> **Target Timebox:** 1 Hour 45 Minutes  
> **Working Directory:** `client/` & `e2e/`  
> **Design Philosophy:** Human-Crafted Ashby/Linear Density (Warm Stone `#FAFAF9`, Flat `#FFFFFF` Surfaces, 1px `#E7E5E4` Borders, Deep Teal `#0F766E` Accent)  
> **Status:** Executed & Verified 🚀  

---

## 🎯 1. Phase 3 Objective & Core Deliverables

Phase 3 builds the primary operational workspace for the recruiter. It connects the frontend React client to the Phase 2 Express backend engine, delivering a high-density candidate directory table, debounced multi-field search, an accessible candidate creation dialog with strict Zod validation, atomic stage transition controls with stale-state conflict handling, and an automated Playwright browser validation test suite.

### Key Deliverables:
1. **API Client & Type Definitions (`client/src/lib/api.ts` & `client/src/types/index.ts`)**:
   - Axios instance configured with proxy and environment fallback (`VITE_API_BASE_URL`).
   - Strict TypeScript interfaces matching backend models and envelopes (`Candidate`, `HiringStage`, `CandidateListResponse`, `DashboardSummary`).
   - Centralized error parser extracting human-readable messages and HTTP status codes (`409`, `400`, `404`).
2. **Candidate Directory Table (`client/src/features/candidates/CandidateTable.tsx`)**:
   - Ashby-style high information density table with clean 1px borders (`#E7E5E4`).
   - Two-letter monogram avatar with neutral circle badge.
   - Columns: Candidate (Initials + Name + Email), Position, Experience badge (tabular nums), Date Applied, Stage Dropdown, Actions (View Dossier, Delete).
   - In-place stage dropdown sending atomic updates with `currentStage` guard.
   - Bounded pagination controls (Showing X to Y of Z candidates, Previous / Next buttons).
3. **Search & Filter Toolbar (`client/src/features/candidates/CandidateFilters.tsx`)**:
   - Real-time search input with a **300ms debounce** matching Name, Email, and Position.
   - Interactive stage filter pills (`All`, `Applied`, `Screening`, `Interview`, `Offer`, `Hired`, `Rejected`) with live count badges.
   - One-click **"Reset Filters"** button restoring default page 1 state.
   - Primary **"Add Candidate"** trigger button.
4. **Accessible Candidate Modal Form (`client/src/features/candidates/CandidateModal.tsx`)**:
   - Modal dialog with keyboard focus trapping and escape-key dismissal.
   - React Hook Form + Zod resolver enforcing backend constraints (Name min 2, valid email format, experience 0–50, protocol-validated `http:`/`https:` resume URL).
   - Loading state on submit button preventing rapid double-submission races.
   - Duplicate email conflict handling (`409 Conflict`): keeps recruiter's typed data intact, highlights email field, and shows an actionable error banner.
5. **Toast Notification System (`client/src/components/Toast.tsx`)**:
   - Accessible notification provider for system events:
     - Stage transition success: `"[Candidate] moved to [Stage]"`.
     - Stale concurrency collision (`409`): *"Candidate was updated in another session. Refreshed."*.
     - Creation / deletion feedback toasts.
6. **Playwright E2E Validation Suite (`e2e/candidate-validation.spec.ts`)**:
   - Automated browser verification executing empty form rejections, invalid email formats, unsafe resume URLs, and duplicate email recovery in a real Chromium browser.

---

## 🎨 2. Design System & Aesthetic Tokens

To guarantee the user interface feels human-crafted and avoids generic "AI template" aesthetics, Phase 3 strictly adheres to the Ashby/Linear visual token contract:

| Token | Value | Applied To | Rationale |
|---|---|---|---|
| **Canvas** | `#FAFAF9` (Stone 50) | Full page background | Warm, comfortable off-white avoiding stark hospital `#FFFFFF` or cold gray `#F3F4F6`. |
| **Surface** | `#FFFFFF` (Pure White) | Table cards, modals, dropdowns | Crisp contrast against stone canvas. |
| **Borders** | `#E7E5E4` (Stone 200) | 1px border on all containers | Subtle definition without heavy, distracting drop shadows. |
| **Accent Primary** | `#0F766E` (Deep Teal) | Primary buttons, active tabs, focus rings | Deliberate, sophisticated executive color; strictly no purple/indigo neon gradients. |
| **Accent Hover** | `#115E59` (Teal 800) | Button hover states | Smooth, subtle tactile feedback. |
| **Text Primary** | `#1C1917` (Stone 900) | Headings, candidate names | High legibility neutral dark text. |
| **Text Secondary** | `#78716C` (Stone 500) | Emails, dates, captions | Muted secondary metadata. |
| **Radius** | `6px` (`rounded`) | Inputs, buttons, cards, badges | Subtle modern rounding; never pill-shaped inputs or oversized 16px corners. |
| **Typography** | IBM Plex Sans | All text elements | Clean engineered neo-grotesque font loaded via `@fontsource/ibm-plex-sans`. |

### Semantic Stage Badge Tokens:
- **Applied**: `bg-stone-100 text-stone-700 border-stone-200 dot-stone-400`
- **Screening**: `bg-sky-50 text-sky-700 border-sky-200 dot-sky-500`
- **Interview**: `bg-amber-50 text-amber-800 border-amber-200 dot-amber-500`
- **Offer**: `bg-purple-50 text-purple-700 border-purple-200 dot-purple-500`
- **Hired**: `bg-emerald-50 text-emerald-700 border-emerald-200 dot-emerald-500`
- **Rejected**: `bg-rose-50 text-rose-700 border-rose-200 dot-rose-500`

---

## 🏗️ 3. Component Hierarchy & Data Flow

```
App (TanStack QueryClientProvider, ToastProvider)
 ├── Top Navigation Bar (EJ Branding, Tab Switcher, MongoDB Health Indicator)
 └── Main Workspace Container
      ├── KpiCards (Total, Active Pipeline, In Interview, Hired)
      └── Directory View
           ├── CandidateFilters
           │    ├── Search Input (300ms debounce, clear button)
           │    ├── Stage Filter Pills (All + 6 stages)
           │    └── Add Candidate Button
           └── CandidateTable
                ├── Dense Table Rows
                │    ├── Monogram Avatar + Name + Email
                │    ├── Position & Tabular Experience Badge
                │    ├── Applied Date
                │    ├── Interactive Stage Dropdown (Atomic concurrency guard)
                │    └── Actions (View Dossier Drawer, Delete Button)
                └── Bounded Pagination Footer (Page X of Y, Prev/Next)
 ├── CandidateModal (React Hook Form, Zod Resolver, 409 Error Recovery)
 └── CandidateDrawer (Candidate Dossier, Stage History Audit Trail)
```

---

## ⚡ 4. Concurrency Guard & Error Recovery Specifications

### 4.1 In-Table Atomic Stage Updates
When a recruiter changes a candidate's stage using the row dropdown selector:
1. The table captures the candidate's existing stage as `currentStage` and the selected value as `newStage`.
2. The UI calls `updateCandidateStage(candidate._id, candidate.stage, newStage)`.
3. If successful (`200 OK`):
   - A success toast appears: `"[Name] moved to [NewStage]"`.
   - TanStack Query invalidates `['candidates']` and `['dashboardSummary']`, refetching fresh state across the UI.
4. If another recruiter changed the candidate concurrently (`409 STALE_STATE`):
   - The UI catches the `409` error.
   - An alert toast notifies the recruiter: *"Candidate was updated in another session. Refreshed."*
   - Queries are automatically invalidated to refresh the table with the real persisted state, preventing lost updates.

### 4.2 Duplicate Email Conflict Preservation
When submitting the Add Candidate modal:
1. Submissions are validated against `createCandidateFormSchema`.
2. If the API returns `409 Conflict` (duplicate email):
   - The modal **remains open**.
   - All input fields retain their typed values (name, phone, position, experience, skills, notes) so the recruiter does not lose work.
   - An alert banner is displayed at the top of the form: *"A candidate with this email address already exists"*.
   - The email input receives an inline validation error and focus.

---

## 🎭 5. Playwright E2E Validation Specification (`e2e/candidate-validation.spec.ts`)

Playwright drives a headless Chromium browser against the live web server to verify form boundaries:

```typescript
test.describe('E2E Test 2: Candidate Validation & Error Recovery', () => {
  // Test 1: Empty Form & Bad Formats
  test('enforces client-side validation on empty inputs and invalid formats', async ({ page }) => {
    // 1. Opens Add Candidate modal
    // 2. Submits empty form -> expects inline errors on name, email, position
    // 3. Types invalid email ("not-an-email") -> expects format error
    // 4. Types unsafe resume URL ("javascript:alert(1)") -> expects protocol validation error
  });

  // Test 2: Duplicate Email 409 Conflict Recovery
  test('submits valid candidate and rejects duplicate email with 409 conflict feedback', async ({ page }) => {
    // 1. Creates unique candidate (fictional persona + timestamp)
    // 2. Verifies success toast and table appearance
    // 3. Submits another candidate with identical email
    // 4. Verifies 409 error banner displays "already exists"
    // 5. Verifies modal remains open and inputs are preserved
  });
});
```

---

## 🛑 6. Phase 3 Exit Gates & Verification Checklist

- [x] Client builds with zero TypeScript errors via `tsc -b && vite build`.
- [x] Responsive layout renders cleanly on desktop (1280px) and mobile (375px).
- [x] Debounced search filters by candidate name, email, and position.
- [x] Stage selector dropdown sends atomic `{ currentStage, newStage }` requests.
- [x] Duplicate email returns `409 Conflict` with visual feedback without resetting form inputs.
- [x] Concurrency race returns `409 STALE_STATE` with automatic query invalidation and user toast.
- [x] Automated Playwright validation suite passes cleanly (`2/2 passed` in `candidate-validation.spec.ts`).
- [x] Clean git commit made without tracking agent customizations or secrets.
