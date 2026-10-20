import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('E2E Test 6: PDF Resume Ingestion, Extraction & Recruiter Review', () => {
  const resumeFilePath = path.resolve(process.cwd(), 'server/tests/fixtures/synthetic_rich_resume.pdf');

  test('uploads PDF resume, verifies extracted data & link annotations, and saves candidate', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('nav-tab-directory')).toBeVisible();

    // 1. Open the Add Candidate modal
    await page.getByTestId('add-candidate-btn').click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // 2. Upload synthetic PDF via the file input
    const fileChooserInput = page.locator('input[type="file"][accept=".pdf"]');
    await fileChooserInput.setInputFiles(resumeFilePath);

    // 3. Verify recruiter review banner with confidence badge appears
    await expect(page.getByText('Recruiter Review & Verification')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/% Extraction Confidence/)).toBeVisible();

    // 4. Verify candidate fields were auto-populated
    const nameInput = page.getByTestId('input-name');
    await expect(nameInput).not.toHaveValue('');
    const emailInput = page.getByTestId('input-email');
    await expect(emailInput).not.toHaveValue('');

    // Ensure unique email for idempotent repeated test execution
    await emailInput.fill(`candidate.parsed.${Date.now()}@example.com`);

    // 5. Verify extracted profiles & hyperlinks section
    await expect(page.getByText('Extracted Profiles & Hyperlinks')).toBeVisible();

    // 6. Confirm and create candidate
    await page.getByTestId('submit-candidate-btn').click();

    // 7. Verify candidate is created and modal is dismissed
    await expect(page.getByTestId('toast-success')).toBeVisible();
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });
});
