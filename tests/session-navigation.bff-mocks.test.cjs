const assert = require('node:assert/strict');
const { after, afterEach, before, beforeEach, test } = require('node:test');
require('./support/load-typescript.cjs');
const f = require('./support/elearning-fixtures.ts');
const { errorReply, useMockedFront } = require('./support/mocked-front.ts');
const { requestBff, BffRequestError } = require('../src/lib/bff-client.ts');

const front = useMockedFront({ before, after, beforeEach, afterEach });
const { runtime, bffElearning } = front;
const oldLogin = process.env.LOGIN_FRONT_URL;
beforeEach(() => { process.env.LOGIN_FRONT_URL = 'https://login.mairie.test/'; });
afterEach(() => {
  if (oldLogin === undefined) delete process.env.LOGIN_FRONT_URL;
  else process.env.LOGIN_FRONT_URL = oldLogin;
});

test('an expired catalogue fetch reloads the current document, not the data endpoint', async () => {
  runtime.accessToken = undefined;
  const browser = front.window();
  browser.location.href = 'https://elearning.test.example/?course=rgpd-collectivites';
  await assert.rejects(requestBff('/elearning/catalog'), BffRequestError);
  assert.deepEqual(browser.location.assigned, [browser.location.href]);
  assert.equal(runtime.frontCalls[0].status, 307);
  assert.equal(bffElearning.requests.length, 0);
});

test('parallel expired requests navigate only once and never replay the mutation', async () => {
  runtime.accessToken = undefined;
  await Promise.allSettled([
    requestBff('/elearning/catalog'),
    requestBff('/elearning/courses/rgpd-collectivites/start', { method: 'POST' }),
  ]);
  assert.deepEqual(front.window().location.assigned, [front.window().location.href]);
  assert.equal(runtime.frontCalls.length, 2);
  assert.equal(bffElearning.requests.length, 0);
});

test('opaque redirects are handled without inspecting hidden status, headers or body', async () => {
  const fetchBefore = global.fetch;
  let calls = 0;
  global.fetch = async (_path, init) => {
    calls += 1;
    assert.equal(init.redirect, 'manual');
    return {
      type: 'opaqueredirect',
      get ok() { assert.fail('opaque ok must not be inspected'); },
      get status() { assert.fail('opaque status must not be inspected'); },
      get headers() { assert.fail('opaque headers must not be inspected'); },
      json() { assert.fail('opaque body must not be read'); },
    };
  };
  try {
    await assert.rejects(requestBff('/elearning/catalog'), BffRequestError);
    assert.equal(calls, 1);
    assert.deepEqual(front.window().location.assigned, [front.window().location.href]);
  } finally { global.fetch = fetchBefore; }
});

test('aborted requests cannot reload the document after a late redirect', async () => {
  const fetchBefore = global.fetch;
  const controller = new AbortController();
  let calls = 0;
  global.fetch = async () => {
    calls += 1;
    controller.abort();
    return { type: 'opaqueredirect' };
  };
  try {
    await assert.rejects(requestBff('/elearning/catalog', { signal: controller.signal }), { name: 'AbortError' });
    assert.equal(calls, 1);
    assert.deepEqual(front.window().location.assigned, []);
  } finally { global.fetch = fetchBefore; }
});

test('an already aborted request makes no network call or document navigation', async () => {
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(requestBff('/elearning/catalog', { signal: controller.signal }), { name: 'AbortError' });
  assert.equal(runtime.frontCalls.length, 0);
  assert.deepEqual(front.window().location.assigned, []);
});

for (const status of [400, 401, 403, 503]) {
  test(`a real service ${status} stays typed and never triggers redirect recovery or replay`, async () => {
    bffElearning.on('post', '/elearning/courses/{courseId}/start', errorReply(status, 'REFUSED', `Refus ${status}`));
    await assert.rejects(requestBff('/elearning/courses/rgpd-collectivites/start', { method: 'POST' }),
      error => error instanceof BffRequestError && error.status === status && error.message === `Refus ${status}`);
    assert.equal(bffElearning.requests.length, 1);
    assert.deepEqual(front.window().location.assigned, []);
  });
}

test('successful requests preserve caller headers, cache, credentials and abort signal', async () => {
  const fetchBefore = global.fetch;
  const controller = new AbortController();
  const expected = f.catalogResponse();
  global.fetch = async (_path, init) => {
    assert.equal(init.headers.get('Authorization'), 'Bearer explicit');
    assert.equal(init.credentials, 'same-origin');
    assert.equal(init.cache, 'no-store');
    assert.equal(init.signal, controller.signal);
    assert.equal(init.redirect, 'manual');
    return new Response(JSON.stringify(expected), { headers: { 'Content-Type': 'application/json' } });
  };
  try {
    assert.deepEqual(await requestBff('/elearning/catalog', {
      headers: { Authorization: 'Bearer explicit' }, credentials: 'same-origin', cache: 'no-store', signal: controller.signal,
    }), expected);
    assert.deepEqual(front.window().location.assigned, []);
  } finally { global.fetch = fetchBefore; }
});
