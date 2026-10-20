import { test, expect } from '@playwright/test';

test.describe('E2E Test 4: Modern ATS Pipeline, Stepper & Feedback Notes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('nav-tab-directory')).toBeVisible();
  });

  test('switches to Kanban Pipeline Board view and verifies all 6 stage columns', async ({ page }) => {
    // 1. Click Pipeline view toggle
    await page.getByTestId('view-toggle-board').click();

    // 2. Verify Pipeline Board is rendered
    const board = page.getByTestId('pipeline-board');
    await expect(board).toBeVisible();

    // 3. Verify all 6 stage columns exist
    await expect(page.getByTestId('pipeline-column-applied')).toBeVisible();
    await expect(page.getByTestId('pipeline-column-screening')).toBeVisible();
    await expect(page.getByTestId('pipeline-column-interview')).toBeVisible();
    await expect(page.getByTestId('pipeline-column-offer')).toBeVisible();
    await expect(page.getByTestId('pipeline-column-hired')).toBeVisible();
    await expect(page.getByTestId('pipeline-column-rejected')).toBeVisible();

    // 4. Switch back to table view
    await page.getByTestId('view-toggle-table').click();
    await expect(page.getByTestId('candidates-table')).toBeVisible();
  });

  test('filters candidates by Job Role requisition dropdown', async ({ page }) => {
    const roleSelect = page.getByTestId('role-filter-select');
    await expect(roleSelect).toBeVisible();

    // Select 'Full Stack Engineer'
    await roleSelect.selectOption('Full Stack Engineer');

    // Wait for filtered results
    const table = page.getByTestId('candidates-table');
    await expect(table).toBeVisible();
    await expect(table.getByText('Full Stack Engineer').first()).toBeVisible();

    // Reset to All Roles
    await roleSelect.selectOption('');
  });

  test('interacts with Stage Progression Stepper, Star Rating, and Feedback Composer in CandidateDrawer', async ({
    page
  }) => {
    // 1. Create a candidate for drawer testing
    const ts = Date.now();
    const candidateName = `Stepper Test ${ts}`;
    const candidateEmail = `stepper.${ts}@example.com`;

    await page.getByTestId('add-candidate-btn').click();
    await page.getByTestId('input-name').fill(candidateName);
    await page.getByTestId('input-email').fill(candidateEmail);
    await page.getByTestId('input-position').fill('Full Stack Engineer');
    await page.getByTestId('input-experience').fill('3');
    await page.getByTestId('submit-candidate-btn').click();

    await expect(page.getByTestId('toast-success')).toBeVisible();

    // 2. Search and open the candidate in drawer
    await page.getByTestId('search-input').fill(candidateEmail);
    const candidateLink = page.getByTestId('candidates-table').getByText(candidateName);
    await expect(candidateLink).toBeVisible();
    await candidateLink.click();

    // 3. Verify CandidateDrawer opened and Stepper Bar is visible
    const drawer = page.getByRole('dialog');
    await expect(drawer).toBeVisible();
    await expect(page.getByTestId('stage-stepper-bar')).toBeVisible();

    // 4. Advance stage via Stepper Bar or Advance button
    await page.getByTestId('advance-stage-btn').click();
    await expect(page.getByTestId('toast-success').last()).toBeVisible();

    // 5. Rate candidate 5 stars
    const star5 = page.getByRole('button', { name: 'Rate 5 stars' });
    await star5.click();
    await expect(page.getByTestId('toast-success').last()).toBeVisible();

    // 6. Post interview feedback note
    await page.getByTestId('note-input').fill('Demonstrated excellent TypeScript architecture in technical interview.');
    await page.getByTestId('post-note-btn').click();
    await expect(page.getByTestId('toast-success').last()).toBeVisible();

    // 7. Verify feedback note appears on timeline audit trail
    const timeline = page.getByTestId('stage-history-timeline');
    await expect(timeline.getByText('Demonstrated excellent TypeScript architecture in technical interview.')).toBeVisible();

    // Close drawer
    await page.getByTestId('close-drawer-btn').click();
    await expect(drawer).not.toBeVisible();
  });

  test('supports full candidate profile editing and skill search', async ({ page }) => {
    const ts = Date.now();
    const candidateName = `Edit Profile Test ${ts}`;
    const candidateEmail = `edit.profile.${ts}@example.com`;
    const uniqueSkill = `RustGraphQL${ts}`;

    // 1. Create candidate with unique skill
    await page.getByTestId('add-candidate-btn').click();
    await page.getByTestId('input-name').fill(candidateName);
    await page.getByTestId('input-email').fill(candidateEmail);
    await page.getByTestId('input-position').fill('Software Engineer');
    await page.getByTestId('input-experience').fill('2');
    await page.getByTestId('input-skills').fill(`React, Node.js, ${uniqueSkill}`);
    await page.getByTestId('submit-candidate-btn').click();
    await expect(page.getByTestId('toast-success').last()).toBeVisible();

    // 2. Verify skill search works as advertised in README
    await page.getByTestId('search-input').fill(uniqueSkill);
    const table = page.getByTestId('candidates-table');
    await expect(table.getByText(candidateName)).toBeVisible();

    // 3. Open Candidate Drawer and edit profile
    await table.getByText(candidateName).click();
    const drawer = page.getByRole('dialog');
    await expect(drawer).toBeVisible();

    // Click Edit Profile button
    await page.getByTestId('edit-profile-btn').click();
    await expect(page.getByTestId('edit-candidate-form')).toBeVisible();

    // Modify target position and location
    await page.getByTestId('input-edit-position').fill('Staff Cloud Architect');
    await page.getByTestId('input-edit-location').fill('Bengaluru (Onsite)');
    await page.getByTestId('save-profile-btn').click();

    // 4. Verify save toast and updated details
    await expect(page.getByTestId('toast-success').last()).toBeVisible();
    await expect(page.getByTestId('edit-candidate-form')).not.toBeVisible();
    await expect(drawer.getByText('Staff Cloud Architect')).toBeVisible();
    await expect(drawer.getByText('Location: Bengaluru (Onsite)')).toBeVisible();

    // 5. Verify timeline recorded the profile update
    const timeline = page.getByTestId('stage-history-timeline');
    await expect(timeline.getByText('Candidate Profile Updated')).toBeVisible();

    // Close drawer
    await page.getByTestId('close-drawer-btn').click();
    await expect(drawer).not.toBeVisible();
  });
});
