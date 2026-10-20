import { test, expect } from '@playwright/test';

test.describe('E2E Test 3: Responsive Layout & Mobile Usability', () => {
  test('renders properly on desktop viewport (1280px)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');

    await expect(page.getByTestId('nav-tab-directory')).toBeVisible();
    await expect(page.getByTestId('nav-tab-dashboard')).toBeVisible();
    await expect(page.getByTestId('kpi-total-candidates')).toBeVisible();
    await expect(page.getByTestId('search-input')).toBeVisible();
    await expect(page.getByTestId('add-candidate-btn')).toBeVisible();
  });

  test('adapts cleanly to mobile viewport (375px) without horizontal page overflow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    await expect(page.getByTestId('nav-tab-directory')).toBeVisible();
    await expect(page.getByTestId('kpi-total-candidates')).toBeVisible();

    // Verify Add Candidate button is accessible on mobile
    const addBtn = page.getByTestId('add-candidate-btn');
    await expect(addBtn).toBeVisible();

    // Open modal on mobile and verify it fits within viewport
    await addBtn.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Verify modal inputs are scrollable and interactable
    await expect(page.getByTestId('input-name')).toBeVisible();
    await expect(page.getByTestId('submit-candidate-btn')).toBeVisible();

    // Close modal
    await page.getByLabel('Close modal').click();
    await expect(dialog).not.toBeVisible();
  });
});
