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
    await expect(page.getByRole('heading', { name: 'Centre de Formation' })).toBeVisible();
  });

  test('starts the course from the catalog', async ({ page }) => {
    const card = page.getByRole('article').filter({ has: page.getByRole('heading', { name: COURSE }) });
    await expect(card).toContainText('Non commence');
    const started = page.waitForResponse((r) => r.request().method() === 'POST' && new URL(r.url()).pathname.endsWith(`/courses/${COURSE_ID}/start`));
    await card.getByRole('button', { name: 'Commencer' }).click();
    expect((await started).ok()).toBeTruthy();
    await expect(page.getByText('Détails et contenu du cours')).toBeVisible();
  });

  test('completes the content and reaches full progress', async ({ page }) => {
    await page.getByRole('button', { name: `Ouvrir la formation ${COURSE}` }).click();
    await expect(page.getByText('Détails et contenu du cours')).toBeVisible();

    const completed = page.waitForResponse((r) => r.request().method() === 'POST' && /\/contents\/[^/]+\/complete$/.test(new URL(r.url()).pathname));
    await page.getByRole('button', { name: 'Marquer welcome.pdf comme terminé' }).click();
    expect((await completed).ok()).toBeTruthy();
    await expect(page.getByText(/Progression totale\s*100\s*%/)).toBeVisible();
  });
});

test.describe('agent not enrolled', () => {
  test('does not see the course in the catalog', async ({ page, context, baseURL }) => {
    await signInAs(context, baseURL!, users.member);
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Centre de Formation' })).toBeVisible();
    await expect(page.getByRole('heading', { name: COURSE })).toHaveCount(0);
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
