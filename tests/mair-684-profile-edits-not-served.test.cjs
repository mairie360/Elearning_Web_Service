const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');

// BFF_Elearning no longer serves profile edits (a user edits their profile in Settings). The
// load test and the GDPR journey replay requests against the real BFF image: a request the BFF
// does not serve fails the k6 thresholds or the GDPR simulation, so both only call the
// operations of the synced contract, except deliberate errors the proxy itself refuses.
const root = join(__dirname, '..');
const read = (path) => readFileSync(join(root, path), 'utf8');
const contract = JSON.parse(read('contracts/openapi.json'));

const templateOf = (path) => {
  const bare = path.split('?')[0];
  return Object.keys(contract.paths).find((template) => {
    const pattern = template.replace(/\{[^/]+\}/g, '[^/]+').replace(/\//g, '\\/');
    return new RegExp(`^${pattern}$`).test(bare);
  });
};
const declares = (method, path) => {
  const template = templateOf(path);
  return Boolean(template && contract.paths[template][method.toLowerCase()]);
};

// `http.<verb>(`${BASE_URL}/path...`` calls of the k6 script, path params replaced by a segment.
const k6Requests = () =>
  [...read('load-test.js').matchAll(/http\.(get|post|put|patch|del)\(\s*`\$\{BASE_URL\}([^`]*)`/g)].map(
    ([, verb, path]) => ({
      method: verb === 'del' ? 'DELETE' : verb.toUpperCase(),
      path: path.replace(/\$\{[^}]+\}/g, 'x'),
    }),
  );

// Steps of the GDPR journey: method, path and expected statuses (flow or block style).
const gdprSteps = () =>
  read('gdpr-journey.yaml')
    .split(/^ {2}- name: /m)
    .slice(1)
    .map((step) => ({
      name: step.split('\n')[0],
      method: /method:\s*([A-Z]+)/.exec(step)[1],
      path: /path:\s*"?([^",}\s]+)/.exec(step)[1].replace(/\{\{[^}]+\}\}/g, 'x'),
      expect: (/^ {4}expect:\s*\[([^\]]*)\]/m.exec(step)?.[1] ?? '')
        .split(',')
        .map((status) => status.trim())
        .filter(Boolean)
        .map(Number),
    }));

test('MAIR-684 the synced contract no longer declares a profile edit', () => {
  assert.deepEqual(Object.keys(contract.paths['/elearning/profile']), ['get']);
});

test('MAIR-684 the load test only calls operations the contract declares', () => {
  // `/` is the Next.js page, rendered by the front itself.
  const requests = k6Requests().filter(({ path }) => path !== '/');
  assert.ok(requests.length >= 5, 'the load test requests were read');
  assert.deepEqual(
    requests.filter(({ method, path }) => !declares(method, path)),
    [],
  );
  assert.ok(!/endpoint:\s*'profile-write'/.test(read('load-test.js')), 'no profile-write tag nor threshold is left');
});

test('MAIR-684 the GDPR journey only expects success from operations the contract declares', () => {
  const steps = gdprSteps();
  assert.ok(steps.length >= 8, 'the GDPR journey steps were read');
  const undeclared = steps.filter(({ method, path }) => !declares(method, path));
  // The proxy answers 405 for a method the contract does not declare on a known path.
  assert.deepEqual(
    undeclared.filter(({ expect }) => expect.length !== 1 || expect[0] !== 405).map(({ name }) => name),
    [],
  );
  const profileEdit = steps.filter(({ method, path }) => method === 'PATCH' && path === '/elearning/profile');
  assert.deepEqual(profileEdit.map(({ expect }) => expect), [[405]]);
});
