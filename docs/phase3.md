# Phase 3 — Candidate Directory, Search, Stage Updates & Add Candidate Form

> **Project:** EarlyJobs Mini Applicant Tracking System  
> **Phase:** 3 of 6  
> **Milestone:** Candidate Directory & Form Workflow  
> **Target timebox:** 1 hour 45 minutes  
> **Primary stack:** React 18, TypeScript, Vite, Tailwind CSS, TanStack Query, Axios, React Hook Form, Zod, Playwright  
> **Working directories:** \`client/\`, \`e2e/\`  
> **Status:** Implementation specification for the Phase 3 feature branch

---

## 1. Objective

Build the primary recruiter workspace that allows a recruiter to browse candidates, search and filter the list, add a candidate through a validated accessible dialog, and change a candidate's hiring stage.

Phase 3 turns the existing Phase 1 health-check scaffold into a usable candidate-management interface. The API and MongoDB are the source of truth. The frontend must not fabricate candidate records or dashboard statistics.

### Outcomes

At the end of this phase, a recruiter must be able to:

1. Open a candidate directory populated from \`GET /api/candidates\`.
2. Search across candidate name, email, and target position.
3. Filter by one of the six hiring stages.
4. Sort and paginate the result set using server-supported query parameters.
5. Open an accessible **Add Candidate** dialog and receive inline validation.
6. Create a valid candidate and see the list refresh without a full-page reload.
7. Change a candidate's stage and handle a stale-state \`409 STALE_STATE\` conflict clearly.
8. See useful loading, empty, error, and success states.
9. Run the candidate-validation Playwright suite against local servers, with support for a configured staging URL.

### Out of scope for Phase 3

- Dashboard KPI cards, chart, recent applicants and candidate-detail/audit drawer (Phase 4).
- Binary resume upload, document parsing, AI ranking, email automation and multi-job application management.
- Authentication/RBAC for a production recruiting organization; the public assessment demo must use fictional candidate records and have a clearly documented access policy.
- Complex drag-and-drop Kanban, Redis caching, microservices and other infrastructure not required for this small assessment.

---

## 2. Preconditions and frozen contracts

Before implementation, confirm the Phase 1 and Phase 2 exit gates are genuinely passing. Documentation marked “completed” is not a substitute for running the commands.

### Backend endpoints used

| Method | Endpoint | Phase 3 purpose |
|---|---|---|
| \`GET\` | \`/api/health\` | Show API availability in the application header |
| \`GET\` | \`/api/meta/stages\` | Canonical stage metadata; the six stage names must match the backend enum |
| \`GET\` | \`/api/candidates\` | Directory list, search, filtering, sorting and pagination |
| \`POST\` | \`/api/candidates\` | Add a candidate |
| \`PATCH\` | \`/api/candidates/:id/stage\` | Change a candidate's stage with a concurrency guard |

The profile \`PATCH /api/candidates/:id\`, candidate details endpoint, delete UI, dashboard summary and audit drawer exist or are defined in the backend contract, but their user-facing workflows are not Phase 3 exit requirements. The detail drawer and its delete action are Phase 4 scope.

### Standard response envelope

Successful requests use:

\`\`\`ts
type ApiSuccess<T> = {
  success: true;
  data: T;
};
\`\`\`

Errors use the backend's standard envelope:

\`\`\`ts
type ApiFailure = {
  success?: false;
  error?: {
    code?: string;
    message?: string;
    details?: Array<{ field?: string; message?: string }>;
  };
};
\`\`\`

Do not leak raw Axios errors or internal stack traces into the UI. Convert network/API errors into a small, typed error representation while preserving the HTTP status and backend error code.

### Candidate data contract

Keep the frontend types aligned with the API response. The candidate includes:

- \`_id\`, \`name\`, \`email\`, optional \`phone\`
- \`position\`, \`experienceYears\`, \`skills\`
- optional \`resumeUrl\`, optional \`notes\`
- \`stage\`, \`stageHistory\`, \`createdAt\`, \`updatedAt\`

The stage-history entry uses the agreed shape \`{ from, to, changedAt, notes? }\`. It is displayed in Phase 4, but keep the TypeScript type compatible now.

The six immutable stage identifiers are:

\`\`\`ts
export const HIRING_STAGES = [
  'Applied',
  'Screening',
  'Interview',
  'Offer',
  'Hired',
  'Rejected'
] as const;
\`\`\`

Use these same identifiers for filters, stage selectors, API parameters and test assertions. UI labels may be formatted, but API values must not be renamed.

### Data integrity decisions

- The server validates every mutation; client validation improves usability but is not a security boundary.
- Emails are trimmed and lowercased before creation. Duplicate email is reported as \`409 DUPLICATE_EMAIL\`.
- Email and stage history cannot be changed through the profile update endpoint. Stage changes go only through the dedicated stage endpoint.
- Stage changes submit both \`currentStage\` and \`newStage\`. A stale \`currentStage\` returns \`409 STALE_STATE\`.
- Same-stage requests must not append duplicate history. The backend verifies that the submitted current stage still matches stored state.
- Resume links may be optional. If provided, allow only valid \`http:\` and \`https:\` URLs. Do not fetch candidate-provided URLs from the server.
- Do not add a public database reset endpoint or run destructive reset logic at application startup.

---

## 3. Implementation order and timebox

The following estimates add up to 105 minutes. If something overruns, cut visual polish before removing validation, error handling or the exit-gate tests.

| Step | Time | Deliverable |
|---|---:|---|
| 1. Verify contracts and environment | 5 min | Phase 2 API and development server confirmed |
| 2. Typed API client and response errors | 10 min | Shared Axios client and error handling |
| 3. Candidate types and TanStack Query hooks | 10 min | Typed list/create/stage API functions and query invalidation |
| 4. Directory table and visible states | 20 min | Candidate rows, status, empty/error/loading display |
| 5. Search, filters, sorting and pagination | 15 min | Debounced search and server-driven query controls |
| 6. Add Candidate dialog | 20 min | React Hook Form + Zod and accessible dialog |
| 7. Stage update and stale-state handling | 10 min | Stage dropdown, pending state and conflict feedback |
| 8. Playwright validation tests and gate | 15 min | Browser tests executed; build/tests reviewed |

---

## 4. Files and responsibilities

Recommended Phase 3 client structure:

\`\`\`text
client/src/
├── App.tsx
├── main.tsx
├── lib/
│   └── api.ts
├── features/
│   └── candidates/
│       ├── types.ts
│       ├── candidateApi.ts
│       ├── candidateHooks.ts
│       ├── CandidateDirectory.tsx
│       └── AddCandidateDialog.tsx
└── styles/
    └── globals.css

e2e/
└── candidate-validation.spec.ts

playwright.config.ts
\`\`\`

Responsibilities:

- **\`lib/api.ts\`:** Shared Axios instance, base URL, timeout, and typed API error conversion.
- **\`types.ts\`:** Stage union, candidate shape, create payload, query contract and list response.
- **\`candidateApi.ts\`:** HTTP calls only; do not place view state or form logic here.
- **\`candidateHooks.ts\`:** TanStack Query list query and create/stage mutations, including invalidation.
- **\`CandidateDirectory.tsx\`:** Search/filter/sort/page state, table, stage control, notifications, and empty/error/loading states.
- **\`AddCandidateDialog.tsx\`:** Form fields, client validation, submission, server errors and keyboard-accessible dialog behaviour.
- **\`candidate-validation.spec.ts\`:** User-visible browser tests for invalid values and backend duplicate conflicts.
- **\`playwright.config.ts\`:** Chromium project, local web servers by default, and optional remote staging base URL.

Keep components focused. Do not duplicate candidate schemas, stage lists or Axios error parsing in multiple files.

---

## 5. Typed API client and query layer

### 5.1 Axios client

Configure the API base URL as:

\`\`\`ts
const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';
\`\`\`

For local development, Vite proxies \`/api\` to \`http://localhost:5000\`. For a deployed frontend, set \`VITE_API_BASE_URL\` to the backend's API base URL, such as \`https://<api-host>/api\`.

The Axios response interceptor should:

- Preserve successful responses.
- Extract \`error.message\`, \`error.code\`, and validation details when available.
- Preserve the HTTP status for conflict handling.
- Give network failures and request timeouts a helpful message.
- Never expose server stack traces or secrets.

### 5.2 Typed API functions

Implement small functions for:

- \`getCandidates(query)\`
- \`createCandidate(input)\`
- \`updateCandidateStage(id, currentStage, newStage)\`

Keep request parameter names exactly aligned with the backend query schema: \`page\`, \`limit\`, optional \`search\`, optional \`stage\`, \`sortBy\`, and \`sortOrder\`.

List response shape:

\`\`\`ts
{
  items: Candidate[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
\`\`\`

Do not create a second frontend-only source of candidate data.

### 5.3 TanStack Query behaviour

- Use a stable query key containing all effective list parameters.
- Do not use the raw, rapidly changing search input as the server query key; first debounce it.
- After create, stage update success or stage update failure, invalidate the candidate list query family.
- Invalidate dashboard queries after mutations so Phase 4 can use the same strategy.
- A \`409 STALE_STATE\` is not a generic success: show a conflict message and refetch the list to get persisted state.
- Avoid optimistic stage changes in this phase. A server-confirmed update plus query invalidation is simpler and avoids rollback bugs under time pressure.

---

## 6. Candidate directory UI

### 6.1 Page hierarchy

Build a calm, high-density recruiting workspace rather than a generic marketing page:

1. Top navigation with EarlyJobs ATS identity and API health indicator.
2. Page breadcrumb and title **Candidates**, with a concise explanatory subtitle.
3. Primary **Add candidate** button.
4. Search field and sort control.
5. Stage filter pills.
6. Responsive table.
7. Empty/loading/error states and pagination.

Use the project's neutral stone palette and restrained teal accent. Maintain consistent spacing, readable typography, subtle borders and semantic stage colours. Avoid decorative fake growth figures, fake metrics or static candidate counts presented as live data.

### 6.2 Table fields

| Column | Behaviour |
|---|---|
| Candidate | Initials avatar, full name and email |
| Position | Target role; truncate visually when long without losing the full accessible/title value |
| Experience | Number of years with correct singular/plural display |
| Date applied | Format \`createdAt\` consistently |
| Stage | Current-stage badge plus an accessible stage dropdown |

Requirements:

- Give each row a stable key based on candidate ID.
- Render user-provided text as text, not HTML.
- Use semantic table markup and table captions/headers.
- Keep stage badge colours readable and distinguishable; never rely on colour alone.
- At mobile width, allow safe horizontal table scrolling or use a card adaptation; actions must remain reachable.
- Keep stage dropdown labels specific to the candidate, e.g. “Stage for Priya Sharma”.

### 6.3 Search

- Search name, email and position.
- Debounce requests by approximately 300 ms.
- Cap search input to 100 characters in the UI and validate/cap it on the backend too.
- Escape regex metacharacters on the server; do not interpolate untrusted search into a raw regular expression.
- Clear-search action empties the search.
- Changing search resets pagination to page 1.
- A no-match result displays a friendly message and a reset-filters action.
- Preserve the rest of the directory when a search returns no results; do not interpret zero results as an API failure.

### 6.4 Stage filters

Provide an **All** filter and one filter for every canonical stage:

- Applied
- Screening
- Interview
- Offer
- Hired
- Rejected

Only one stage filter is active at a time. Changing the filter resets pagination to page 1. Filtering should be server-driven rather than applied only to the currently visible page.

### 6.5 Sorting and pagination

- Offer sorting supported by the backend: \`createdAt\`, \`name\`, and \`experienceYears\`.
- Use only allowed sort values; never send arbitrary sort keys.
- Use a page size of 10 for the directory. Backend maximum limit is 50.
- Show current page, total pages, and total matching results.
- Disable Previous on page 1 and Next on the last page.
- Reset page to 1 whenever search, stage filter or sorting changes.
- Handle an empty list and page results that become shorter after mutation without leaving the user stuck on a nonexistent page.

### 6.6 Loading, empty and error states

Implement distinct states:

- **Initial loading:** visible progress indicator or skeleton; do not flash an incorrect “empty” state.
- **Empty dataset:** explain that there are no candidates yet and offer Add candidate.
- **No search results:** explain that no candidates match and offer Reset filters.
- **API error:** concise error message with a retry action.
- **Background refetch:** keep existing rows visible and indicate that data is updating where useful.
- **Mutation pending:** disable the relevant submit/stage control to prevent duplicate submissions.
- **Mutation success:** show a concise confirmation.
- **Mutation conflict/failure:** show a helpful error and refetch server state.

---

## 7. Add Candidate dialog and validation

### 7.1 Fields

| Field | Required | Rules |
|---|---|---|
| Full name | Yes | Trimmed; 2–100 characters |
| Email address | Yes | Valid email; trim and lowercase before submission |
| Target position | Yes | Trimmed; 2–100 characters |
| Years of experience | Yes | Integer from 0 to 50 inclusive |
| Phone number | No | Trimmed; max 20 characters in the backend contract |
| Skills | No | Up to 20 tags; each tag max 30 characters |
| Resume link | No | Valid HTTP/HTTPS URL only |

The form may accept comma-separated skills for quick entry, but it must convert them to a trimmed string array before calling the API. An empty optional value should be omitted or normalized consistently; do not send a fake URL or literal placeholder.

### 7.2 Form library responsibilities

Use React Hook Form with the Zod resolver.

- Client-side errors must be displayed beside the relevant field.
- Mark invalid fields with \`aria-invalid\` and connect field errors with \`aria-describedby\`.
- Avoid submitting when validation fails.
- Preserve entered values after a server-side failure, particularly a duplicate email conflict.
- Disable the submit button while the form is submitting or the create mutation is pending.
- Show a spinner or equivalent visual feedback.
- On success: close the dialog, reset the form, return the directory to the unfiltered first page if needed, refresh list data and show a success message.
- On \`409 DUPLICATE_EMAIL\`: keep the dialog open, preserve values, and show a clear conflict message.
- On other failures: show a recoverable message without clearing the user's input.

### 7.3 Accessible dialog behaviour

Prefer the native \`<dialog>\` element opened with \`showModal()\`, or an equivalently accessible dialog primitive. Ensure:

- A descriptive accessible name via \`aria-labelledby\`.
- All fields have programmatic labels.
- Keyboard focus enters the dialog and remains usable while it is open.
- Escape and the close button close the dialog.
- Closing returns focus to the control that opened it.
- Buttons declare their intended type.
- Focus indicators remain visible.
- At 375px wide, dialog content fits the viewport and the footer buttons remain reachable without layout overflow.

Do not use placeholders as substitutes for labels.

---

## 8. Hiring-stage update flow and concurrency

When a recruiter changes a candidate stage:

1. Read the candidate's currently displayed stage.
2. Send \`PATCH /api/candidates/:id/stage\` with both \`currentStage\` and \`newStage\`.
3. Disable the changing control while the request is pending.
4. Wait for the server response; do not imply a persistent change before it succeeds.
5. On success, invalidate/refetch candidate queries and show a concise confirmation.
6. If the server returns \`409 STALE_STATE\`, explain that another session changed the candidate and refresh the displayed list.
7. On a network/server error, show a recoverable message and refetch when possible.

Expected conflict message:

> Candidate was updated by another session. Refreshed.

The server must remain the authority for concurrency. Frontend disabling alone cannot prevent two tabs or two recruiters from submitting simultaneously.

A same-stage selection should not create a duplicate history record. The backend's exact no-op/stale-state semantics are specified in Phase 2; the UI should not bypass them.

---

## 9. Playwright E2E: candidate validation

### File

\`e2e/candidate-validation.spec.ts\`

### Test A — invalid form submission

1. Navigate to the application.
2. Open **Add candidate**.
3. Leave name and position empty.
4. Enter an invalid email and negative experience.
5. Submit.
6. Assert the relevant inline errors appear and the dialog remains open.
7. Assert the invalid form did not create a candidate.

Representative assertions should match the actual frontend Zod wording (for example, “Name must be at least 2 characters.”, “Enter a valid email address.”, “Position must be at least 2 characters.” and “Experience cannot be negative.”). If validation messages intentionally change, update tests to the agreed copy rather than weakening the assertions.

### Test B — duplicate email conflict

1. Use the Playwright API request fixture to create a unique fictional candidate through the real API.
2. Open the frontend and click the primary Add candidate button.
3. Enter a different name/position but reuse the existing email, including casing/whitespace variations.
4. Submit the form.
5. Assert the duplicate-email message is visible in the dialog.
6. Assert the dialog stays open and the entered form values are preserved.
7. Assert no duplicate record was created.
8. Delete the seed candidate in a \`finally\` block so cleanup is attempted even when an assertion fails.

Use a unique test email (for example, \`phase3.<timestamp>@example.test\`) and fictional data. Do not use real candidate records or clean up by truncating the database.

### Test isolation and environment

- Local mode should use the configured Playwright web servers on ports 5000 and 5173.
- Ensure the local API server has a valid test/development database connection.
- To target staging, set \`PLAYWRIGHT_BASE_URL\` to the deployed frontend URL and \`PLAYWRIGHT_API_BASE_URL\` to its backend API base URL.
- Run staging mutations only against a staging database or a dedicated fictional test record.
- Never point cleanup logic at a real production applicant database.
- Test-run reports, screenshots, traces and videos should be inspected when a test fails; do not commit secrets or unnecessary generated test artifacts.

### Required Phase 3 browser checks

- [ ] Invalid fields show inline errors.
- [ ] Invalid values cannot be submitted.
- [ ] The form disables the submit action while pending.
- [ ] Duplicate email produces a visible \`409\` error message.
- [ ] Duplicate conflict does not close the dialog or erase user input.
- [ ] Candidate directory can load successfully with existing data and with no data.
- [ ] Search, stage filter, sorting and pagination work against the API.
- [ ] Stage updates refresh server state and show conflict feedback for stale writes.
- [ ] Mobile width does not hide important controls or break the dialog.

The validation spec is the mandatory Phase 3 automated E2E gate. The end-to-end dashboard workflow, audit drawer assertions and the dedicated responsive spec are Phase 4 gates.

---

## 10. Commands and local verification

Run from the repository root:

\`\`\`bash
# Install root, server and client dependencies
npm run install:all

# Install the browser binary (once per machine / CI image)
npx playwright install chromium

# Build backend and frontend
npm run build

# Run backend Vitest + Supertest suite
npm test

# Run the Playwright browser tests
npm run test:e2e

# Debug a browser test interactively
npm run test:e2e:ui

# Run Playwright with a visible browser
npm run test:e2e:headed
\`\`\`

If local server startup fails, check \`server/.env\`, \`MONGODB_URI\`, the configured ports and the MongoDB connection before debugging the browser test. Confirm the exact scripts in the committed \`package.json\`; do not report passing tests until their process exit code and output have been checked.

For local manual inspection, \`npm run dev\` should start the API and Vite client concurrently. Open \`http://localhost:5173\` and inspect API calls in browser DevTools Network.

---

## 11. Phase 3 definition of done

Phase 3 is complete only when all applicable gates below pass.

### Functional gate

- [ ] Candidate list data comes from the backend; no fake/static candidate count is displayed as live data.
- [ ] Search covers name, email and position and is debounced.
- [ ] Stage filter, allowlisted sorting and pagination work.
- [ ] Search/filter/sort changes reset the page where appropriate.
- [ ] The Add Candidate dialog supports all required fields and the validation contract.
- [ ] Candidate creation persists to MongoDB and refreshes the list without a page reload.
- [ ] Duplicate email shows a clear \`409 DUPLICATE_EMAIL\` message without data loss.
- [ ] Stage changes use \`currentStage\`/ \`newStage\`; stale-state responses trigger a refetch and clear conflict feedback.
- [ ] Loading, empty, no-results and API-error states are distinct and useful.
- [ ] UI does not expose stack traces, secrets or unsafe HTML.

### Quality gate

- [ ] TypeScript production build succeeds for both client and server.
- [ ] Phase 2's Vitest + Supertest suite passes.
- [ ] \`e2e/candidate-validation.spec.ts\` passes in Chromium.
- [ ] No console errors or failed required API requests during the manual recruiter workflow.
- [ ] Keyboard operation, dialog focus handling and visible focus states are checked.
- [ ] 375px mobile layout and a 1280px desktop layout are checked manually.
- [ ] New source and test files are committed; generated artifacts and secrets are not included.

### Exit decision

**Proceed to Phase 4** when the functional and quality gates pass. Phase 4 then adds the database-driven KPI cards, pipeline chart, recent candidates, candidate detail drawer and chronological audit timeline, with the complete Playwright recruiter workflow and responsive-layout tests.

If a gate fails, fix the underlying issue and rerun the relevant test plus the regression suite. Do not mark the phase complete solely because files were created or committed.
