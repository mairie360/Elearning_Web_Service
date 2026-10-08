const assert = require('node:assert/strict');
const { after, afterEach, before, beforeEach, test } = require('node:test');
require('./support/load-typescript.cjs');
const f = require('./support/elearning-fixtures.ts');
const { errorReply, useMockedFront } = require('./support/mocked-front.ts');
const { requestBff } = require('../src/lib/bff-client.ts');
const { createCatalogActions } = require('../src/features/elearning/catalogActions.ts');

const front = useMockedFront({ before, after, beforeEach, afterEach });
const { bffElearning, runtime } = front;
const primaryKey = 'mairie360.auth.jwt';
const legacyKey = 'mairie360.projects.jwt';
const savedLoginUrl = process.env.LOGIN_FRONT_URL;
beforeEach(() => { process.env.LOGIN_FRONT_URL = 'https://login.mairie.test/'; });
afterEach(() => {
  if (savedLoginUrl === undefined) delete process.env.LOGIN_FRONT_URL;
  else process.env.LOGIN_FRONT_URL = savedLoginUrl;
});

function catalogue() {
  const response = f.catalogResponse();
  bffElearning.on('get', '/elearning/catalog', { body: response });
  return response;
}

function actions() {
  const state = { response: null, error: null, mutationError: null };
  return {
    state,
    actions: createCatalogActions({
      setCatalogResponse: (update) => { state.response = update(state.response); },
      setLoading: () => {},
      setError: (value) => { state.error = value; },
      setMutationError: (value) => { state.mutationError = value; },
    }),
  };
}

test('catalogue reads ignore the primary stored JWT and retain unrelated browser data', async () => {
  const storage = front.window().localStorage;
  storage.setItem(primaryKey, 'stale-primary-token');
  storage.setItem('unrelated.preference', 'keep');
  const expected = catalogue();
  assert.deepEqual(await requestBff('/elearning/catalog'), expected);
  assert.equal(bffElearning.requests[0].headers.authorization, `Bearer ${runtime.accessToken}`);
  assert.equal(storage.getItem(primaryKey), 'stale-primary-token');
  assert.equal(storage.getItem('unrelated.preference'), 'keep');
});

test('catalogue reads do not migrate a legacy stored JWT into the primary key', async () => {
  const storage = front.window().localStorage;
  storage.setItem(legacyKey, 'stale-legacy-token');
  catalogue();
  await requestBff('/elearning/catalog');
  assert.equal(bffElearning.requests[0].headers.authorization, `Bearer ${runtime.accessToken}`);
  assert.equal(storage.getItem(primaryKey), null);
  assert.equal(storage.getItem(legacyKey), 'stale-legacy-token');
});

test('ordinary requests never access localStorage even when the property is denied', async () => {
  let accesses = 0;
  Object.defineProperty(front.window(), 'localStorage', {
    get() { accesses += 1; throw new Error('Storage is denied'); },
  });
  const expected = catalogue();
  assert.deepEqual(await requestBff('/elearning/catalog'), expected);
  assert.equal(accesses, 0);
  assert.equal(bffElearning.requests[0].headers.authorization, `Bearer ${runtime.accessToken}`);
});

test('learner start and the following catalogue read both use the current cookie', async () => {
  front.window().localStorage.setItem(primaryKey, 'stale-primary-token');
  front.window().localStorage.setItem(legacyKey, 'stale-legacy-token');
  bffElearning.on('post', '/elearning/courses/{courseId}/start', { body: { course: f.course() } });
  catalogue();
  const controller = actions();
  await controller.actions.startCourse('rgpd-collectivites');
  assert.deepEqual(bffElearning.requests.map(({ method, template }) => [method, template]), [
    ['POST', '/elearning/courses/{courseId}/start'], ['GET', '/elearning/catalog'],
  ]);
  for (const request of bffElearning.requests) {
    assert.equal(request.headers.authorization, `Bearer ${runtime.accessToken}`);
    assert.equal(request.headers.cookie, undefined);
  }
  assert.equal(controller.state.mutationError, null);
});

test('administrator creation and its refresh use the cookie rather than a legacy JWT', async () => {
  front.window().localStorage.setItem(legacyKey, 'stale-legacy-token');
  const course = f.course();
  bffElearning.on('post', '/elearning/admin/courses', { body: { course } });
  catalogue();
  const controller = actions();
  assert.equal(await controller.actions.createCourse(course), true);
  assert.deepEqual(bffElearning.requests.map(({ method, template }) => [method, template]), [
    ['POST', '/elearning/admin/courses'], ['GET', '/elearning/catalog'],
  ]);
  for (const request of bffElearning.requests) {
    assert.equal(request.headers.authorization, `Bearer ${runtime.accessToken}`);
  }
  assert.equal(front.window().localStorage.getItem(primaryKey), null);
});

test('an explicitly supplied Authorization header remains unchanged', async () => {
  front.window().localStorage.setItem(primaryKey, 'stale-primary-token');
  catalogue();
  await requestBff('/elearning/catalog', { headers: { Authorization: 'Bearer explicit-caller-token' } });
  assert.equal(bffElearning.requests[0].headers.authorization, 'Bearer explicit-caller-token');
});

test('stored JWTs cannot replace a missing cookie or bypass the existing middleware gate', async () => {
  runtime.accessToken = undefined;
  front.window().localStorage.setItem(primaryKey, 'stale-primary-token');
  front.window().localStorage.setItem(legacyKey, 'stale-legacy-token');
  let reads = 0;
  front.window().localStorage.getItem = () => { reads += 1; return 'stale-primary-token'; };
  await assert.rejects(requestBff('/elearning/catalog'), /Redirection vers la connexion/);
  assert.equal(reads, 0);
  assert.equal(runtime.frontCalls[0].status, 307);
  assert.equal(bffElearning.requests.length, 0);
  assert.deepEqual(front.window().location.assigned, [front.window().location.href]);
  assert.equal(runtime.upstreamCalls.length, 0);
});

test('a real cookie-session refusal still logs out and removes only known stored tokens', async () => {
  const storage = front.window().localStorage;
  storage.setItem(primaryKey, 'stale-primary-token');
  storage.setItem(legacyKey, 'stale-legacy-token');
  storage.setItem('unrelated.preference', 'keep');
  bffElearning.on('get', '/elearning/catalog', errorReply(401, 'UNAUTHORIZED', 'Session refusée.'));
  const controller = actions();
  await controller.actions.loadCatalog();
  assert.equal(bffElearning.requests[0].headers.authorization, `Bearer ${runtime.accessToken}`);
  assert.deepEqual(front.window().location.assigned, ['/logout']);
  assert.equal(storage.getItem(primaryKey), null);
  assert.equal(storage.getItem(legacyKey), null);
  assert.equal(storage.getItem('unrelated.preference'), 'keep');
  assert.equal(controller.state.response, null);
  assert.equal(controller.state.error, null);
});
