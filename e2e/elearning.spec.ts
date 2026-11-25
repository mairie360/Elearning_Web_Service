import { expect, test } from '@playwright/test';
import { cookieHeader, signInAs, users } from './support/session';

// Critical journeys of the Elearning front (MAIR-603), on the real stack of docker-compose-e2e.yml
// (BFF Elearning, BFF User, Core and E-learning APIs, seeded database with one course): an
// enrolled agent starts the course and completes its content; an agent who is not enrolled does
// not see it and is refused when starting it. The texts asserted are the French ones displayed.

const COURSE = 'Isolated stack onboarding';
const COURSE_ID = '1';

test.describe('enrolled agent', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page, context, baseURL }) => {
    await signInAs(context, baseURL!, users.manager);
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1, name: 'E-learning' })).toBeVisible();
  });

  test('starts the course from its sheet and reaches the course screen', async ({ page }) => {
    // MAIR-1146: the whole tile opens the sheet; MAIR-1147: « Commencer » is in the sheet footer.
    await page.getByRole('button', { name: COURSE }).click();
    const sheet = page.getByRole('dialog', { name: COURSE });
    await expect(sheet).toContainText('Non commencée');
    const started = page.waitForResponse((r) => r.request().method() === 'POST' && new URL(r.url()).pathname.endsWith(`/courses/${COURSE_ID}/start`));
    await sheet.getByRole('button', { name: 'Commencer' }).click();
    expect((await started).ok()).toBeTruthy();
    // MAIR-1148: the course screen replaces the application shell.
    await expect(page.getByRole('heading', { level: 1, name: COURSE })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Quitter la formation' })).toBeVisible();
  });

  test('completes the content and reaches full progress', async ({ page }) => {
    await page.goto(`/?play=${COURSE_ID}`);
    await expect(page.getByRole('heading', { level: 1, name: COURSE })).toBeVisible();

    const completed = page.waitForResponse((r) => r.request().method() === 'POST' && /\/contents\/[^/]+\/complete$/.test(new URL(r.url()).pathname));
    await page.getByRole('button', { name: 'Marquer Welcome guide comme terminé' }).click();
    expect((await completed).ok()).toBeTruthy();
    await expect(page.getByRole('progressbar', { name: /chapitres$/ })).toHaveAttribute('aria-valuenow', '100');
  });
});

test.describe('agent not enrolled', () => {
  test('does not see the course in the catalog', async ({ page, context, baseURL }) => {
    await signInAs(context, baseURL!, users.member);
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1, name: 'E-learning' })).toBeVisible();
    await expect(page.getByRole('button', { name: COURSE })).toHaveCount(0);
  });

  test('is refused when starting the course directly', async ({ request }) => {
    const response = await request.post(`/elearning/courses/${COURSE_ID}/start`, {
      headers: { Cookie: cookieHeader(users.member), Accept: 'application/json' },
      maxRedirects: 0,
    });
    expect([403, 404]).toContain(response.status());
  });
});

test('without a session, the catalog is not served', async ({ request }) => {
  const response = await request.get('/', { maxRedirects: 0 });
  expect(response.status()).toBe(307);
});
