const assert = require('node:assert/strict');
const { afterEach, test } = require('node:test');
const { NextRequest } = require('next/server');
require('./support/load-typescript.cjs');

const { middleware } = require('../src/middleware.ts');
const previous = {
  LOGIN_FRONT_URL: process.env.LOGIN_FRONT_URL,
  ELEARNING_FRONT_URL: process.env.ELEARNING_FRONT_URL,
};

afterEach(() => {
  for (const [key, value] of Object.entries(previous)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

test('an unauthenticated visit returns to the public Elearning URL, not the ingress host', () => {
  process.env.LOGIN_FRONT_URL = 'https://login.mairie.test/';
  process.env.ELEARNING_FRONT_URL = 'https://elearning.mairie.test/';

  const response = middleware(new NextRequest('http://internal:3000/courses/42?chapter=2'));
  const login = new URL(response.headers.get('location'));

  assert.equal(response.status, 307);
  assert.equal(login.origin, 'https://login.mairie.test');
  assert.equal(login.searchParams.get('redirect'), 'https://elearning.mairie.test/courses/42?chapter=2');
  assert.doesNotMatch(login.href, /internal:3000/);
});

test('logout never redirects back to logout after signing in', () => {
  process.env.LOGIN_FRONT_URL = 'https://login.mairie.test/';
  process.env.ELEARNING_FRONT_URL = 'https://elearning.mairie.test/';

  const response = middleware(new NextRequest('http://internal:3000/logout'));
  const login = new URL(response.headers.get('location'));

  assert.equal(response.status, 307);
  assert.equal(login.searchParams.has('redirect'), false);
});
