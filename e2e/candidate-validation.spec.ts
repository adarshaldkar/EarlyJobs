import { test, expect } from '@playwright/test';

test.describe('E2E Test 2: Candidate Validation & Error Recovery', () => {
  const timestamp = Date.now();
  const testCandidate = {
    name: `Validation User ${timestamp}`,
    email: `valid.user.${timestamp}@example.com`,
    position: 'Full Stack Engineer',
    experienceYears: '3',
    resumeUrl: 'https://example.com/resume.pdf'
  };

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the app header and candidates directory to load
    await expect(page.getByTestId('nav-tab-directory')).toBeVisible();
  });

  test('enforces client-side validation on empty inputs and invalid formats', async ({ page }) => {
    // 1. Open the Add Candidate modal
    await page.getByTestId('add-candidate-btn').click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // 2. Submit empty form
    await page.getByTestId('submit-candidate-btn').click();

    // Verify inline validation errors appear
    await expect(page.getByTestId('error-name')).toContainText('Name must be at least 2 characters');
    await expect(page.getByTestId('error-email')).toContainText('Invalid email');
    await expect(page.getByTestId('error-position')).toContainText('Position must be at least 2 characters');

    // 3. Test invalid email format
    await page.getByTestId('input-email').fill('not-an-email');
    await page.getByTestId('submit-candidate-btn').click();
    await expect(page.getByTestId('error-email')).toContainText('Invalid email address format');

    // 4. Test invalid resume URL (non-http/https protocol)
    await page.getByTestId('input-resume-url').fill('javascript:alert(1)');
    await page.getByTestId('submit-candidate-btn').click();
    await expect(page.getByTestId('error-resume-url')).toContainText('resumeUrl must be a valid http: or https: URL');
  });

  test('submits valid candidate and rejects duplicate email with 409 conflict feedback', async ({ page }) => {
    // 1. Open modal and create a valid candidate
    await page.getByTestId('add-candidate-btn').click();
    await page.getByTestId('input-name').fill(testCandidate.name);
    await page.getByTestId('input-email').fill(testCandidate.email);
    await page.getByTestId('input-position').fill(testCandidate.position);
    await page.getByTestId('input-experience').fill(testCandidate.experienceYears);
    await page.getByTestId('input-resume-url').fill(testCandidate.resumeUrl);

    // Submit form
    await page.getByTestId('submit-candidate-btn').click();

    // Verify success toast appears and modal closes
    await expect(page.getByTestId('toast-success')).toBeVisible();
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Search and verify candidate appears in the directory table
    await page.getByTestId('search-input').fill(testCandidate.email);
    const table = page.getByTestId('candidates-table');
    await expect(table.getByText(testCandidate.name)).toBeVisible();

    // 2. Attempt to create another candidate with the exact same duplicate email
    await page.getByTestId('add-candidate-btn').click();
    await page.getByTestId('input-name').fill('Duplicate Test User');
    await page.getByTestId('input-email').fill(testCandidate.email);
    await page.getByTestId('input-position').fill('DevOps Engineer');
    await page.getByTestId('input-experience').fill('5');

    // Submit duplicate
    await page.getByTestId('submit-candidate-btn').click();

    // Verify 409 error banner is displayed and modal remains open
    await expect(page.getByTestId('modal-error-banner')).toContainText('already exists');
    await expect(page.getByRole('dialog')).toBeVisible();

    // Verify form input remains intact so recruiter does not lose their typed work
    await expect(page.getByTestId('input-name')).toHaveValue('Duplicate Test User');
    await expect(page.getByTestId('input-position')).toHaveValue('DevOps Engineer');

    // 3. Clean up created candidate to preserve database cleanliness
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await page.getByTestId('search-input').fill(testCandidate.email);
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });
    const deleteBtn = page.locator(`button[aria-label="Delete ${testCandidate.name}"]`);
    if (await deleteBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await deleteBtn.click();
      await expect(page.getByTestId('toast-success')).toBeVisible();
    }
  });
});
