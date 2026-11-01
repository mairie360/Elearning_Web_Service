const assert = require('node:assert/strict');
const { test, beforeEach, afterEach } = require('node:test');
require('./support/load-typescript.cjs');
const { FrontRuntime, FRONT_ORIGIN } = require('./support/front-runtime.ts');

const ownerOrigin = 'http://localhost:5003';
const variables = ['LOGIN_FRONT_URL', 'NODE_ENV', 'COOKIE_DOMAIN'];
const previous = Object.fromEntries(variables.map(name => [name, process.env[name]]));
let runtime;
const access = () => 'e30.' + Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 900 })).toString('base64url') + '.signature';
beforeEach(() => {
  process.env.LOGIN_FRONT_URL = ownerOrigin;
  process.env.NODE_ENV = 'test';
  delete process.env.COOKIE_DOMAIN;
  runtime = new FrontRuntime(() => []);
  runtime.refreshToken = 'refresh-before';
  runtime.accessToken = 'previous-access';
  runtime.install();
});
afterEach(() => {
  runtime.restore();
  for (const [name, value] of Object.entries(previous)) value === undefined ? delete process.env[name] : process.env[name] = value;
});
function owner(handle) {
  runtime.owner = { origin: ownerOrigin, calls: [], handle };
}
const calls = () => assert.deepEqual(runtime.owner.calls, [{ method: 'POST', path: '/api/auth/refresh' }]);
const route = () => {
  assert.equal(runtime.frontCalls[0].route, 'src/app/api/auth/resume/route.ts');
  assert.deepEqual(runtime.violations, []);
  assert.deepEqual(runtime.upstreamCalls, []);
};

test('the public resume GET renews at the configured owner and returns the browser to its local document', async () => {
  const current = access();
  owner(async request => {
    assert.equal(request.headers.get('origin'), FRONT_ORIGIN);
    assert.equal(request.headers.get('sec-fetch-site'), 'same-site');
    assert.equal(request.headers.get('cookie'), 'refreshToken=refresh-before');
    assert.equal(request.headers.get('authorization'), null);
    assert.equal(await request.text(), '{}');
    const response = Response.json({ message: 'Session renewed.' });
    response.headers.append('Set-Cookie', `accessToken=${current}; Path=/; HttpOnly; Max-Age=900`);
    response.headers.append('Set-Cookie', 'refreshToken=refresh-after; Path=/api; HttpOnly; Max-Age=86400');
    return response;
  });
  const response = await fetch('/api/auth/resume?next=' + encodeURIComponent('/?panel=profile&view=compact'));
  assert.equal(response.status, 303);
  assert.equal(response.headers.get('location'), FRONT_ORIGIN + '/?panel=profile&view=compact');
  assert.equal(response.headers.get('cache-control'), 'no-store');
  const cookies = response.headers.getSetCookie();
  assert.equal(cookies.length, 2);
  assert.match(cookies[0], /accessToken=.+; Path=\/;.*HttpOnly; SameSite=strict/);
  assert.match(cookies[1], /refreshToken=refresh-after; Path=\/api;.*HttpOnly; SameSite=strict/);
  assert.equal(runtime.accessToken, current);
  assert.equal(runtime.refreshToken, 'refresh-after');
  assert.doesNotMatch(response.headers.get('location'), /refresh-|signature|previous-access/);
  calls(); route();
});

test('the public resume GET sends an owner refusal to Login without adopting or clearing cookies', async () => {
  owner(async () => Response.json({ message: 'Expired.' }, { status: 401, headers: { 'Set-Cookie': 'refreshToken=; Path=/api; Max-Age=0' } }));
  const response = await fetch('/api/auth/resume?next=' + encodeURIComponent('/?panel=profile'));
  assert.equal(response.status, 303);
  const destination = new URL(response.headers.get('location'));
  assert.equal(destination.origin, ownerOrigin);
  assert.equal(destination.pathname, '/');
  assert.equal(destination.searchParams.get('redirect'), FRONT_ORIGIN + '/?panel=profile');
  assert.deepEqual(response.headers.getSetCookie(), []);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(runtime.refreshToken, 'refresh-before');
  assert.equal(runtime.accessToken, 'previous-access');
  assert.doesNotMatch(destination.href, /refresh-before|previous-access/);
  calls(); route();
});

test('an unavailable owner leaves the public resume GET as an uncached JSON error without navigating to Login', async () => {
  owner(async () => Response.json({ message: 'Unavailable.' }, { status: 503 }));
  const response = await fetch('/api/auth/resume?next=%2F');
  assert.equal(response.status, 503);
  assert.equal(response.headers.get('location'), null);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual(response.headers.getSetCookie(), []);
  assert.deepEqual(await response.json(), { message: 'La session est temporairement indisponible.' });
  assert.equal(runtime.refreshToken, 'refresh-before');
  calls(); route();
});

for (const next of ['https://outside.example/', '//outside.example/', '/api/auth/refresh']) test(`the public resume GET rejects the unsafe document target ${next} before owner renewal`, async () => {
  owner(async () => assert.fail('an invalid document target cannot renew a session'));
  const response = await fetch('/api/auth/resume?next=' + encodeURIComponent(next));
  assert.equal(response.status, 400);
  assert.equal(response.headers.get('location'), null);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual(response.headers.getSetCookie(), []);
  assert.equal(runtime.refreshToken, 'refresh-before');
  assert.deepEqual(runtime.owner.calls, []);
  route();
});
