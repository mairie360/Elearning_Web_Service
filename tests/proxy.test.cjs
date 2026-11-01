const assert = require('node:assert/strict');
const { test, afterEach } = require('node:test');
const { NextRequest } = require('next/server');
require('./support/load-typescript.cjs');
const requireSrc = file => require('../src/' + file);
const { proxyBffRequest, forwardToBff } = requireSrc('lib/bff-proxy.ts');
const originalFetch = global.fetch;
for (const [name, target, headers, expected] of [
  ['unknown route', '/not-published', {}, 404],
  ['cross-site mutation', '/elearning/profile', { 'sec-fetch-site': 'cross-site' }, 403],
  ['oversized declared body', '/elearning/profile', { 'content-length': String(2 * 1024 * 1024) }, 413],
]) test(`relay rejects ${name} before any unbounded body allocation`, async () => {
  global.fetch = async () => assert.fail('a rejected request cannot reach the BFF');
  const request = new NextRequest('http://localhost' + target, {
    method: 'PATCH', headers: { 'content-type': 'application/json', cookie: 'accessToken=test-session', ...headers }, body: '{}',
  });
  request.arrayBuffer = async () => assert.fail('the relay must not prebuffer the complete request');
  const response = await forwardToBff(request, 'http://bff.example', target);
  assert.equal(response.status, expected);
});
const bffUrlVariables = ['BFF_ELEARNING_BASE_URL', 'ELEARNING_BFF_URL', 'NEXT_PUBLIC_BFF_ELEARNING_BASE_URL'];
const originalBffUrls = Object.fromEntries(bffUrlVariables.map(name => [name, process.env[name]]));
afterEach(() => {
  global.fetch = originalFetch;
  for (const [name,value] of Object.entries(originalBffUrls)) { if (value===undefined) delete process.env[name]; else process.env[name]=value; }
});

test('published Elearning relay preserves query and status but authenticates only from cookies', async () => {
  process.env.BFF_ELEARNING_BASE_URL = 'http://bff.example';
  let called;
  global.fetch = async (url, init) => { called = { url: String(url), init }; return Response.json({ value: null }, { status: 201 }); };
  const request = new NextRequest('http://localhost/elearning/catalog?q=a%26b', { headers: { cookie: 'accessToken=test-session', Authorization: 'Bearer untrusted-browser' } });
  const response = await proxyBffRequest(request, { params: Promise.resolve({ path: ['elearning', 'catalog'] }) });
  assert.equal(response.status, 201); assert.deepEqual(await response.json(), { value: null });
  assert.equal(new URL(called.url).pathname, '/elearning/catalog');
  assert.equal(new URL(called.url).search, '?q=a%26b'); assert.equal(called.init.headers.get('Authorization'), 'Bearer test-session');
  assert.equal(called.init.headers.get('cookie'), null); assert.equal(called.init.redirect, 'manual');
});
test('published course mutation preserves exact body bytes and 204 responses', async () => {
  const bytes = new TextEncoder().encode('{ "title": "Élodie" }');
  let init;
  global.fetch = async (_url, options) => { init = options; return new Response(null, { status: 204 }); };
  const request = new NextRequest('http://localhost/elearning/admin/courses/course-1', { method: 'PATCH', headers: { 'Content-Type': 'application/json', cookie: 'accessToken=test-session' }, body: bytes });
  const response = await forwardToBff(request, 'http://bff.example', '/elearning/admin/courses/course-1');
  assert.equal(response.status, 204); assert.equal(await response.text(), '');
  assert.deepEqual(new Uint8Array(init.body), bytes); assert.equal(init.headers.get('Authorization'), 'Bearer test-session');
  assert.equal(init.headers.get('Content-Type'), 'application/json');
});
test('undeclared uploads, metadata and unknown operations cannot reach the BFF', async () => {
  global.fetch = async () => assert.fail('undeclared network operation');
  for (const path of [['files'], ['openapi.json'], ['swagger.json'], ['unknown']]) {
    const response = await proxyBffRequest(new NextRequest('http://localhost/' + path.join('/')), { params: Promise.resolve({ path }) });
    assert.equal(response.status, 404);
  }
  const wrongMethod = await proxyBffRequest(new NextRequest('http://localhost/health', { method: 'DELETE' }), { params: Promise.resolve({ path: ['health'] }) });
  assert.equal(wrongMethod.status, 405); assert.match(wrongMethod.headers.get('Allow'), /GET/);
});
test('business errors are preserved but the Settings BFF cannot replace shared session cookies', async () => {
  global.fetch = async () => Response.json({ message: 'Denied' }, { status: 403, headers: { 'Set-Cookie': 'accessToken=untrusted; Path=/; HttpOnly' } });
  const result = await forwardToBff(new NextRequest('http://localhost/elearning/catalog'), 'http://bff.example', '/elearning/catalog');
  assert.equal(result.status, 403); assert.deepEqual(await result.json(), { message: 'Denied' }); assert.equal(result.headers.get('Set-Cookie'), null);
});
test('unavailable BFF produces a controlled error', async () => {
  global.fetch = async () => { throw new Error('connection refused'); };
  const result = await forwardToBff(new NextRequest('http://localhost/health'), 'http://bff.example', '/health');
  assert.equal(result.status, 502); assert.equal(result.headers.get('Cache-Control'), 'no-store');
});

for (const [name, value] of [
  ['missing', undefined],
  ['empty', ''],
  ['malformed', 'not-a-url'],
  ['unsupported protocol', 'file:///tmp/bff'],
  ['embedded credentials', 'http://user:password@example.test'],
]) {
  test(`${name} BFF URL returns an uncached 503 without an upstream call`, async () => {
    for (const variable of bffUrlVariables) delete process.env[variable];
    if (value !== undefined) process.env.BFF_ELEARNING_BASE_URL = value;
    global.fetch = async () => { throw new Error('must not be called'); };

    const response = await proxyBffRequest(new NextRequest('http://localhost/health'), { params: Promise.resolve({ path: ['health'] }) });

    assert.equal(response.status, 503);
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
    assert.deepEqual(await response.json(), { error: { message: 'Le service n’est pas configuré.' } });
  });
}
