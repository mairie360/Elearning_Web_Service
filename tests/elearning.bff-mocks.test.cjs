const assert = require('node:assert/strict');
const { after, afterEach, before, beforeEach, describe, test } = require('node:test');
require('./support/load-typescript.cjs');
const { unreachableUrl } = require('./support/contract-mock-server.ts');
const f = require('./support/elearning-fixtures.ts');
const { errorReply, useMockedFront } = require('./support/mocked-front.ts');
const { createCatalogActions, replaceCatalogCourse, toContractCourse } = require('../src/features/elearning/catalogActions.ts');
const { loadProfile } = require('../src/features/elearning/profileActions.ts');
const { pathSegment } = require('../src/lib/elearning-api.ts');
const { logout } = require('../src/lib/auth-session.ts');
const { clearStoredAuthJwtToken, formatBearerToken, getStoredAuthJwtToken, storeAuthJwtToken } = require('../src/lib/auth-token.ts');

// Les actions du catalogue et les anciens helpers de profil sont
// exécutées de bout en bout : fetch navigateur -> middleware -> src/app/[...path]/route.ts -> proxy -> BFF E-learning
// simulé depuis le paquet publié @mairie360/bff-elearning-openapi. C'est le seul service que le front peut joindre :
// le mock refuse toute requête absente du contrat et valide ses réponses de succès ; les erreurs passent par errorReply.

const front = useMockedFront({ before, after, beforeEach, afterEach });
const { bffElearning, runtime } = front;
const loginReturn = () => { const url = new URL('https://login.mairie.test/'); url.searchParams.set('redirect', front.window().location.href); return url.href; };
const confirmedOwner = () => { runtime.owner = { origin: 'https://login.mairie.test', calls: [], handle: async () => Response.json({ message: 'Session revoked', session_revoked: true }) }; };
const savedLoginUrl = process.env.LOGIN_FRONT_URL;
beforeEach(() => { process.env.LOGIN_FRONT_URL = 'https://login.mairie.test/'; });
afterEach(() => {
  if (savedLoginUrl === undefined) delete process.env.LOGIN_FRONT_URL;
  else process.env.LOGIN_FRONT_URL = savedLoginUrl;
});

const CONSUMED = [
  'GET /elearning/catalog',
  'GET /elearning/profile',
  'POST /elearning/courses/{courseId}/start',
  'POST /elearning/courses/{courseId}/contents/{contentId}/complete',
  'POST /elearning/courses/{courseId}/rating',
  'POST /elearning/admin/courses',
  'PATCH /elearning/admin/courses/{courseId}',
  'DELETE /elearning/admin/courses/{courseId}',
  'GET /elearning/training-time',
  'GET /elearning/certificates',
  'GET /elearning/courses/{courseId}/certificate',
  'GET /elearning/courses/{courseId}/chapters/{chapterId}/contents/{contentId}/file',
  'GET /elearning/admin/stats',
  'POST /elearning/admin/courses/{courseId}/reminders',
  'GET /elearning/admin/courses/{courseId}/learners',
  'GET /elearning/admin/agents',
  'POST /elearning/admin/courses/{courseId}/learners',
  'DELETE /elearning/admin/courses/{courseId}/learners/{userId}',
];

after(() => {
  // Chaque opération consommée par le front a été rejouée contre le BFF simulé.
  assert.deepEqual([...front.elearningOperations].sort(), [...CONSUMED].sort());
});

function catalogState(initial = null) {
  const state = { catalogResponse: initial, loading: [], error: null, mutationError: null };
  const view = {
    setCatalogResponse: (update) => { state.catalogResponse = update(state.catalogResponse); },
    setLoading: (loading) => { state.loading.push(loading); },
    setError: (message) => { state.error = message; },
    setMutationError: (message) => { state.mutationError = message; },
  };
  return { state, actions: createCatalogActions(view) };
}

const operations = () => bffElearning.requests.map((request) => `${request.method} ${request.template}`);
const reloadCatalog = () => bffElearning.on('get', '/elearning/catalog', { body: f.catalogResponse() });

// Hold the first real contract-backed browser response until a newer action has completed.
// This tests response ordering without adding artificial operations to the published contract.
async function withDelayedCatalog(run) {
  const originalFetch = global.fetch;
  let release;
  let ready;
  const held = new Promise((resolve) => { release = resolve; });
  const received = new Promise((resolve) => { ready = resolve; });
  let delayed = false;
  global.fetch = async (...args) => {
    const response = await originalFetch(...args);
    if (args[0] === '/elearning/catalog' && !delayed) {
      delayed = true;
      ready(args[1]);
      await held;
    }
    return response;
  };
  try { await run({ received, release }); }
  finally { release(); global.fetch = originalFetch; }
}

// Keep the first real learner response pending while the same action is
// submitted again; every request still traverses the unchanged contract routes.
async function withDelayedLearnerResponse(pathname, run) {
  const originalFetch = global.fetch;
  let release;
  let received;
  const held = new Promise((resolve) => { release = resolve; });
  const ready = new Promise((resolve) => { received = resolve; });
  let first = true;
  global.fetch = async (...args) => {
    const hold = args[0] === '' + pathname && args[1]?.method === 'POST' && first;
    if (hold) first = false;
    const response = await originalFetch(...args);
    if (hold) { received(); await held; }
    return response;
  };
  try { await run({ ready, release }); }
  finally { release(); global.fetch = originalFetch; }
}

describe('catalog actions against the contract-driven BFF E-learning', () => {
  for (const scenario of ['foreign-chapter', 'foreign-content', 'negative-completion', 'missing-target', 'repeated-chapter', 'repeated-content', 'contradictory-target']) {
    test(`${scenario} progression receipt preserves every confirmation and does not trigger GET`, async () => {
      const initial = f.catalogResponse([f.course(), f.course('independent')]);
      const response = f.contentCompleteResponse();
      const chapterId = response.chapter.id;
      const contentId = response.content.id;
      if (scenario === 'foreign-chapter') response.chapter = { ...response.chapter, id: 'foreign' };
      if (scenario === 'foreign-content') response.content = { ...response.content, id: 'foreign' };
      if (scenario === 'negative-completion') response.content = { ...response.content, completed: false };
      if (scenario === 'missing-target') response.chapters = [];
      if (scenario === 'repeated-chapter') response.chapters = [response.chapter, response.chapter];
      if (scenario === 'repeated-content') response.chapters = [{ ...response.chapter, contents: [response.content, response.content] }];
      if (scenario === 'contradictory-target') response.chapters = [{ ...response.chapter, contents: [{ ...response.content, completed: false }] }];
      const { state, actions } = catalogState(initial);
      const path = '/elearning/courses/{courseId}/contents/{contentId}/complete';
      bffElearning.on('post', path, { body: response });
      assert.equal(await actions.completeContent('4', chapterId, contentId), false);
      assert.equal(state.catalogResponse, initial);
      assert.match(state.mutationError, /progression.*confirmée/);
      assert.equal(state.error, null);
      assert.deepEqual(operations(), [`POST ${path}`]);
    });
  }

  test('a rejected completion receipt permits a deliberate coherent confirmation, then GET-only recovery', async () => {
    const { state, actions } = catalogState(f.catalogResponse());
    const response = f.contentCompleteResponse();
    const path = '/elearning/courses/{courseId}/contents/{contentId}/complete';
    bffElearning.on('post', path, { body: { ...response, content: { ...response.content, completed: false } } });
    assert.equal(await actions.completeContent('4', response.chapter.id, response.content.id), false);
    bffElearning.on('post', path, { body: response });
    bffElearning.on('get', '/elearning/catalog', errorReply(503, 'READ_REFUSED', 'Read refused'));
    assert.equal(await actions.completeContent('4', response.chapter.id, response.content.id), true);
    assert.equal(state.catalogResponse.catalog.courses[0].progress, response.progress);
    assert.equal(state.mutationError, null);
    assert.equal(state.error, 'Read refused');
    bffElearning.on('get', '/elearning/catalog', { body: state.catalogResponse });
    await actions.loadCatalog();
    assert.deepEqual(operations(), [`POST ${path}`, `POST ${path}`, 'GET /elearning/catalog', 'GET /elearning/catalog']);
  });

  test('an explicit uncompletion trusts a coherent false state and official progress instead of computing counters', async () => {
    const response = f.contentCompleteResponse();
    response.progress = 37;
    response.completed = false;
    response.content.completed = false;
    const { state, actions } = catalogState(f.catalogResponse());
    bffElearning.on('post', '/elearning/courses/{courseId}/contents/{contentId}/complete', { body: response });
    bffElearning.on('get', '/elearning/catalog', errorReply(503, 'READ_REFUSED', 'Read refused'));
    assert.equal(await actions.completeContent('4', response.chapter.id, response.content.id, false), true);
    assert.equal(state.catalogResponse.catalog.courses[0].progress, 37);
    assert.deepEqual(state.catalogResponse.catalog.courses[0].details.chapters, response.chapters);
    assert.equal(bffElearning.requests[0].body.completed, false);
  });

  for (const returnedId of ['independent', ' ']) {
    test(`a start receipt with mismatched identity ${JSON.stringify(returnedId)} cannot overwrite another course`, async () => {
      const initial = f.catalogResponse([f.course(), f.course('independent', { title: 'Keep this course' })]);
      const { state, actions } = catalogState(initial);
      bffElearning.on('post', '/elearning/courses/{courseId}/start', {
        body: { course: f.course(returnedId, { title: 'Foreign replacement', progress: 100 }) },
      });
      assert.equal(await actions.startCourse('4'), false);
      assert.equal(state.catalogResponse, initial);
      assert.match(state.mutationError, /démarrage.*confirmé/);
      assert.deepEqual(operations(), ['POST /elearning/courses/{courseId}/start']);
      bffElearning.on('post', '/elearning/courses/{courseId}/start', { body: { course: f.course() } });
      bffElearning.on('get', '/elearning/catalog', errorReply(503, 'READ_REFUSED', 'Read refused'));
      assert.equal(await actions.startCourse('4'), true);
      assert.equal(state.catalogResponse.catalog.courses[1].title, 'Keep this course');
    });
  }

  test('editing a submitted numeric note preserves the last confirmation on refusal and trusts the server distribution', async () => {
    const initialCourse = f.course();
    initialCourse.details.completionRating = { initialValue: 4, submitted: true };
    const { state, actions } = catalogState(f.catalogResponse([initialCourse]));
    const previousDistribution = initialCourse.ratingDistribution;
    const template = '/elearning/courses/{courseId}/rating';
    bffElearning.on('post', template, errorReply(503, 'UNAVAILABLE', 'Modification refusée'));
    assert.equal(await actions.rateCourse(initialCourse.id, 3), false);
    assert.equal(state.catalogResponse.catalog.courses[0].details.completionRating.initialValue, 4);
    assert.deepEqual(state.catalogResponse.catalog.courses[0].ratingDistribution, previousDistribution);
    assert.deepEqual(operations(), [`POST ${template}`]);

    const response = { rating: 3.5, ratingCount: 2, ratingLabel: '3,5 (2 avis)', myRating: 3, ratingDistribution: { 3: 1, 4: 1 }, submitted: true };
    bffElearning.on('post', template, { body: response });
    bffElearning.on('get', '/elearning/catalog', errorReply(503, 'UNAVAILABLE', 'Actualisation refusée'));
    assert.equal(await actions.rateCourse(initialCourse.id, 3), true);
    const confirmed = state.catalogResponse.catalog.courses[0];
    assert.equal(confirmed.details.completionRating.initialValue, 3);
    assert.equal(confirmed.details.completionRating.submitted, true);
    assert.equal(confirmed.rating, 3.5);
    assert.deepEqual(confirmed.ratingDistribution, response.ratingDistribution);
    assert.equal(state.error, 'Actualisation refusée');
    assert.equal(state.mutationError, null);
    assert.deepEqual(bffElearning.requests.filter(request => request.method === 'POST').map(request => request.body), [{ rating: 3 }, { rating: 3 }]);
    assert.deepEqual(operations(), [`POST ${template}`, `POST ${template}`, 'GET /elearning/catalog']);
  });

  for (const kind of ['start', 'complete', 'rating']) {
    test(`a repeated pending learner ${kind} dispatch performs only one write`, async () => {
      const courseId = '4';
      const completion = f.contentCompleteResponse();
      const pathname = kind === 'complete'
        ? `/elearning/courses/${courseId}/contents/${completion.content.id}/complete`
        : `/elearning/courses/${courseId}/${kind}`;
      const template = kind === 'complete'
        ? '/elearning/courses/{courseId}/contents/{contentId}/complete'
        : `/elearning/courses/{courseId}/${kind}`;
      // Use the same valid responses as the existing operation recipes.
      if (kind === 'start') bffElearning.on('post', template, { body: { course: f.course(courseId) } });
      else bffElearning.on('post', template, { body: kind === 'complete' ? completion : f.ratingResponse(5) });
      reloadCatalog();
      const { actions } = catalogState(f.catalogResponse());
      const dispatch = () => kind === 'start' ? actions.startCourse(courseId)
        : kind === 'complete' ? actions.completeContent(courseId, completion.chapter.id, completion.content.id)
        : actions.rateCourse(courseId, 5);
      await withDelayedLearnerResponse(pathname, async ({ ready, release }) => {
        const first = dispatch();
        await ready;
        const second = dispatch();
        release();
        assert.deepEqual(await Promise.all([first, second]), [true, true]);
        assert.equal(operations().filter((operation) => operation === `POST ${template}`).length, 1,
          'pending repeated submissions must not emit duplicate learner writes');
      });
    });
  }

  test('a different learner action does not run while starting, and a refused start can be retried', async () => {
    const courseId = '4';
    bffElearning.on('post', '/elearning/courses/{courseId}/start', errorReply(503, 'UNAVAILABLE', 'Démarrage refusé'));
    const initial = f.catalogResponse();
    const { state, actions } = catalogState(initial);
    await withDelayedLearnerResponse(`/elearning/courses/${courseId}/start`, async ({ ready, release }) => {
      const first = actions.startCourse(courseId);
      await ready;
      assert.equal(await actions.rateCourse(courseId, 5), false);
      assert.equal(actions.startCourse(courseId), first);
      assert.equal(state.catalogResponse, initial);
      release();
      assert.equal(await first, false);
    });
    assert.equal(state.mutationError, 'Démarrage refusé');
    bffElearning.on('post', '/elearning/courses/{courseId}/start', { body: { course: f.course(courseId) } });
    reloadCatalog();
    assert.equal(await actions.startCourse(courseId), true);
    assert.equal(state.mutationError, null);
    assert.deepEqual(operations(), [
      'POST /elearning/courses/{courseId}/start',
      'POST /elearning/courses/{courseId}/start', 'GET /elearning/catalog',
    ]);
  });

  for (const kind of ['complete', 'rating']) {
    test(`a confirmed ${kind} survives failed refresh without resending on GET retry`, async () => {
      const courseId = '4';
      const response = kind === 'complete' ? f.contentCompleteResponse() : f.ratingResponse(5);
      const template = kind === 'complete'
        ? '/elearning/courses/{courseId}/contents/{contentId}/complete'
        : '/elearning/courses/{courseId}/rating';
      bffElearning.on('post', template, { body: response });
      bffElearning.on('get', '/elearning/catalog', errorReply(503, 'UNAVAILABLE', 'Actualisation refusée'));
      const { state, actions } = catalogState(f.catalogResponse());
      const confirmed = kind === 'complete'
        ? await actions.completeContent(courseId, response.chapter.id, response.content.id)
        : await actions.rateCourse(courseId, 5);
      assert.equal(confirmed, true);
      assert.equal(state.mutationError, null);
      assert.equal(state.error, 'Actualisation refusée');
      const course = state.catalogResponse.catalog.courses[0];
      if (kind === 'complete') {
        assert.equal(course.progress, 100);
        assert.equal(course.details.completed, true);
        assert.deepEqual(course.details.chapters, response.chapters);
      } else {
        assert.deepEqual(course.ratingDistribution, response.ratingDistribution);
        assert.equal(course.details.completionRating.submitted, true);
        assert.equal(course.details.completionRating.initialValue, 5);
      }
      bffElearning.on('get', '/elearning/catalog', { body: state.catalogResponse });
      await actions.loadCatalog();
      assert.equal(state.error, null);
      assert.deepEqual(operations(), [`POST ${template}`, 'GET /elearning/catalog', 'GET /elearning/catalog']);
    });
  }

  test('an older catalogue response cannot overwrite a newer refresh', async () => {
    const old = f.catalogResponse([f.course('old', { title: 'Ancien catalogue' })]);
    const current = f.catalogResponse([f.course('current', { title: 'Catalogue récent' })]);
    bffElearning.on('get', '/elearning/catalog', { body: old });
    const { state, actions } = catalogState();
    await withDelayedCatalog(async ({ received, release }) => {
      const first = actions.loadCatalog();
      await received;
      bffElearning.on('get', '/elearning/catalog', { body: current });
      await actions.loadCatalog();
      release();
      await first;
      assert.deepEqual(state.catalogResponse, current);
      assert.deepEqual(state.loading, [true, true, false]);
    });
  });

  test('a late refresh error does not replace the state of a successful newer refresh', async () => {
    bffElearning.on('get', '/elearning/catalog', errorReply(503, 'BFF_UNAVAILABLE', 'Ancienne panne'));
    const current = f.catalogResponse();
    const { state, actions } = catalogState();
    await withDelayedCatalog(async ({ received, release }) => {
      const first = actions.loadCatalog();
      await received;
      bffElearning.on('get', '/elearning/catalog', { body: current });
      await actions.loadCatalog();
      release();
      await first;
      assert.deepEqual(state.catalogResponse, current);
      assert.equal(state.error, null);
    });
  });

  test('a late catalogue response cannot reset a server-confirmed course start', async () => {
    const old = f.catalogResponse();
    const started = f.course('4', { statusValue: 'in-progress', progress: 10 });
    bffElearning.on('get', '/elearning/catalog', { body: old });
    bffElearning.on('post', '/elearning/courses/{courseId}/start', { body: { course: started } });
    const { state, actions } = catalogState(old);
    await withDelayedCatalog(async ({ received, release }) => {
      const first = actions.loadCatalog();
      await received;
      bffElearning.on('get', '/elearning/catalog', { body: f.catalogResponse([started]) });
      await actions.startCourse('4');
      release();
      await first;
      assert.deepEqual(state.catalogResponse.catalog.courses[0], started);
    });
  });

  test('a superseded 401 still returns to Login without logout instead of weakening session rejection', async () => {
    bffElearning.on('get', '/elearning/catalog', errorReply(401, 'UNAUTHORIZED', 'Session expirée'));
    const { state, actions } = catalogState();
    await withDelayedCatalog(async ({ received, release }) => {
      const first = actions.loadCatalog();
      await received;
      reloadCatalog();
      await actions.loadCatalog();
      release();
      await first;
      assert.deepEqual(front.window().location.assigned, [loginReturn()]);
      assert.equal(state.error, null);
    });
  });

  test('loadCatalog goes through the catch-all proxy with the session cookie as Bearer token', async () => {
    const body = f.catalogResponse();
    bffElearning.on('get', '/elearning/catalog', { body });
    const { state, actions } = catalogState();

    await actions.loadCatalog();

    assert.deepEqual(state.catalogResponse, body);
    assert.deepEqual(state.loading, [true, false]);
    assert.equal(state.error, null);
    assert.deepEqual(runtime.frontCalls, [{ method: 'GET', pathname: '/elearning/catalog', search: '', route: 'src/app/[...path]/route.ts', status: 200 }]);
    const [request] = bffElearning.requests;
    assert.equal(request.headers.authorization, `Bearer ${runtime.accessToken}`);
    assert.equal(request.headers.accept, 'application/json');
    for (const header of ['cookie', 'x-nonce', 'content-security-policy']) assert.equal(request.headers[header], undefined, header);
    assert.deepEqual(request.undeclaredQuery, []);
    assert.deepEqual(runtime.upstreamCalls.map(({ url, route }) => [url.origin, route]), [[new URL(bffElearning.url).origin, 'src/app/[...path]/route.ts']]);
  });

  test('a JWT stored in localStorage does not replace the current cookie session', async () => {
    front.window().localStorage.setItem('mairie360.auth.jwt', 'stored-jwt');
    reloadCatalog();

    await catalogState().actions.loadCatalog();

    assert.equal(bffElearning.requests[0].headers.authorization, `Bearer ${runtime.accessToken}`);
  });

  test('startCourse retains the confirmed course and refreshes official catalogue statistics', async () => {
    const started = f.course('4', { statusValue: 'in-progress', progress: 10 });
    bffElearning.on('post', '/elearning/courses/{courseId}/start', { body: { course: started } });
    const updated = f.catalogResponse([started, f.course('accueil')]);
    updated.catalog.stats = [{ label: 'En cours', value: 7 }];
    bffElearning.on('get', '/elearning/catalog', { body: updated });
    const { state, actions } = catalogState(f.catalogResponse([f.course(), f.course('accueil')]));

    await actions.startCourse('4');

    assert.deepEqual(operations(), ['POST /elearning/courses/{courseId}/start', 'GET /elearning/catalog']);
    assert.deepEqual(bffElearning.requests[0].pathParams, { courseId: '4' });
    assert.deepEqual(bffElearning.requests[0].body, {});
    assert.equal(bffElearning.requests[0].headers['content-type'], 'application/json');
    assert.deepEqual(state.catalogResponse.catalog.courses.map((course) => [course.id, course.statusValue]), [['4', 'in-progress'], ['accueil', 'not-started']]);
    assert.equal(state.mutationError, null);
    assert.deepEqual(state.catalogResponse, updated, 'statistics are supplied by the server, not counted from visible courses');
  });

  test('a refused start leaves courses and statistics unchanged without fetching the catalogue', async () => {
    const initial = f.catalogResponse();
    bffElearning.on('post', '/elearning/courses/{courseId}/start', errorReply(403, 'FORBIDDEN', 'Formation refusée'));
    const { state, actions } = catalogState(initial);
    await actions.startCourse('4');
    assert.deepEqual(state.catalogResponse, initial);
    assert.equal(state.mutationError, 'Formation refusée');
    assert.deepEqual(operations(), ['POST /elearning/courses/{courseId}/start']);
  });

  test('the course is confirmed while its uncached statistics refresh is still pending', async () => {
    const initial = f.catalogResponse();
    const started = f.course('4', { statusValue: 'in-progress', progress: 10 });
    const updated = f.catalogResponse([started]);
    updated.catalog.stats = [{ label: 'En cours', value: 7 }];
    bffElearning.on('post', '/elearning/courses/{courseId}/start', { body: { course: started } });
    bffElearning.on('get', '/elearning/catalog', { body: updated });
    const { state, actions } = catalogState(initial);
    await withDelayedCatalog(async ({ received, release }) => {
      const start = actions.startCourse('4');
      const requestInit = await received;
      assert.equal(requestInit.cache, 'no-store');
      assert.deepEqual(state.catalogResponse.catalog.courses, [started]);
      assert.deepEqual(state.catalogResponse.catalog.stats, initial.catalog.stats);
      release();
      await start;
      assert.deepEqual(state.catalogResponse, updated);
    });
  });

  test('a failed start refresh retains the confirmation and retries only the catalogue', async () => {
    const started = f.course('4', { statusValue: 'in-progress', progress: 10 });
    const initial = f.catalogResponse();
    bffElearning.on('post', '/elearning/courses/{courseId}/start', { body: { course: started } });
    bffElearning.on('get', '/elearning/catalog', errorReply(503, 'BFF_UNAVAILABLE', 'Actualisation indisponible'));
    const { state, actions } = catalogState(initial);
    await actions.startCourse('4');
    assert.deepEqual(state.catalogResponse.catalog.courses, [started]);
    assert.deepEqual(state.catalogResponse.catalog.stats, initial.catalog.stats);
    assert.equal(state.mutationError, null);
    assert.equal(state.error, 'Actualisation indisponible');
    const updated = f.catalogResponse([started]);
    updated.catalog.stats = [{ label: 'En cours', value: 2 }];
    bffElearning.on('get', '/elearning/catalog', { body: updated });
    await actions.loadCatalog();
    assert.deepEqual(state.catalogResponse, updated);
    assert.equal(state.error, null);
    assert.deepEqual(operations(), ['POST /elearning/courses/{courseId}/start', 'GET /elearning/catalog', 'GET /elearning/catalog']);
  });

  test('a session refused during start refresh still returns to Login without logout', async () => {
    bffElearning.on('post', '/elearning/courses/{courseId}/start', { body: { course: f.course('4', { statusValue: 'in-progress' }) } });
    bffElearning.on('get', '/elearning/catalog', errorReply(401, 'UNAUTHORIZED', 'Session expirée'));
    const { state, actions } = catalogState(f.catalogResponse());
    await actions.startCourse('4');
    assert.deepEqual(front.window().location.assigned, [loginReturn()]);
    assert.equal(state.error, null);
  });

  test('completeContent encodes path parameters, sends CompleteContentBody, then reloads the catalogue', async () => {
    const content = f.content('vidéo #2', { completed: false });
    const chapter = f.chapter('11', [content]);
    bffElearning.on('post', '/elearning/courses/{courseId}/contents/{contentId}/complete', {
      body: { ...f.contentCompleteResponse(), completed: false, chapters: [chapter], chapter, content },
    });
    reloadCatalog();
    const { state, actions } = catalogState();

    await actions.completeContent('sécurité incendie', '11', 'vidéo #2', false);

    assert.deepEqual(operations(), ['POST /elearning/courses/{courseId}/contents/{contentId}/complete', 'GET /elearning/catalog']);
    const [complete] = bffElearning.requests;
    assert.equal(complete.url.pathname, '/elearning/courses/s%C3%A9curit%C3%A9%20incendie/contents/vid%C3%A9o%20%232/complete');
    assert.deepEqual(complete.pathParams, { courseId: 'sécurité incendie', contentId: 'vidéo #2' });
    assert.deepEqual(complete.body, { chapterId: '11', completed: false });
    assert.equal(state.mutationError, null);
    assert.ok(state.catalogResponse);
  });

  test('an identifier containing a slash is refused by the proxy before reaching the BFF', async () => {
    const { state, actions } = catalogState();

    await actions.completeContent('securite/incendie', 'chapitre-1', 'video-1');

    assert.equal(state.mutationError, 'Chemin invalide.');
    assert.deepEqual(runtime.frontCalls.map(({ pathname, status }) => [pathname, status]), [['/elearning/courses/securite%2Fincendie/contents/video-1/complete', 400]]);
    assert.equal(bffElearning.requests.length, 0);
  });

  test('rateCourse sends SubmitRatingBody then reloads the catalogue', async () => {
    bffElearning.on('post', '/elearning/courses/{courseId}/rating', { body: f.ratingResponse(4) });
    reloadCatalog();

    await catalogState().actions.rateCourse('4', 4);

    assert.deepEqual(operations(), ['POST /elearning/courses/{courseId}/rating', 'GET /elearning/catalog']);
    assert.deepEqual(bffElearning.requests[0].body, { rating: 4 });
  });

  test('admin create, update and delete use the contract operations and bodies', async () => {
    bffElearning.on('post', '/elearning/admin/courses', ({ body }) => ({ status: 201, body: { id: '1', course: body } }));
    bffElearning.on('patch', '/elearning/admin/courses/{courseId}', ({ body }) => ({ body: { id: '1', course: body } }));
    bffElearning.on('delete', '/elearning/admin/courses/{courseId}', ({ pathParams }) => ({ body: { deleted: true, courseId: pathParams.courseId } }));
    reloadCatalog();
    const { state, actions } = catalogState();

    // Le formulaire de lib-components type statusValue en chaîne libre : une valeur hors enum n'est pas envoyée.
    assert.equal(await actions.createCourse(f.course('9', { statusValue: 'brouillon' })), true);
    assert.equal(await actions.updateCourse(f.course('9', { statusValue: 'completed', title: 'Renommée' })), true);
    await actions.deleteCourse('9');

    assert.deepEqual(operations(), [
      'POST /elearning/admin/courses', 'GET /elearning/catalog',
      'PATCH /elearning/admin/courses/{courseId}', 'GET /elearning/catalog',
      'DELETE /elearning/admin/courses/{courseId}', 'GET /elearning/catalog',
    ]);
    const [create, , update, , remove] = bffElearning.requests;
    assert.equal('statusValue' in create.body, false);
    assert.deepEqual(update.pathParams, { courseId: '9' });
    assert.equal(update.body.statusValue, 'completed');
    assert.equal(update.body.title, 'Renommée');
    assert.equal(remove.body, undefined);
    assert.equal(state.mutationError, null);
  });

  test('a 501 of the BFF becomes the French not-implemented message and the catalogue is not reloaded (MAIR-513)', async () => {
    const { NOT_IMPLEMENTED_MESSAGE } = require('../src/lib/bff-client.ts');
    bffElearning.on('post', '/elearning/courses/{courseId}/rating', errorReply(501, 'NOT_IMPLEMENTED', 'Course ratings are not stored by the e-learning service yet.'));
    const { state, actions } = catalogState(f.catalogResponse());

    assert.equal(await actions.rateCourse('4', 5), false);

    assert.equal(state.mutationError, NOT_IMPLEMENTED_MESSAGE);
    assert.deepEqual(operations(), ['POST /elearning/courses/{courseId}/rating']);
  });

  test('a documented BFF error is shown as mutation error and the catalogue is not reloaded', async () => {
    bffElearning.on('post', '/elearning/admin/courses', errorReply(409, 'COURSE_ALREADY_EXISTS', 'Une formation porte déjà cet identifiant.'));
    const { state, actions } = catalogState();

    assert.equal(await actions.createCourse(f.course('doublon')), false);

    assert.equal(state.mutationError, 'Une formation porte déjà cet identifiant.');
    assert.deepEqual(operations(), ['POST /elearning/admin/courses']);
  });

  test('a rejected update stays unconfirmed, then a retry is confirmed without changing the contract', async () => {
    bffElearning.on('patch', '/elearning/admin/courses/{courseId}', errorReply(503, 'UNAVAILABLE', 'Enregistrement indisponible.'));
    const { state, actions } = catalogState();
    const course = f.course('edited-course', { title: 'Saisie conservée' });
    assert.equal(await actions.updateCourse(course), false);
    assert.equal(state.mutationError, 'Enregistrement indisponible.');
    assert.deepEqual(operations(), ['PATCH /elearning/admin/courses/{courseId}']);
    bffElearning.on('patch', '/elearning/admin/courses/{courseId}', ({ body }) => ({ body: { id: '1', course: body } }));
    reloadCatalog();
    assert.equal(await actions.updateCourse(course), true);
    assert.equal(state.mutationError, null);
    assert.deepEqual(bffElearning.requests[0].body, bffElearning.requests[1].body);
    assert.deepEqual(operations(), ['PATCH /elearning/admin/courses/{courseId}', 'PATCH /elearning/admin/courses/{courseId}', 'GET /elearning/catalog']);
  });

  for (const method of ['create', 'update']) {
    test(`${method} remains confirmed when only catalogue refresh fails; retry does not resend the saved course`, async () => {
      const verb = method === 'create' ? 'post' : 'patch';
      const path = method === 'create' ? '/elearning/admin/courses' : '/elearning/admin/courses/{courseId}';
      bffElearning.on(verb, path, ({ body }) => ({ status: method === 'create' ? 201 : 200, body: { id: '1', course: body } }));
      bffElearning.on('get', '/elearning/catalog', errorReply(503, 'UNAVAILABLE', 'Catalogue indisponible.'));
      const { state, actions } = catalogState();
      assert.equal(await actions[`${method}Course`](f.course('confirmed-course')), true);
      assert.equal(state.mutationError, null);
      assert.equal(state.error, 'Catalogue indisponible.');
      reloadCatalog();
      await actions.loadCatalog();
      assert.deepEqual(operations(), [`${verb.toUpperCase()} ${path}`, 'GET /elearning/catalog', 'GET /elearning/catalog']);
      assert.equal(state.error, null);
    });
  }

  for (const [label, reply, expected] of [
    ['a 500 ApiError', errorReply(500, 'INTERNAL_ERROR', 'Erreur interne du BFF.'), 'Erreur interne du BFF.'],
    ['a 502 ApiError', errorReply(502, 'USER_SERVICE_UNAVAILABLE', 'Le service utilisateur est indisponible.'), 'Le service utilisateur est indisponible.'],
    ['a non-JSON 500 body', { status: 500, raw: 'upstream crashed', contentType: 'text/plain', outOfContract: true }, 'Le service est momentanément indisponible. Veuillez réessayer plus tard.'],
    ['a blank 400 business message', { status: 400, body: { message: ' ' }, outOfContract: true }, 'La demande n’a pas pu aboutir. Veuillez réessayer.'],
    ['a dropped connection', { dropConnection: true }, 'Le service est indisponible.'],
  ]) {
    test(`loadCatalog reports ${label}`, async () => {
      bffElearning.on('get', '/elearning/catalog', reply);
      const { state, actions } = catalogState();

      await actions.loadCatalog();

      assert.equal(state.error, expected);
      assert.equal(state.catalogResponse, null);
      assert.deepEqual(state.loading, [true, false]);
    });
  }

  test('loadCatalog reports an unreachable BFF through the proxy 502', async () => {
    const offlineUrl = await unreachableUrl();
    front.offline.push(offlineUrl);
    process.env.BFF_ELEARNING_BASE_URL = offlineUrl;
    const { state, actions } = catalogState();

    await actions.loadCatalog();

    assert.equal(state.error, 'Le service est indisponible.');
    assert.deepEqual(runtime.frontCalls.map(({ status }) => status), [502]);
    assert.equal(bffElearning.requests.length, 0);
  });

  test('a 401 from the BFF returns to Login without logout without calling any other service', async () => {
    bffElearning.on('get', '/elearning/catalog', errorReply(401, 'UNAUTHORIZED', 'Session expirée ou invalide.'));
    front.window().localStorage.setItem('mairie360.auth.jwt', 'expired-jwt');
    front.window().localStorage.setItem('formation.draft', 'unfinished lesson');
    const { state, actions } = catalogState();

    await actions.loadCatalog();

    assert.equal(state.error, null);
    assert.deepEqual(runtime.frontCalls.map(({ method, pathname, route, status }) => [method, pathname, route, status]), [
      ['GET', '/elearning/catalog', 'src/app/[...path]/route.ts', 401],
      ['POST', '/api/auth/refresh', 'src/app/api/auth/refresh/route.ts', 401],
    ]);
    assert.equal(front.window().localStorage.getItem('mairie360.auth.jwt'), null);
    assert.equal(front.window().localStorage.getItem('formation.draft'), 'unfinished lesson');
    assert.deepEqual(front.window().location.assigned, [loginReturn()]);
  });

  test('a 401 on a mutation also returns to Login without logout instead of showing an error', async () => {
    bffElearning.on('post', '/elearning/courses/{courseId}/rating', errorReply(401, 'UNAUTHORIZED', 'Session expirée ou invalide.'));
    const { state, actions } = catalogState();

    await actions.rateCourse('4', 5);

    assert.equal(state.mutationError, null);
    assert.deepEqual(front.window().location.assigned, [loginReturn()]);
    assert.deepEqual(operations(), ['POST /elearning/courses/{courseId}/rating']);
  });

  test('an expired document returns through the canonical Login owner without cookie changes', () => {
    runtime.accessToken = f.accessToken(2, 1);
    const navigation = runtime.navigate('/?course=4');
    assert.equal(navigation.status, 307); assert.equal(navigation.setCookie, null);
    const target = new URL(navigation.location);
    assert.equal(target.searchParams.get('next'), '/?course=4');
    assert.equal(target.pathname, '/api/auth/resume');
    assert.equal(runtime.upstreamCalls.length, 0);
  });

  test('same-origin paths absent from the contract never reach the BFF', async () => {
    const unknown = await fetch('/elearning/unknown');
    const wrongMethod = await fetch('/elearning/admin/courses', { method: 'GET' });

    assert.equal(unknown.status, 404);
    assert.equal(wrongMethod.status, 405);
    assert.equal(wrongMethod.headers.get('Allow'), 'POST');
    assert.equal(bffElearning.requests.length, 0);
  });
});

describe('profile loading against the contract-driven BFF E-learning', () => {
  function profileState() {
    const state = { profile: null, loading: [], error: undefined };
    return { state, view: { setProfile: (profile) => { state.profile = profile; }, setLoading: (loading) => { state.loading.push(loading); }, setError: (message) => { state.error = message; } } };
  }

  test('loads the ElearningProfileResponse', async () => {
    const body = f.profileResponse(f.currentUser({ isAdmin: true, role: 'Admin' }));
    bffElearning.on('get', '/elearning/profile', { body });
    const { state, view } = profileState();

    await loadProfile(view, new AbortController().signal);

    assert.deepEqual(state, { profile: body, loading: [false], error: null });
    assert.deepEqual(operations(), ['GET /elearning/profile']);
  });

  test('shows the BFF error message', async () => {
    bffElearning.on('get', '/elearning/profile', errorReply(502, 'USER_SERVICE_UNAVAILABLE', 'Le service utilisateur est indisponible.'));
    const { state, view } = profileState();

    await loadProfile(view, new AbortController().signal);

    assert.deepEqual(state, { profile: null, loading: [false], error: 'Le service utilisateur est indisponible.' });
  });

  test('returns to Login without logout on 401', async () => {
    bffElearning.on('get', '/elearning/profile', errorReply(401, 'UNAUTHORIZED', 'Session expirée ou invalide.'));
    const { state, view } = profileState();

    await loadProfile(view, new AbortController().signal);

    assert.equal(state.error, undefined);
    assert.deepEqual(front.window().location.assigned, [loginReturn()]);
  });

  test('an aborted load neither calls the network nor updates the view', async () => {
    const controller = new AbortController();
    controller.abort();
    const { state, view } = profileState();

    await loadProfile(view, controller.signal);

    assert.deepEqual(state, { profile: null, loading: [], error: undefined });
    assert.equal(runtime.frontCalls.length, 0);
  });

  test('a non-Error failure falls back to the generic profile message', async () => {
    const { state, view } = profileState();
    const failing = { ...view, setProfile: () => { throw 'rendu impossible'; } };
    bffElearning.on('get', '/elearning/profile', { body: f.profileResponse() });

    await loadProfile(failing, new AbortController().signal);

    assert.equal(state.error, 'Le profil est indisponible.');
  });
});

describe('contract helpers', () => {
  test('pathSegment refuses a missing path parameter before any network call and encodes the others', () => {
    assert.throws(() => pathSegment('', 'courseId'), /Missing path parameter "courseId"/);
    assert.equal(pathSegment('a/b c', 'courseId'), 'a%2Fb%20c');
    assert.equal(runtime.frontCalls.length, 0);
  });

  test('toContractCourse keeps valid statuses and replaceCatalogCourse ignores an empty catalogue', () => {
    assert.equal(toContractCourse(f.course('c', { statusValue: 'in-progress' })).statusValue, 'in-progress');
    assert.equal('statusValue' in toContractCourse(f.course('c', { statusValue: undefined })), false);
    assert.equal(replaceCatalogCourse(null, f.course()), null);
  });

  test('an unexpected failure is reported with the generic message', async () => {
    bffElearning.on('post', '/elearning/courses/{courseId}/start', { body: { course: f.course() } });
    let mutationError;
    const actions = createCatalogActions({
      setLoading() {},
      setError() {},
      setMutationError: (message) => { mutationError = message; },
      setCatalogResponse: () => { throw new Error('rendu impossible'); },
    });

    await actions.startCourse('4');

    assert.equal(mutationError, 'Une erreur inattendue est survenue.');
  });
});

describe('logout and stored session without another BFF', () => {
  test('confirmed POST logout clears only known auth storage and returns to Login', async () => {
    confirmedOwner();
    storeAuthJwtToken(' session-jwt ');
    front.window().localStorage.setItem('mairie360.projects.jwt', 'legacy-jwt');
    front.window().localStorage.setItem('unrelated.preference', 'keep');
    assert.equal(front.window().localStorage.getItem('mairie360.auth.jwt'), 'session-jwt');

    await logout();

    assert.equal(front.window().localStorage.getItem('mairie360.auth.jwt'), null);
    assert.equal(front.window().localStorage.getItem('mairie360.projects.jwt'), null);
    assert.equal(front.window().localStorage.getItem('unrelated.preference'), 'keep');
    assert.deepEqual(front.window().location.assigned, [loginReturn()]);
    assert.deepEqual(runtime.owner.calls, [{ method: 'POST', path: '/api/auth/logout' }]);
    assert.equal(runtime.frontCalls.length, 1);
    assert.equal(bffElearning.requests.length, 0);
  });

  test('confirmed logout still navigates when storage is denied', async () => {
    confirmedOwner();
    front.window().localStorage.removeItem = () => { throw new Error('refusé'); };

    await logout();

    assert.deepEqual(front.window().location.assigned, [loginReturn()]);
  });

  test('stored JWT helpers migrate the legacy key and tolerate a missing window', () => {
    front.window().localStorage.setItem('mairie360.projects.jwt', 'legacy-jwt');
    assert.equal(getStoredAuthJwtToken(), 'legacy-jwt');
    assert.equal(front.window().localStorage.getItem('mairie360.auth.jwt'), 'legacy-jwt');
    storeAuthJwtToken('   ');
    assert.equal(front.window().localStorage.getItem('mairie360.auth.jwt'), null);
    clearStoredAuthJwtToken();
    assert.equal(front.window().localStorage.length, 0);
    assert.equal(formatBearerToken('Bearer abc'), 'Bearer abc');

    front.window().localStorage.getItem = () => { throw new Error('refusé'); };
    assert.equal(getStoredAuthJwtToken(), null);

    delete globalThis.window;
    assert.equal(getStoredAuthJwtToken(), null);
    assert.doesNotThrow(() => { storeAuthJwtToken('jwt'); clearStoredAuthJwtToken(); });
  });
});

describe('E-learning V2 reads and actions (MAIR-1144, MAIR-1149, MAIR-1150, MAIR-817)', () => {
  const { createInsightActions, remindersByCourse, remindersSentLabel } = require('../src/features/elearning/insightActions.ts');
  const { elearningLearnerPort, prepareResourceDownload } = require('../src/features/elearning/learnerFeatures.ts');
  const { fileNameFromDisposition } = require('../src/lib/elearning-api.ts');

  function insights() {
    const state = { trainingTime: [], adminStats: [], reports: [], saved: [], unauthorized: 0 };
    const actions = createInsightActions({
      setTrainingTime: (value, status) => state.trainingTime.push({ value, status }),
      setAdminStats: (value, status) => state.adminStats.push({ value, status }),
      report: (tone, title, message) => state.reports.push({ tone, title, message }),
    }, file => state.saved.push(file), async () => { state.unauthorized += 1; });
    return { state, actions };
  }
  const pdf = (name) => ({ raw: '%PDF-1.4 attestation', contentType: 'application/pdf', headers: { 'Content-Disposition': `attachment; filename="${name}"` } });

  test('the training time of a year is read with its year and replaces the loading state', async () => {
    const { state, actions } = insights();
    bffElearning.on('get', '/elearning/training-time', ({ url }) => ({ body: f.trainingTimeResponse(Number(url.searchParams.get('year'))) }));
    await actions.loadTrainingTime(2026);
    assert.equal(bffElearning.requests[0].url.searchParams.get('year'), '2026');
    assert.deepEqual(state.trainingTime.map(({ status }) => status), ['loading', 'default']);
    assert.equal(state.trainingTime[1].value.timeSpentSeconds, 8100);
    bffElearning.on('get', '/elearning/training-time', errorReply(503, 'UNAVAILABLE', 'E-learning API down'));
    await actions.loadTrainingTime(2026);
    assert.deepEqual(state.trainingTime.at(-1), { value: undefined, status: 'unavailable' });
  });

  test('the administrator indicators are read, an unavailable read keeps the page and a 401 leaves it', async () => {
    const { state, actions } = insights();
    await actions.loadAdminStats();
    assert.deepEqual(state.adminStats.at(-1), { value: f.adminStatsResponse(), status: 'default' });
    bffElearning.on('get', '/elearning/admin/stats', errorReply(502, 'BAD_GATEWAY', 'Upstream'));
    await actions.loadAdminStats();
    assert.deepEqual(state.adminStats.at(-1), { value: undefined, status: 'unavailable' });
    bffElearning.on('get', '/elearning/admin/stats', errorReply(401, 'UNAUTHORIZED', 'Session'));
    await actions.loadAdminStats();
    assert.equal(state.unauthorized, 1);
  });

  test('« Relancer » sends one reminder per course concerned, then reads the indicators again', async () => {
    const { state, actions } = insights();
    const agents = f.adminStatsResponse().lateAgents;
    assert.deepEqual(remindersByCourse(agents), [{ courseId: '4', userIds: ['42', '43'] }, { courseId: '7', userIds: ['44'] }]);
    bffElearning.on('post', '/elearning/admin/courses/{courseId}/reminders', ({ body }) => ({ body: { sent: body.userIds.length } }));
    const first = actions.remindLateAgents(agents);
    assert.equal(actions.remindLateAgents(agents), first, 'a second click shares the pending reminders');
    assert.equal(await first, true);
    const posts = bffElearning.calls('/elearning/admin/courses/{courseId}/reminders', 'POST');
    assert.deepEqual(posts.map(({ pathParams, body }) => [pathParams.courseId, body]).sort(), [['4', { userIds: ['42', '43'] }], ['7', { userIds: ['44'] }]]);
    assert.deepEqual(state.reports, [{ tone: 'success', title: 'Relances envoyées', message: '3 relances envoyées aux agents en retard.' }]);
    assert.equal(bffElearning.calls('/elearning/admin/stats', 'GET').length, 1);
    assert.equal(remindersSentLabel(1), '1 relance envoyée');
    assert.equal(await actions.remindLateAgents([]), false);
  });

  test('a refused course leaves the others reminded, and every refusal is reported without a re-read', async () => {
    const { state, actions } = insights();
    const agents = f.adminStatsResponse().lateAgents;
    bffElearning.on('post', '/elearning/admin/courses/{courseId}/reminders', ({ pathParams }) => pathParams.courseId === '7'
      ? errorReply(409, 'CONFLICT', 'Not mandatory') : { body: { sent: 2 } });
    assert.equal(await actions.remindLateAgents(agents), false);
    assert.equal(state.reports[0].title, 'Relances incomplètes');
    assert.match(state.reports[0].message, /2 relances envoyées ; 1 formation n’a pas pu être relancée/);
    bffElearning.on('post', '/elearning/admin/courses/{courseId}/reminders', errorReply(503, 'UNAVAILABLE', 'Down'));
    assert.equal(await actions.remindLateAgents(agents), false);
    assert.equal(state.reports[1].title, 'Relances non envoyées');
    assert.equal(bffElearning.calls('/elearning/admin/stats', 'GET').length, 1);
  });

  test('the attestations of the year are saved under the name the BFF gives; none completed is an information', async () => {
    const { state, actions } = insights();
    bffElearning.on('get', '/elearning/certificates', pdf('attestations-2026.pdf'));
    assert.equal(await actions.downloadYearCertificates(2026), true);
    assert.equal(bffElearning.requests[0].url.searchParams.get('year'), '2026');
    assert.equal(state.saved[0].fileName, 'attestations-2026.pdf');
    assert.equal(await state.saved[0].blob.text(), '%PDF-1.4 attestation');
    assert.equal(state.reports[0].title, 'Attestations téléchargées');
    bffElearning.on('get', '/elearning/certificates', errorReply(404, 'NOT_FOUND', 'Nothing completed'));
    assert.equal(await actions.downloadYearCertificates(2026), false);
    assert.deepEqual(state.reports[1], { tone: 'info', title: 'Aucune attestation pour cette année', message: 'Vous n’avez terminé aucune formation en 2026.' });
    bffElearning.on('get', '/elearning/certificates', errorReply(502, 'BAD_GATEWAY', 'Upstream'));
    assert.equal(await actions.downloadYearCertificates(2026), false);
    assert.equal(state.reports[2].tone, 'danger');
  });

  test('the attestation of a course is saved; a course not completed is refused with a French reason', async () => {
    const { state, actions } = insights();
    bffElearning.on('get', '/elearning/courses/{courseId}/certificate', { raw: '%PDF-1.4', contentType: 'application/pdf' });
    assert.equal(await actions.downloadCourseCertificate('4'), true);
    assert.equal(state.saved[0].fileName, 'attestation-4.pdf', 'without Content-Disposition the name is built locally');
    bffElearning.on('get', '/elearning/courses/{courseId}/certificate', errorReply(409, 'CONFLICT', 'Not completed'));
    assert.equal(await actions.downloadCourseCertificate('4'), false);
    assert.deepEqual(state.reports.at(-1), { tone: 'danger', title: 'Téléchargement impossible', message: 'L’attestation sera disponible une fois la formation terminée.' });
    assert.equal(fileNameFromDisposition("attachment; filename*=UTF-8''attestation%20%C3%A9t%C3%A9.pdf", 'x.pdf'), 'attestation été.pdf');
    assert.equal(fileNameFromDisposition('attachment', 'x.pdf'), 'x.pdf');
  });

  test('a stored file opens through its signed URL; an unsafe address is refused', async () => {
    bffElearning.on('get', '/elearning/courses/{courseId}/chapters/{chapterId}/contents/{contentId}/file', { body: { url: 'https://storage.example/signed?X-Amz=1' } });
    const signal = new AbortController().signal;
    const target = { courseId: '4', chapterId: '41', contentId: '411' };
    assert.deepEqual(await prepareResourceDownload(elearningLearnerPort, target, signal), { url: 'https://storage.example/signed?X-Amz=1' });
    assert.deepEqual(bffElearning.requests[0].pathParams, { courseId: '4', chapterId: '41', contentId: '411' });
    bffElearning.on('get', '/elearning/courses/{courseId}/chapters/{chapterId}/contents/{contentId}/file', { body: { url: 'javascript:alert(1)' } });
    await assert.rejects(prepareResourceDownload(elearningLearnerPort, target, signal), /pas sûre/);
  });

  test('a create refused field by field returns the fields to the form and does not reload the catalogue', async () => {
    const { state, actions } = catalogState(f.catalogResponse());
    bffElearning.on('post', '/elearning/admin/courses', {
      status: 400, outOfContract: true,
      body: f.apiError('BAD_REQUEST', 'Validation failed', [{ path: 'body.details.chapters.0.contents.0.href', message: 'A link needs an absolute https:// URL.' }]),
    });
    const result = await actions.createCourse(f.course('draft-1'));
    assert.deepEqual(result, { fieldErrors: [{ path: 'body.details.chapters.0.contents.0.href', message: 'A link needs an absolute https:// URL.' }] });
    assert.match(state.mutationError, /Certains champs/);
    assert.deepEqual(operations(), ['POST /elearning/admin/courses']);
  });
});

describe('Enrolment of agents by the administrator (MAIR-817)', () => {
  const { agentName, appendPage, createEnrolmentActions, enrolmentSummary, LEARNERS_PAGE, AGENTS_PAGE } = require('../src/features/elearning/enrolmentActions.ts');

  function enrolment() {
    const state = { reports: [], unauthorized: 0 };
    const actions = createEnrolmentActions((tone, title, message) => state.reports.push({ tone, title, message }), async () => { state.unauthorized += 1; });
    return { state, actions };
  }

  test('the learners of a course are read a page at a time; an unreadable page is null, a 401 leaves the page', async () => {
    const { state, actions } = enrolment();
    bffElearning.on('get', '/elearning/admin/courses/{courseId}/learners', ({ url, pathParams }) => ({
      body: {
        courseId: pathParams.courseId, total: 51, limit: Number(url.searchParams.get('limit')), offset: Number(url.searchParams.get('offset')),
        nextOffset: 50, learners: [f.courseLearner('42', 'Alice', 'Martin', { status: 'in-progress', progress: 50 })],
      },
    }));
    const page = await actions.loadLearners('4');
    assert.deepEqual(page, { items: [f.courseLearner('42', 'Alice', 'Martin', { status: 'in-progress', progress: 50 })], total: 51, nextOffset: 50 });
    const [read] = bffElearning.calls('/elearning/admin/courses/{courseId}/learners', 'GET');
    assert.equal(read.url.searchParams.get('limit'), String(LEARNERS_PAGE));
    assert.equal(read.url.searchParams.get('offset'), '0');
    bffElearning.on('get', '/elearning/admin/courses/{courseId}/learners', errorReply(502, 'BAD_GATEWAY', 'Upstream'));
    assert.equal(await actions.loadLearners('4', 50), null);
    bffElearning.on('get', '/elearning/admin/courses/{courseId}/learners', errorReply(401, 'UNAUTHORIZED', 'Session'));
    assert.equal(await actions.loadLearners('4'), null);
    assert.equal(state.unauthorized, 1);
    assert.deepEqual(state.reports, [], 'a read reports in the drawer, not as a toast');
  });

  test('the picker searches the agents who do not follow the course', async () => {
    const { actions } = enrolment();
    bffElearning.on('get', '/elearning/admin/agents', { body: { agents: [f.agent('50', 'Chloé', 'Durand')], limit: AGENTS_PAGE, offset: 0, nextOffset: null } });
    assert.deepEqual(await actions.searchAgents('4', '  chlo '), { items: [f.agent('50', 'Chloé', 'Durand')], nextOffset: null });
    const [search] = bffElearning.calls('/elearning/admin/agents', 'GET');
    assert.equal(search.url.searchParams.get('search'), 'chlo');
    assert.equal(search.url.searchParams.get('excludeCourseId'), '4');
    assert.equal(search.url.searchParams.get('limit'), String(AGENTS_PAGE));
    await actions.searchAgents('4', '', 20);
    const second = bffElearning.calls('/elearning/admin/agents', 'GET')[1];
    assert.equal(second.url.searchParams.has('search'), false);
    assert.equal(second.url.searchParams.get('offset'), '20');
    bffElearning.on('get', '/elearning/admin/agents', errorReply(503, 'SERVICE_UNAVAILABLE', 'Down'));
    assert.equal(await actions.searchAgents('4', 'x'), null);
    const aborted = new AbortController();
    aborted.abort();
    await assert.rejects(actions.searchAgents('4', 'x', 0, { signal: aborted.signal }), { name: 'AbortError' });
  });

  test('« Inscrire » reports who was enrolled, a click twice shares the request, a refusal is told in French', async () => {
    const { state, actions } = enrolment();
    bffElearning.on('post', '/elearning/admin/courses/{courseId}/learners', ({ pathParams, body }) => ({
      body: { courseId: pathParams.courseId, enrolled: body.userIds.slice(1), alreadyEnrolled: body.userIds.slice(0, 1), failed: [] },
    }));
    const first = actions.enrol('4', ['42', '50', '51']);
    assert.equal(actions.enrol('4', ['42', '50', '51']), first);
    const other = actions.enrol('4', ['60']);
    assert.notEqual(other, first, 'another selection is not the pending one');
    assert.deepEqual(await Promise.all([first, other]), [true, true]);
    const posts = bffElearning.calls('/elearning/admin/courses/{courseId}/learners', 'POST').map(({ body }) => body.userIds);
    assert.deepEqual(posts.sort(), [['42', '50', '51'], ['60']]);
    assert.ok(state.reports.some((report) => report.message === '2 agents inscrits ; 1 agent déjà inscrit.'));
    state.reports.length = 0;
    assert.equal(await actions.enrol('4', []), false);

    bffElearning.on('post', '/elearning/admin/courses/{courseId}/learners', { body: { courseId: '4', enrolled: ['50'], alreadyEnrolled: [], failed: ['51', '52'] } });
    assert.equal(await actions.enrol('4', ['50', '51', '52']), false);
    assert.deepEqual(state.reports[0], { tone: 'danger', title: 'Inscription incomplète', message: '1 agent inscrit ; 2 inscriptions impossibles.' });
    bffElearning.on('post', '/elearning/admin/courses/{courseId}/learners', { body: { courseId: '4', enrolled: [], alreadyEnrolled: [], failed: ['51'] } });
    assert.equal(await actions.enrol('4', ['51']), false);
    assert.equal(state.reports[1].title, 'Inscription impossible');
    bffElearning.on('post', '/elearning/admin/courses/{courseId}/learners', errorReply(404, 'NOT_FOUND', 'Course not found.'));
    assert.equal(await actions.enrol('4', ['51']), false);
    assert.deepEqual(state.reports[2], { tone: 'danger', title: 'Inscription impossible', message: 'Cette formation n’existe plus.' });
    bffElearning.on('post', '/elearning/admin/courses/{courseId}/learners', errorReply(401, 'UNAUTHORIZED', 'Session'));
    assert.equal(await actions.enrol('4', ['51']), false);
    assert.equal(state.unauthorized, 1);
    assert.equal(state.reports.length, 3);
  });

  test('« Désinscrire » removes the learner; one already gone counts as done', async () => {
    const { state, actions } = enrolment();
    const learner = f.courseLearner('43', 'Bruno', 'Petit');
    bffElearning.on('delete', '/elearning/admin/courses/{courseId}/learners/{userId}', ({ pathParams }) => ({ body: { removed: true, ...pathParams } }));
    assert.equal(await actions.remove('4', learner), true);
    assert.deepEqual(bffElearning.calls('/elearning/admin/courses/{courseId}/learners/{userId}', 'DELETE')[0].pathParams, { courseId: '4', userId: '43' });
    assert.deepEqual(state.reports[0], { tone: 'success', title: 'Agent désinscrit', message: 'Bruno Petit ne suit plus cette formation.' });
    bffElearning.on('delete', '/elearning/admin/courses/{courseId}/learners/{userId}', errorReply(404, 'NOT_FOUND', 'Enrolment not found.'));
    assert.equal(await actions.remove('4', learner), true);
    assert.equal(state.reports[1].tone, 'info');
    bffElearning.on('delete', '/elearning/admin/courses/{courseId}/learners/{userId}', errorReply(502, 'BAD_GATEWAY', 'Upstream'));
    assert.equal(await actions.remove('4', learner), false);
    assert.equal(state.reports[2].title, 'Désinscription impossible');
    bffElearning.on('delete', '/elearning/admin/courses/{courseId}/learners/{userId}', errorReply(401, 'UNAUTHORIZED', 'Session'));
    assert.equal(await actions.remove('4', learner), false);
    assert.equal(state.unauthorized, 1);
  });

  test('names, summaries and pages', () => {
    assert.equal(agentName({ firstName: '', lastName: '', name: 'Solo' }), 'Solo');
    assert.equal(enrolmentSummary({ enrolled: [], alreadyEnrolled: ['1', '2'], failed: [] }), '2 agents déjà inscrits');
    assert.deepEqual(appendPage([{ userId: '1' }], [{ userId: '1' }, { userId: '2' }]), [{ userId: '1' }, { userId: '2' }]);
  });
});

describe('A 401 whose redirect to Login cannot start is told to the agent', () => {
  const { createEnrolmentActions } = require('../src/features/elearning/enrolmentActions.ts');
  const { createInsightActions } = require('../src/features/elearning/insightActions.ts');
  const { LOGIN_UNAVAILABLE_MESSAGE, LOGIN_UNAVAILABLE_TITLE } = require('../src/features/elearning/session-expiry.ts');

  test('a refused navigation reports the expired session once per action, a redirect under way says nothing', async () => {
    const reports = [];
    const enrolment = createEnrolmentActions((tone, title, message) => reports.push({ tone, title, message }));
    const location = front.window().location;
    const assign = location.assign;
    location.assign = () => { throw new Error('navigation blocked'); };
    try {
      bffElearning.on('delete', '/elearning/admin/courses/{courseId}/learners/{userId}', errorReply(401, 'UNAUTHORIZED', 'Session expirée'));
      assert.equal(await enrolment.remove('4', f.courseLearner('43', 'Bruno', 'Petit')), false);
      assert.deepEqual(reports, [{ tone: 'danger', title: LOGIN_UNAVAILABLE_TITLE, message: LOGIN_UNAVAILABLE_MESSAGE }]);
    } finally {
      location.assign = assign;
    }

    // The redirect starts this time; a second 401 meanwhile adds no message.
    const insightReports = [];
    const insights = createInsightActions({ report: (tone, title, message) => insightReports.push({ tone, title, message }) }, () => {});
    bffElearning.on('post', '/elearning/admin/courses/{courseId}/learners', errorReply(401, 'UNAUTHORIZED', 'Session expirée'));
    assert.equal(await enrolment.enrol('4', ['50']), false);
    assert.deepEqual(front.window().location.assigned, [loginReturn()]);
    bffElearning.on('get', '/elearning/admin/stats', errorReply(401, 'UNAUTHORIZED', 'Session expirée'));
    await insights.loadAdminStats();
    assert.equal(reports.length, 1);
    assert.deepEqual(insightReports, []);
  });

  test('the catalogue and the profile show it where they show their errors', async () => {
    const location = front.window().location;
    const assign = location.assign;
    location.assign = () => { throw new Error('navigation blocked'); };
    try {
      const { state, actions } = catalogState(f.catalogResponse());
      bffElearning.on('post', '/elearning/courses/{courseId}/start', errorReply(401, 'UNAUTHORIZED', 'Session expirée'));
      await actions.startCourse('4');
      assert.equal(state.mutationError, LOGIN_UNAVAILABLE_MESSAGE);
      const profile = { error: undefined };
      bffElearning.on('get', '/elearning/profile', errorReply(401, 'UNAUTHORIZED', 'Session expirée'));
      await loadProfile({ setProfile() {}, setLoading() {}, setError: (message) => { profile.error = message; } }, new AbortController().signal);
      assert.equal(profile.error, LOGIN_UNAVAILABLE_MESSAGE);
    } finally {
      location.assign = assign;
    }
  });
});
