const assert = require('node:assert/strict');
const { test, beforeEach, afterEach } = require('node:test');
const { NextRequest } = require('next/server');
require('./support/load-typescript.cjs');
const { middleware } = require('../src/middleware.ts');
const original = Object.fromEntries(['LOGIN_FRONT_URL', 'ELEARNING_FRONT_URL'].map(key => [key, process.env[key]]));
beforeEach(() => { process.env.LOGIN_FRONT_URL = 'https://login.test.example/'; process.env.ELEARNING_FRONT_URL = 'https://elearning.test.example/'; });
afterEach(() => { for (const [key,value] of Object.entries(original)) { if (value===undefined) delete process.env[key]; else process.env[key]=value; } });
const jwt = exp => 'e30.' + Buffer.from(JSON.stringify({exp})).toString('base64url') + '.fixture';
for (const [label,token] of [['missing',''],['opaque','opaque'],['expired',jwt(1)],['missing-exp',jwt(undefined)],['string-exp',jwt('4102444800')],['null-exp',jwt(null)]]) test(`document ${label} returns through Login owner without changing cookies`, () => {
  const r=middleware(new NextRequest('https://elearning.test.example/?course=rgpd', {headers:{cookie:'accessToken='+token}}));
  assert.equal(r.status,307);assert.equal(r.headers.get('set-cookie'),null);assert.equal(r.headers.get('cache-control'),'no-store');
  const target=new URL(r.headers.get('location'));assert.equal(target.searchParams.get('redirect'),'https://elearning.test.example/?course=rgpd');assert.equal(target.searchParams.get('resumeSession'),'1');
});
test('a GET logout document has no session side effects', () => {
 const r=middleware(new NextRequest('https://elearning.test.example/logout',{headers:{cookie:'accessToken='+jwt(4102444800)}}));
 assert.equal(r.status,200);assert.equal(r.headers.get('set-cookie'),null);assert.equal(r.headers.get('location'),null);
});
