const assert = require('node:assert/strict');
const { after, afterEach, before, beforeEach, describe, test } = require('node:test');
require('./support/load-typescript.cjs');
const { unreachableUrl } = require('./support/contract-mock-server.ts');
const f = require('./support/elearning-fixtures.ts');
const { errorReply, useMockedFront } = require('./support/mocked-front.ts');
const { createCatalogActions, replaceCatalogCourse, toContractCourse } = require('../src/features/elearning/catalogActions.ts');
const { loadProfile } = require('../src/features/elearning/profileActions.ts');
const { contractUrl } = require('../src/lib/elearning-api.ts');
const { LOGOUT_PATH, logout } = require('../src/lib/auth-session.ts');
const { clearStoredAuthJwtToken, formatBearerToken, getStoredAuthJwtToken, storeAuthJwtToken } = require('../src/lib/auth-token.ts');

// Les actions du catalogue et du profil (celles branchées par ElearningModule.tsx / ProfileModule.tsx) sont
// exécutées de bout en bout : fetch navigateur -> middleware -> src/app/[...path]/route.ts -> proxy -> BFF E-learning
// simulé depuis le paquet publié @mairie360/bff-elearning-openapi. C'est le seul service que le front peut joindre :
// le mock refuse toute requête absente du contrat et valide ses réponses de succès ; les erreurs passent par errorReply.

const front = useMockedFront({ before, after, beforeEach, afterEach });
const { bffElearning, runtime } = front;
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

describe('catalog actions against the contract-driven BFF E-learning', () => {
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

  test('a JWT stored in localStorage is sent instead of the cookie session', async () => {
    front.window().localStorage.setItem('mairie360.auth.jwt', 'stored-jwt');
    reloadCatalog();

    await catalogState().actions.loadCatalog();

    assert.equal(bffElearning.requests[0].headers.authorization, 'Bearer stored-jwt');
  });

  test('startCourse posts the StartCourseBody and replaces the course in place without reloading', async () => {
    const started = f.course('rgpd-collectivites', { statusValue: 'in-progress', progress: 10 });
    bffElearning.on('post', '/elearning/courses/{courseId}/start', { body: { course: started } });
    const { state, actions } = catalogState(f.catalogResponse([f.course(), f.course('accueil')]));

    await actions.startCourse('rgpd-collectivites');

    assert.deepEqual(operations(), ['POST /elearning/courses/{courseId}/start']);
    assert.deepEqual(bffElearning.requests[0].pathParams, { courseId: 'rgpd-collectivites' });
    assert.deepEqual(bffElearning.requests[0].body, {});
    assert.equal(bffElearning.requests[0].headers['content-type'], 'application/json');
    assert.deepEqual(state.catalogResponse.catalog.courses.map((course) => [course.id, course.statusValue]), [['rgpd-collectivites', 'in-progress'], ['accueil', 'not-started']]);
    assert.equal(state.mutationError, null);
  });

  test('completeContent encodes path parameters, sends CompleteContentBody, then reloads the catalogue', async () => {
    bffElearning.on('post', '/elearning/courses/{courseId}/contents/{contentId}/complete', { body: f.contentCompleteResponse() });
    reloadCatalog();
    const { state, actions } = catalogState();

    await actions.completeContent('sécurité incendie', 'chapitre 1', 'vidéo #2', false);

    assert.deepEqual(operations(), ['POST /elearning/courses/{courseId}/contents/{contentId}/complete', 'GET /elearning/catalog']);
    const [complete] = bffElearning.requests;
    assert.equal(complete.url.pathname, '/elearning/courses/s%C3%A9curit%C3%A9%20incendie/contents/vid%C3%A9o%20%232/complete');
    assert.deepEqual(complete.pathParams, { courseId: 'sécurité incendie', contentId: 'vidéo #2' });
    assert.deepEqual(complete.body, { chapterId: 'chapitre 1', completed: false });
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

    await catalogState().actions.rateCourse('rgpd-collectivites', 4);

    assert.deepEqual(operations(), ['POST /elearning/courses/{courseId}/rating', 'GET /elearning/catalog']);
    assert.deepEqual(bffElearning.requests[0].body, { rating: 4 });
  });

  test('admin create, update and delete use the contract operations and bodies', async () => {
    bffElearning.on('post', '/elearning/admin/courses', ({ body }) => ({ status: 201, body: { course: body } }));
    bffElearning.on('patch', '/elearning/admin/courses/{courseId}', ({ body }) => ({ body: { course: body } }));
    bffElearning.on('delete', '/elearning/admin/courses/{courseId}', ({ pathParams }) => ({ body: { deleted: true, courseId: pathParams.courseId } }));
    reloadCatalog();
    const { state, actions } = catalogState();

    // Le formulaire de lib-components type statusValue en chaîne libre : une valeur hors enum n'est pas envoyée.
    await actions.createCourse(f.course('nouvelle-formation', { statusValue: 'brouillon' }));
    await actions.updateCourse(f.course('nouvelle-formation', { statusValue: 'completed', title: 'Renommée' }));
    await actions.deleteCourse('nouvelle-formation');

    assert.deepEqual(operations(), [
      'POST /elearning/admin/courses', 'GET /elearning/catalog',
      'PATCH /elearning/admin/courses/{courseId}', 'GET /elearning/catalog',
      'DELETE /elearning/admin/courses/{courseId}', 'GET /elearning/catalog',
    ]);
    const [create, , update, , remove] = bffElearning.requests;
    assert.equal('statusValue' in create.body, false);
    assert.deepEqual(update.pathParams, { courseId: 'nouvelle-formation' });
    assert.equal(update.body.statusValue, 'completed');
    assert.equal(update.body.title, 'Renommée');
    assert.equal(remove.body, undefined);
    assert.equal(state.mutationError, null);
  });

  test('a documented BFF error is shown as mutation error and the catalogue is not reloaded', async () => {
    bffElearning.on('post', '/elearning/admin/courses', errorReply(409, 'COURSE_ALREADY_EXISTS', 'Une formation porte déjà cet identifiant.'));
    const { state, actions } = catalogState();

    await actions.createCourse(f.course('doublon'));

    assert.equal(state.mutationError, 'Une formation porte déjà cet identifiant.');
    assert.deepEqual(operations(), ['POST /elearning/admin/courses']);
  });

  for (const [label, reply, expected] of [
    ['a 500 ApiError', errorReply(500, 'INTERNAL_ERROR', 'Erreur interne du BFF.'), 'Erreur interne du BFF.'],
    ['a 502 ApiError', errorReply(502, 'USER_SERVICE_UNAVAILABLE', 'Le service utilisateur est indisponible.'), 'Le service utilisateur est indisponible.'],
    ['a non-JSON 500 body', { status: 500, raw: 'upstream crashed', contentType: 'text/plain', outOfContract: true }, 'Le service e-learning a répondu avec le statut 500.'],
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

  test('a 401 from the BFF logs out without calling any other service', async () => {
    bffElearning.on('get', '/elearning/catalog', errorReply(401, 'UNAUTHORIZED', 'Session expirée ou invalide.'));
    front.window().localStorage.setItem('mairie360.auth.jwt', 'expired-jwt');
    const { state, actions } = catalogState();

    await actions.loadCatalog();

    assert.equal(state.error, null);
    assert.deepEqual(runtime.frontCalls.map(({ method, pathname, route, status }) => [method, pathname, route, status]), [
      ['GET', '/elearning/catalog', 'src/app/[...path]/route.ts', 401],
    ]);
    assert.equal(front.window().localStorage.length, 0);
    assert.deepEqual(front.window().location.assigned, [LOGOUT_PATH]);
  });

  test('a 401 on a mutation also logs out instead of showing an error', async () => {
    bffElearning.on('post', '/elearning/courses/{courseId}/rating', errorReply(401, 'UNAUTHORIZED', 'Session expirée ou invalide.'));
    const { state, actions } = catalogState();

    await actions.rateCourse('rgpd-collectivites', 5);

    assert.equal(state.mutationError, null);
    assert.deepEqual(front.window().location.assigned, [LOGOUT_PATH]);
    assert.deepEqual(operations(), ['POST /elearning/courses/{courseId}/rating']);
  });

  test('an expired session is redirected to Login by the middleware before reaching any BFF', async () => {
    runtime.accessToken = f.accessToken(2, 1);
    const { state, actions } = catalogState();

    await actions.loadCatalog();

    assert.equal(state.error, 'Une erreur inattendue est survenue.');
    assert.equal(runtime.frontCalls[0].status, 307);
    assert.match(runtime.frontCalls[0].redirectedTo, /^https:\/\/login\.mairie\.test\//);
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

  test('logs out on 401', async () => {
    bffElearning.on('get', '/elearning/profile', errorReply(401, 'UNAUTHORIZED', 'Session expirée ou invalide.'));
    const { state, view } = profileState();

    await loadProfile(view, new AbortController().signal);

    assert.equal(state.error, undefined);
    assert.deepEqual(front.window().location.assigned, [LOGOUT_PATH]);
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
  test('contractUrl refuses a missing path parameter before any network call', () => {
    assert.throws(() => contractUrl('/elearning/courses/{courseId}/start', {}), /Paramètre de chemin "courseId" manquant/);
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

    await actions.startCourse('rgpd-collectivites');

    assert.equal(mutationError, 'Une erreur inattendue est survenue.');
  });
});

describe('logout and stored session without another BFF', () => {
  test('logout clears local storage, then /logout clears the cookie and redirects to Login', async () => {
    storeAuthJwtToken(' session-jwt ');
    assert.equal(front.window().localStorage.getItem('mairie360.auth.jwt'), 'session-jwt');

    await logout();

    assert.equal(front.window().localStorage.length, 0);
    assert.deepEqual(front.window().location.assigned, ['/logout']);
    const navigation = runtime.navigate(LOGOUT_PATH);
    assert.equal(navigation.status, 307);
    assert.match(navigation.location, /^https:\/\/login\.mairie\.test\//);
    assert.match(navigation.setCookie, /accessToken=;/);
    assert.equal(runtime.frontCalls.length, 0);
    assert.equal(bffElearning.requests.length, 0);
  });

  test('logout still navigates when storage is denied', async () => {
    front.window().localStorage.clear = () => { throw new Error('refusé'); };

    await logout();

    assert.deepEqual(front.window().location.assigned, [LOGOUT_PATH]);
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
