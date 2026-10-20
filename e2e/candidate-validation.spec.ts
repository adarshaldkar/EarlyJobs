import { expect, test } from '@playwright/test';

const apiBaseUrl = (
  process.env.PLAYWRIGHT_API_BASE_URL || 'http://127.0.0.1:5000/api'
).replace(/\/$/, '');

test.describe('Candidate intake validation', () => {
  test('shows inline validation errors before sending an invalid candidate', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Add candidate', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Add candidate' });

    await dialog.getByLabel('Full name').fill('');
    await dialog.getByLabel('Email address').fill('not-an-email');
    await dialog.getByLabel('Target position').fill('');
    await dialog.getByLabel('Years of experience').fill('-1');
    await dialog.getByRole('button', { name: 'Save candidate' }).click();

    await expect(dialog.getByText('Name must be at least 2 characters.', { exact: true })).toBeVisible();
    await expect(dialog.getByText('Enter a valid email address.', { exact: true })).toBeVisible();
    await expect(dialog.getByText('Position must be at least 2 characters.', { exact: true })).toBeVisible();
    await expect(dialog.getByText('Experience cannot be negative.', { exact: true })).toBeVisible();
    await expect(dialog).toBeVisible();
  });

  test('shows a conflict message when the email already exists', async ({ page, request }) => {
    const email = 'phase3.' + Date.now() + '@example.test';
    const seedResponse = await request.post(apiBaseUrl + '/candidates', {
      data: {
        name: 'Existing E2E Candidate',
        email,
        position: 'Software Engineer',
        experienceYears: 2,
        skills: ['TypeScript']
      }
    });

    expect(seedResponse.status()).toBe(201);
    const seedBody = await seedResponse.json();
    const candidateId = seedBody.data._id as string;

    try {
      await page.goto('/');
      await page.getByRole('button', { name: 'Add candidate', exact: true }).click();
      const dialog = page.getByRole('dialog', { name: 'Add candidate' });

      await dialog.getByLabel('Full name').fill('Duplicate E2E Candidate');
      await dialog.getByLabel('Email address').fill('  ' + email.toUpperCase() + '  ');
      await dialog.getByLabel('Target position').fill('Backend Engineer');
      await dialog.getByLabel('Years of experience').fill('3');
      await dialog.getByRole('button', { name: 'Save candidate' }).click();

      await expect(dialog.getByTestId('candidate-server-error')).toContainText(
        'A candidate with this email address already exists.'
      );
      await expect(dialog).toBeVisible();
    } finally {
      await request.delete(apiBaseUrl + '/candidates/' + candidateId);
    }
  });
});
