const assert = require('node:assert/strict');
const { after, afterEach, before, beforeEach, describe, test } = require('node:test');
require('./support/load-typescript.cjs');
const f = require('./support/elearning-fixtures.ts');
const { useMockedFront } = require('./support/mocked-front.ts');
const { loadAuthSession, logoutAndReload, normalizeAppRole, resolveAppRoles, toAuthSession } = require('../src/lib/auth-session.ts');
const { clearStoredAuthJwtToken, formatBearerToken, getStoredAuthJwtToken, storeAuthJwtToken } = require('../src/lib/auth-token.ts');

// Adaptateurs same-origin src/app/api/** vers BFF User, simulé depuis le paquet @mairie360/bff-user-openapi :
// le mock refuse toute opération absente de ce contrat. Orval ne type pas les erreurs de BFF User, les réponses
// d'erreur simulées sont donc marquées `outOfContract`.

const front = useMockedFront({ before, after, beforeEach, afterEach });
const { bffElearning, userBff, runtime } = front;

const userBffError = (status) => ({ status, body: { message: 'Session invalide' }, outOfContract: true });

describe('session adapters against the contract-driven BFF User', () => {
  test('loadAuthSession reads GET /me through /api/user/me with the cookie as Bearer token', async () => {
    userBff.on('get', '/me', { body: f.sessionResponse({}, [f.group(1, 'Service urbanisme'), f.group(2, ' Direction générale ')]) });

    const result = await loadAuthSession();

    assert.deepEqual(result, {
      status: 'ready',
      session: {
        user: {
          name: 'Alice Martin', email: 'alice.martin@mairie.test', phone: '+33123456789', status: 'active',
          service: 'Service urbanisme, Direction générale', position: undefined, address: undefined, city: undefined, lastConnection: undefined, role: 'User',
        },
        groups: ['Service urbanisme', 'Direction générale'],
        roles: ['User'],
        role: 'User',
        isAdmin: false,
      },
    });
    assert.deepEqual(runtime.frontCalls, [{ method: 'GET', pathname: '/api/user/me', search: '', route: 'src/app/api/user/me/route.ts', status: 200 }]);
    const [me] = userBff.requests;
    assert.equal(me.headers.authorization, `Bearer ${runtime.accessToken}`);
    assert.equal(me.headers.cookie, undefined);
    assert.equal(bffElearning.requests.length, 0);
  });

  test('an administrator session exposes isAdmin', async () => {
    userBff.on('get', '/me', { body: f.sessionResponse({ role: 'Administrateur', phone: null }, []) });

    const { session } = await loadAuthSession();

    assert.equal(session.role, 'Admin');
    assert.equal(session.isAdmin, true);
    assert.equal(session.user.phone, undefined);
    assert.equal(session.user.service, undefined);
  });

  describe('failures', () => {
    for (const [label, reply, expected] of [
      ['a 401', userBffError(401), { status: 'unauthorized' }],
      ['a 500', userBffError(500), { status: 'unavailable', error: 'Les informations du profil sont indisponibles.' }],
      ['a dropped connection (proxy 502)', { dropConnection: true }, { status: 'unavailable', error: 'Les informations du profil sont indisponibles.' }],
      ['a non-JSON body', { raw: 'OK', contentType: 'text/plain', outOfContract: true }, { status: 'unavailable', error: 'Le service utilisateur est indisponible.' }],
    ]) {
      test(`loadAuthSession maps ${label}`, async () => {
        userBff.on('get', '/me', reply);
        assert.deepEqual(await loadAuthSession(), expected);
      });
    }
  });

  test('an aborted session load returns null without calling the network', async () => {
    const controller = new AbortController();
    controller.abort();

    assert.equal(await loadAuthSession(controller.signal), null);
    assert.equal(runtime.frontCalls.length, 0);
  });

  test('/api/auth/me and /api/auth/session forward to GET /me and GET /session/me', async () => {
    userBff.on('get', '/me', { body: f.sessionResponse() });
    userBff.on('get', '/session/me', { body: f.sessionResponse({ role: 'Maire' }) });

    const me = await fetch('/api/auth/me');
    const session = await fetch('/api/auth/session');

    assert.equal(me.status, 200);
    assert.equal((await session.json()).user.role, 'Maire');
    assert.deepEqual(userBff.requests.map(({ method, template }) => `${method} ${template}`), ['GET /me', 'GET /session/me']);
    assert.equal(session.headers.get('cache-control'), 'no-store');
  });

  test('methods not exported by an adapter never reach BFF User', async () => {
    const response = await fetch('/api/auth/logout');

    assert.equal(response.status, 405);
    assert.equal(response.headers.get('Allow'), 'POST');
    assert.equal(userBff.requests.length, 0);
  });

  test('/api/auth/logout forwards POST /auth/logout and returns its cookie removal to the browser', async () => {
    userBff.on('post', '/auth/logout', { body: { message: 'Déconnecté' }, headers: { 'Set-Cookie': 'accessToken=; Max-Age=0; Path=/; HttpOnly' } });

    const response = await fetch('/api/auth/logout', { method: 'POST' });

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { message: 'Déconnecté' });
    assert.match(response.headers.get('set-cookie'), /accessToken=; Max-Age=0/);
    assert.deepEqual(userBff.requests.map(({ method, template, body }) => [method, template, body]), [['POST', '/auth/logout', undefined]]);
  });

  test('logoutAndReload calls the logout adapter, clears storage and reloads', async () => {
    userBff.on('post', '/auth/logout', { body: { message: 'Déconnecté' } });
    storeAuthJwtToken(' session-jwt ');
    assert.equal(front.window().localStorage.getItem('mairie360.auth.jwt'), 'session-jwt');

    await logoutAndReload();

    assert.deepEqual(runtime.frontCalls.map(({ method, route, status }) => [method, route, status]), [['POST', 'src/app/api/auth/logout/route.ts', 200]]);
    assert.equal(front.window().localStorage.length, 0);
    assert.equal(front.window().location.reloads, 1);
  });

  test('logoutAndReload still reloads when BFF User rejects the logout', async () => {
    userBff.on('post', '/auth/logout', userBffError(500));

    await logoutAndReload();

    assert.equal(front.window().location.reloads, 1);
  });
});

describe('session shaping without network', () => {
  test('toAuthSession accepts legacy names, role lists and string groups', () => {
    const session = toAuthSession({ user: { name: '  ', first_name: '', last_name: '', email: 'agent@mairie.test', phone_number: ' 0102 ', roles: ['role_manager', { name: 'User' }] }, groups: ['  Voirie ', { name: 7 }] });

    assert.equal(session.user.name, 'agent@mairie.test');
    assert.equal(session.user.phone, '0102');
    assert.deepEqual(session.groups, ['Voirie']);
    assert.deepEqual(session.roles, ['Responsable', 'User']);
    assert.equal(session.isAdmin, false);
  });

  test('toAuthSession falls back to Guest and to top-level roles', () => {
    assert.deepEqual(toAuthSession({}).roles, ['Guest']);
    assert.deepEqual(toAuthSession({ user: { name: 'Maire', groups: [{ name: 'Élus' }] }, roles: [{ name: 'Mayor' }] }), {
      user: { name: 'Maire', email: undefined, phone: undefined, status: undefined, service: 'Élus', position: undefined, address: undefined, city: undefined, lastConnection: undefined, role: 'Maire' },
      groups: ['Élus'], roles: ['Maire'], role: 'Maire', isAdmin: false,
    });
  });

  test('role aliases are normalised', () => {
    assert.equal(normalizeAppRole('Invité'), 'Guest');
    assert.equal(normalizeAppRole(' ROLE_ADMIN '), 'Admin');
    assert.equal(normalizeAppRole('inconnu'), null);
    assert.equal(normalizeAppRole(3), null);
    assert.deepEqual(resolveAppRoles(['user', 'administrator', 'user']), ['Admin', 'User']);
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
