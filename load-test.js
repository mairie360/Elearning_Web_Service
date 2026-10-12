import http from 'k6/http';
import { check, sleep, group } from 'k6';
import crypto from 'k6/crypto';
import encoding from 'k6/encoding';

// ---------------------------------------------------------------------------
// k6 load test of the Elearning front (Elearning_Web_Service).
// Two scenarios run side by side against the routes the Next.js server really serves:
//   * `reads`: the page (Next.js render behind the authentication middleware), /health, then the
//     /api/bff/elearning/catalog and /api/bff/elearning/profile reads the page fetches, relayed by
//     the same-origin proxy to BFF Elearning;
//   * `writes` (MAIR-516): the profile update a learner saves from the page,
//     PATCH /api/bff/elearning/profile (-> BFF Elearning -> Core API), and the start of the first
//     course of the catalogue when it lists one, POST /api/bff/elearning/courses/{id}/start.
//     Course administration and ratings are left out: the pinned BFF answers 501 (MAIR-513).
// Authentication goes through the accessToken cookie, like in the browser: the proxy turns it
// into Authorization: Bearer for the BFF.
// ---------------------------------------------------------------------------

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5006';
// Must match the JWT_SECRET of the core-api / bff-user / API services of the test stack.
const JWT_SECRET = __ENV.JWT_SECRET || 'b"secret"';
// User inserted by init-test.sql (token `sub`).
const USER_ID = __ENV.PERF_USER_ID || '2';

const STAGES = [
  { duration: '30s', target: 20 }, // ramp up
  { duration: '1m', target: 20 }, // plateau
  { duration: '10s', target: 0 }, // ramp down
];

export const options = {
  scenarios: {
    reads: { executor: 'ramping-vus', startVUs: 0, stages: STAGES, exec: 'reads', gracefulRampDown: '5s' },
    // Few VUs on purpose: every iteration updates the learner's profile in the Core API database.
    writes: { executor: 'constant-vus', vus: 3, duration: '1m40s', exec: 'writes' },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'], // < 1% of HTTP errors
    checks: ['rate>0.99'], // a redirect (307) is not an HTTP error: the checks catch it
    'http_req_duration{endpoint:page}': ['p(95)<800'],      // Next.js page render
    'http_req_duration{endpoint:health}': ['p(95)<150'],    // same-origin proxy -> BFF /health
    'http_req_duration{endpoint:elearning}': ['p(95)<500'], // proxy + BFF aggregation + upstream
    'http_req_duration{endpoint:profile-write}': ['p(95)<800'], // proxy -> BFF Elearning -> Core API update
    'http_req_duration{endpoint:course-start}': ['p(95)<800'], // proxy -> BFF Elearning -> E-learning API
  },
};

function b64url(value) {
  return encoding.b64encode(value, 'rawurl');
}

// JWT HS256 minimal accepté par Core API / BFF User (claims sub + role + exp).
function mintJwt() {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const payload = b64url(JSON.stringify({ sub: USER_ID, role: 'user', exp: now + 3600 }));
  const signingInput = `${header}.${payload}`;
  const signature = crypto.hmac('sha256', JWT_SECRET, signingInput, 'base64rawurl');
  return `${signingInput}.${signature}`;
}

export function setup() {
  return { token: mintJwt() };
}

export function reads(data) {
  const cookie = { Cookie: `accessToken=${data.token}` };
  // redirects: 0 : a redirect (e.g. to the Login front when the cookie is refused)
  // must fail the check instead of being followed outside the stack.
  const pageParams = { headers: cookie, redirects: 0, tags: { endpoint: 'page' } };
  const dataParams = { headers: { ...cookie, Accept: 'application/json' }, redirects: 0, tags: { endpoint: 'elearning' } };

  group('pages', () => {
    const home = http.get(`${BASE_URL}/`, pageParams);
    check(home, { 'page / 200': (r) => r.status === 200 });
  });

  group('health', () => {
    const res = http.get(`${BASE_URL}/health`, { headers: cookie, redirects: 0, tags: { endpoint: 'health' } });
    check(res, { 'health 200': (r) => r.status === 200 });
  });

  group('elearning reads', () => {
    // Browser paths of the page (src/lib/elearning-api.ts prefixes /api/bff), not the root catch-all.
    const elearningCatalog = http.get(`${BASE_URL}/api/bff/elearning/catalog`, dataParams);
    check(elearningCatalog, { '/api/bff/elearning/catalog 200': (r) => r.status === 200 });

    const elearningProfile = http.get(`${BASE_URL}/api/bff/elearning/profile`, dataParams);
    check(elearningProfile, { '/api/bff/elearning/profile 200': (r) => r.status === 200 });
  });

  sleep(1);
}

function firstCourseId(response) {
  try {
    const body = response.json();
    const courses = body && body.catalog && body.catalog.courses;
    const course = Array.isArray(courses) && courses.length ? courses[0] : null;
    return course && course.id !== undefined && course.id !== null ? String(course.id) : null;
  } catch {
    return null;
  }
}

export function writes(data) {
  const headers = { Cookie: `accessToken=${data.token}`, Accept: 'application/json', 'Content-Type': 'application/json' };

  group('profile write', () => {
    // Alternate between two valid values so every iteration really changes the stored profile.
    const city = __ITER % 2 === 0 ? 'Paris' : 'Lyon';
    const updated = http.patch(`${BASE_URL}/api/bff/elearning/profile`, JSON.stringify({ city }), {
      headers,
      redirects: 0,
      tags: { endpoint: 'profile-write' },
    });
    check(updated, {
      'PATCH /api/bff/elearning/profile 200': (r) => r.status === 200,
      'PATCH /api/bff/elearning/profile echoes the city': (r) => {
        try {
          return r.json().user.city === city;
        } catch {
          return false;
        }
      },
    });
  });

  group('course start', () => {
    // The isolated stack seeds no course: the start is only exercised when the catalogue lists one.
    const catalog = http.get(`${BASE_URL}/api/bff/elearning/catalog`, { headers, redirects: 0, tags: { endpoint: 'elearning' } });
    const courseId = firstCourseId(catalog);
    if (courseId === null) return;
    const started = http.post(`${BASE_URL}/api/bff/elearning/courses/${courseId}/start`, JSON.stringify({ source: 'k6' }), {
      headers,
      redirects: 0,
      tags: { endpoint: 'course-start' },
    });
    check(started, { 'POST /api/bff/elearning/courses/{id}/start 200': (r) => r.status === 200 });
  });

  sleep(1);
}
