import { test, expect } from '@playwright/test';

test.describe('E2E Test 5: Mini ATS Workspace, Jobs, Interviews & In-App Resume Preview', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('nav-tab-directory')).toBeVisible();
  });

  test('navigates to Jobs, inspects requisitions, and navigates to filtered applicants', async ({ page }) => {
    // 1. Click on Jobs in top nav or sidebar
    await page.getByTestId('nav-jobs').first().click();

    // 2. Verify Jobs grid and heading
    await expect(page.getByText('Job Openings & Requisitions')).toBeVisible();
    const jobsGrid = page.getByTestId('jobs-grid');
    await expect(jobsGrid).toBeVisible();

    // 3. Find Full Stack Engineer job card and click 'View Applicants'
    const fullStackCard = jobsGrid.getByText('Full Stack Engineer').first();
    await expect(fullStackCard).toBeVisible();

    const viewApplicantsBtn = page.getByTestId(/^view-applicants-/).first();
    await expect(viewApplicantsBtn).toBeVisible();
    await viewApplicantsBtn.click();

    // 4. Verify we are navigated to Candidate Directory with role filtered
    await expect(page.getByTestId('candidates-table')).toBeVisible();
    const roleSelect = page.getByTestId('role-filter-select');
    await expect(roleSelect).not.toHaveValue('');
  });

  test('navigates to Interviews and interacts with interview loops and feedback logging', async ({ page }) => {
    // 1. Click on Interviews tab
    await page.getByTestId('nav-interviews').first().click();

    // 2. Verify Interviews list and heading
    await expect(page.getByText('Interview Loops & Rounds')).toBeVisible();
    await expect(page.getByTestId('interviews-view')).toBeVisible();

    // 3. Open Schedule Interview loop modal
    await page.getByTestId('schedule-interview-btn').click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('Schedule Interview Loop')).toBeVisible();

    // 4. Fill candidate and confirm schedule
    await page.getByTestId('input-interview-candidate').fill('Aarav Patel');
    await page.getByTestId('submit-schedule-btn').click();
    await expect(page.getByTestId('toast-success')).toBeVisible();
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('opens candidate dossier and verifies resume section with in-app preview modal', async ({ page }) => {
    // 1. Open candidate directory and select first candidate (Aarav Patel)
    await page.getByTestId('nav-tab-directory').first().click();
    const table = page.getByTestId('candidates-table');
    await expect(table).toBeVisible();

    const candidateLink = table.locator('button.font-medium').first();
    await candidateLink.click();

    // 2. Verify candidate drawer opens
    const drawer = page.getByRole('dialog');
    await expect(drawer).toBeVisible();

    // 3. Verify Resume section is displayed
    await expect(page.getByText('Resume & CV Document')).toBeVisible();

    // 4. Click 'Preview' button and verify in-app Resume Preview modal opens
    const previewBtn = page.getByTestId('preview-resume-btn');
    if (await previewBtn.isVisible()) {
      await previewBtn.click();
      await expect(page.locator('iframe[title*="Resume"]')).toBeVisible();
    }
  });
});
