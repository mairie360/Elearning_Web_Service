const assert = require('node:assert/strict');
const { afterEach, test } = require('node:test');
require('./support/load-typescript.cjs');
const { logout, LOGOUT_PATH } = require('../src/lib/auth-session.ts');

afterEach(() => { delete global.window; });

test('logout removes only auth tokens and keeps unrelated browser data', async () => {
  const store = new Map([
    ['mairie360.auth.jwt', 'current'],
    ['mairie360.projects.jwt', 'legacy'],
    ['unrelated.preference', 'keep'],
  ]);
  const assigned = [];
  global.window = {
    localStorage: {
      removeItem: (key) => store.delete(key),
      clear: () => assert.fail('logout must not clear origin-wide storage'),
    },
    location: { assign: (path) => assigned.push(path) },
  };

  await logout();

  assert.equal(store.has('mairie360.auth.jwt'), false);
  assert.equal(store.has('mairie360.projects.jwt'), false);
  assert.equal(store.get('unrelated.preference'), 'keep');
  assert.deepEqual(assigned, [LOGOUT_PATH]);
});

test('logout still navigates when local storage is unavailable', async () => {
  const assigned = [];
  global.window = {
    localStorage: { removeItem: () => { throw new Error('storage denied'); } },
    location: { assign: (path) => assigned.push(path) },
  };

  await logout();

  assert.deepEqual(assigned, [LOGOUT_PATH]);
});
