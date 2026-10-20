# 🎭 Playwright End-to-End (E2E) Test Suite

This directory contains browser-level integration tests for the EarlyJobs Mini ATS.

## 🧪 Planned Specifications:

1. **`candidate-workflow.spec.ts`**:
   - Opens dashboard and verifies KPI metrics load.
   - Creates a new candidate via modal form.
   - Searches for candidate in directory table.
   - Updates stage from `Applied` to `Interview`.
   - Verifies dashboard KPI counts increment accordingly.
   - Refreshes browser to confirm data persistence.

2. **`candidate-validation.spec.ts`**:
   - Submits invalid emails, empty positions, and negative experience.
   - Verifies inline validation errors and disabled submit states.

3. **`responsive-layout.spec.ts`**:
   - Verifies layout adaptations at mobile (375px) vs desktop (1280px).
   - Validates horizontal scroll safety and hamburger / drawer visibility.

## 🚀 Execution:
- Run all tests: `npm run test:e2e`
- Interactive UI: `npm run test:e2e:ui`
- Headed browser: `npm run test:e2e:headed`
