import { test, expect } from '@playwright/test';

test.describe('E2E Test 1: Complete Recruiter Journey', () => {
  const timestamp = Date.now();
  const testCandidate = {
    name: `Priya Sharma ${timestamp}`,
    email: `priya.sharma.${timestamp}@example.com`,
    position: 'Senior Backend Engineer',
    experienceYears: '4',
    skills: 'Node.js, Express, MongoDB, Docker',
    resumeUrl: 'https://example.com/resumes/priya-sharma.pdf',
    notes: 'Outstanding system design interview performance.'
  };

  test('executes end-to-end recruiter workflow with real-time UI updates and persistence', async ({
    page
  }) => {
    // 1. Open application and view dashboard metrics
    await page.goto('/');
    await expect(page.getByTestId('nav-tab-directory')).toBeVisible();

    // Check initial KPI card
    const initialKpi = page.getByTestId('kpi-total-candidates');
    await expect(initialKpi).toBeVisible();

    // 2. Create a fictional candidate through the UI
    await page.getByTestId('add-candidate-btn').click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.getByTestId('input-name').fill(testCandidate.name);
    await page.getByTestId('input-email').fill(testCandidate.email);
    await page.getByTestId('input-position').fill(testCandidate.position);
    await page.getByTestId('input-experience').fill(testCandidate.experienceYears);
    await page.getByTestId('input-skills').fill(testCandidate.skills);
    await page.getByTestId('input-resume-url').fill(testCandidate.resumeUrl);
    await page.getByTestId('input-notes').fill(testCandidate.notes);

    await page.getByTestId('submit-candidate-btn').click();

    // Verify success notification
    await expect(page.getByTestId('toast-success')).toBeVisible();
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // 3. Search for the candidate and verify the record appears in the table
    await page.getByTestId('search-input').fill(testCandidate.email);
    const table = page.getByTestId('candidates-table');
    const candidateLink = table.getByText(testCandidate.name);
    await expect(candidateLink).toBeVisible();

    // 4. Change stage from Applied to Interview via the row stage dropdown
    // Find the row containing this candidate and select 'Interview'
    const stageSelect = page.locator(`select[aria-label="Update stage for ${testCandidate.name}"]`);
    await expect(stageSelect).toHaveValue('Applied');
    await stageSelect.selectOption('Interview');

    // Verify success toast appears and stage updates
    await expect(page.getByTestId('toast-success')).toBeVisible();
    await expect(stageSelect).toHaveValue('Interview');

    // 5. Open candidate details and verify stage history audit trail
    await candidateLink.click();
    await expect(page.getByRole('dialog')).toBeVisible();

    const timeline = page.getByTestId('stage-history-timeline');
    await expect(timeline).toBeVisible();
    await expect(timeline).toContainText('Applied → Interview');

    // Close drawer
    await page.getByTestId('close-drawer-btn').click();
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // 6. Navigate to Dashboard tab and confirm metrics update
    await page.getByTestId('nav-tab-dashboard').click();
    await expect(page.getByTestId('pipeline-funnel-card')).toBeVisible();

    // 7. Reload page and verify state persists
    await page.reload();
    await expect(page.getByTestId('nav-tab-directory')).toBeVisible();

    // Switch back to Directory and verify candidate is still in Interview stage
    await page.getByTestId('nav-tab-directory').click();
    await page.getByTestId('search-input').fill(testCandidate.email);
    const reloadedStageSelect = page.locator(
      `select[aria-label="Update stage for ${testCandidate.name}"]`
    );
    await expect(reloadedStageSelect).toHaveValue('Interview');

    // 8. Delete candidate and verify cleanup
    // Set up dialog handler for window.confirm
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });

    const deleteBtn = page.locator(
      `button[aria-label="Delete ${testCandidate.name}"]`
    );
    await deleteBtn.click();

    // Verify cleanup
    await expect(page.getByTestId('toast-info')).toBeVisible();
    await expect(table.getByText(testCandidate.name)).not.toBeVisible();
  });
});
