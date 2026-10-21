const assert = require('node:assert/strict');
const { test, before, after, beforeEach, afterEach } = require('node:test');
const Module = require('node:module');
require('./support/load-typescript.cjs');
const { installReactRuntime, mount } = require('./support/server-view.cjs');
installReactRuntime();
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { ContractMockServer } = require('./support/contract-mock-server.ts');
const { loadOrvalContract } = require('./support/orval-contract.ts');
const { FrontRuntime, FRONT_ORIGIN } = require('./support/front-runtime.ts');
const fixtures = require('./support/elearning-fixtures.ts');
const { installWindow } = require('./support/browser.ts');
const bff = new ContractMockServer('BFF_ELEARNING', loadOrvalContract('@mairie360/bff-elearning-openapi'));
const runtime = new FrontRuntime(() => [new URL(bff.url).origin]);
let access, Home, view;
const variables = ['ELEARNING_FRONT_URL', 'BFF_ELEARNING_BASE_URL', 'LOGIN_FRONT_URL'];
const previous = Object.fromEntries(variables.map(key => [key, process.env[key]]));
before(async () => {
  await bff.start();
  const load = Module._load;
  Module._load = function (name, ...rest) {
    if (name === 'next/headers') return { cookies: async () => ({ get: key => { assert.equal(key, 'accessToken', 'SSR must never read a refresh cookie'); return access ? { value: access } : undefined; } }) };
    return load.call(this, name, ...rest);
  };
  try { Home = require('../src/app/page.tsx').default; } finally { Module._load = load; }
});
after(async () => { await bff.stop(); for (const [key, value] of Object.entries(previous)) value === undefined ? delete process.env[key] : process.env[key] = value; });
beforeEach(() => { access = fixtures.accessToken(); process.env.ELEARNING_FRONT_URL = FRONT_ORIGIN; process.env.BFF_ELEARNING_BASE_URL = bff.url; process.env.LOGIN_FRONT_URL = 'https://login.mairie.test/'; });
afterEach(() => { view?.unmount(); view = undefined; runtime.restore(); assert.deepEqual([...bff.violations, ...runtime.violations], []); bff.reset(); runtime.reset(); delete global.window; delete global.document; });

test('the real server page reads the published catalog once and contains its data before any effect', async () => {
  bff.on('get', '/elearning/catalog', { body: fixtures.catalogResponse() });
  const element = await Home();
  const html = renderToStaticMarkup(element);
  assert.match(html, /RGPD et collectivités/);
  assert.doesNotMatch(html, /Chargement des formations/);
  assert.deepEqual(bff.requests.map(request => request.template), ['/elearning/catalog']);
  assert.equal(bff.requests[0].headers.authorization, `Bearer ${access}`);
  assert.equal(bff.requests[0].headers.cookie, undefined);
  assert.doesNotMatch(JSON.stringify(element.props), new RegExp(access.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  installWindow(); runtime.accessToken = access; runtime.install();
  view = mount(element);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(bff.requests.length, 1, 'Hydration must retain the confirmed server receipt without a second bootstrap.');
  assert.deepEqual(runtime.frontCalls, []);
});

test('the server seeds bounded URL filters and a new opaque client identity on every RSC read', async () => {
  bff.on('get', '/elearning/catalog', { body: fixtures.catalogResponse() });
  const first = await Home({ searchParams: Promise.resolve({ q: 'RGPD', category: 'Juridique', status: 'all', course: '4', token: 'private' }) });
  assert.equal(first.props.initialSearch, 'q=RGPD&category=Juridique&status=all&course=4');
  assert.doesNotMatch(JSON.stringify(first.props), /private/);
  assert.match(renderToStaticMarkup(first), /RGPD et collectivités/);
  const replacement = fixtures.catalogResponse(); replacement.catalog.courses[0].title = 'Nouvelle lecture RSC';
  bff.on('get', '/elearning/catalog', { body: replacement });
  const second = await Home({ searchParams: Promise.resolve({ q: ['ignored', 'duplicate'], category: 'x'.repeat(81), course: '../invalid' }) });
  assert.equal(second.props.initialSearch, '');
  assert.match(renderToStaticMarkup(second), /Nouvelle lecture RSC/);
  assert.ok(first.key && second.key && first.key !== second.key);
  assert.equal(bff.requests.length, 2, 'Each RSC render owns exactly one fresh contract read.');
});

test('the immediate loading structure is accessible and respects reduced motion', () => {
  const Loading = require('../src/app/loading.tsx').default;
  const html = renderToStaticMarkup(React.createElement(Loading));
  assert.match(html, /aria-busy="true"/); assert.match(html, /role="status"/);
  // MAIR-608: the lib Skeleton shimmers only when the user allows motion.
  assert.equal((html.match(/data-shape="block"[^>]*mairie-skeleton-animated/g) || []).length, 3);
  const css = require('node:fs').readFileSync(require.resolve('@mairie360/lib-components/styles.css'), 'utf8');
  assert.match(css, /@media \(prefers-reduced-motion: no-preference\) \{\s*\.mairie-skeleton-animated/);
});

for (const [label, prepare, pattern] of [
  ['missing access cookie', () => { access = undefined; }, /session|connexion/i],
  ['expired access cookie', () => { access = fixtures.accessToken(2, 1); }, /session|connexion/i],
  ['invalid configured origin', () => { process.env.ELEARNING_FRONT_URL = 'https://outside.test/?unsafe=1'; }, /indisponible|configur/i],
]) test(`${label} leaves an explicit server state and makes no upstream request`, async () => {
  prepare(); const element = await Home(); const html = renderToStaticMarkup(element);
  assert.match(html, pattern); assert.equal(bff.requests.length, 0);
  assert.match(html, /Réessayer/);
});

for (const [status, body] of [[403, { error: { message: 'sensitive upstream diagnostic' } }], [401, { error: { message: 'sensitive upstream diagnostic' } }], [503, { error: { message: 'sensitive upstream diagnostic' } }], [200, { catalog: { courses: [] }, unexpectedSecret: 'private' }]]) test(`a real upstream ${status} refusal or malformed receipt never becomes a confirmed SSR catalog`, async () => {
  bff.on('get', '/elearning/catalog', { status, body, outOfContract: true });
  const element = await Home(); const html = renderToStaticMarkup(element);
  assert.match(html, /Réessayer/); assert.doesNotMatch(html, /sensitive upstream diagnostic|private|Aucune formation/);
  assert.equal(bff.requests.length, 1);
  assert.equal(element.props.initialState.data, null);
});

test('only schema-owned DTO fields cross the server boundary at every nested level', async () => {
  const receipt = fixtures.catalogResponse();
  receipt.accessToken = 'private'; receipt.user.password = 'private'; receipt.catalog.courses[0].details.chapters[0].contents[0].cookie = 'private';
  bff.on('get', '/elearning/catalog', { body: receipt, outOfContract: true });
  const element = await Home();
  assert.match(renderToStaticMarkup(element), /RGPD et collectivités/);
  assert.doesNotMatch(JSON.stringify(element.props), /private|accessToken|password|cookie/);
});

test('foreground client refresh preserves the initial reader draft and refuses an incoherent replacement', async () => {
  const course = fixtures.course(); course.details.completed = true; course.details.progress = 100;
  const first = fixtures.catalogResponse([course]);
  bff.on('get', '/elearning/catalog', { body: first });
  const element = await Home({ searchParams: Promise.resolve({ course: '4' }) });
  const window = installWindow(); window.location.href = FRONT_ORIGIN + '/?course=4';
  const events = new EventTarget();
  window.addEventListener = events.addEventListener.bind(events); window.removeEventListener = events.removeEventListener.bind(events);
  global.document = Object.assign(new EventTarget(), { hidden: false, getElementById: () => null });
  runtime.accessToken = access; runtime.install();
  view = mount(element);
  await view.fire((_props, _text, tag) => tag === 'textarea', 'onChange', { target: { value: 'Brouillon conservé après retour au premier plan.' } });
  assert.equal(bff.requests.length, 1);
  const updated = structuredClone(first); updated.catalog.courses[0].title = 'Formation actualisée';
  bff.on('get', '/elearning/catalog', { body: updated });
  events.dispatchEvent(new Event('focus'));
  await view.waitFor(() => view.props('ElearningCatalog').courses[0].title === 'Formation actualisée');
  assert.equal(view.hostElements((_props, _text, tag) => tag === 'textarea')[0].props.value, 'Brouillon conservé après retour au premier plan.');
  bff.on('get', '/elearning/catalog', { body: { catalog: { courses: [] } }, outOfContract: true });
  events.dispatchEvent(new Event('focus'));
  await view.waitFor(html => html.includes('Les données des formations reçues sont incohérentes'));
  assert.equal(view.props('ElearningCatalog').courses[0].title, 'Formation actualisée');
  assert.equal(view.hostElements((_props, _text, tag) => tag === 'textarea')[0].props.value, 'Brouillon conservé après retour au premier plan.');
});

test('the compact projection remains derived exactly from the pinned published catalog schema', () => {
  const fs = require('node:fs'), crypto = require('node:crypto');
  const document = fs.readFileSync(require('node:path').join(__dirname, '../contracts/openapi.json'));
  const provenance = require('../src/lib/catalog-response-schema.provenance.json');
  assert.equal(provenance.sourceSha256, crypto.createHash('sha256').update(document).digest('hex'));
  const keywords = new Set(provenance.retainedKeywords);
  function strip(value) {
    if (Array.isArray(value)) return value.map(strip);
    if (!value || typeof value !== 'object') return value;
    return Object.fromEntries(Object.entries(value).filter(([key]) => keywords.has(key)).map(([key, nested]) => [key, key === 'properties' ? Object.fromEntries(Object.entries(nested).map(([name, child]) => [name, strip(child)])) : strip(nested)]));
  }
  assert.deepEqual(require('../src/lib/catalog-response-schema.json'), strip(JSON.parse(document).components.schemas.ElearningCatalogResponse));
  const { parseCatalogResponse } = require('../src/lib/catalog-response.ts');
  for (const change of [value => { value.catalog.certificationCount = -1; }, value => { value.catalog.courses[0].rating = {}; }, value => { value.catalog.courses[0].progress = 101; }, value => { value.user.email = 'invalid'; }, value => { value.user.avatarUrl = 'not a URI'; }, value => { value.catalog.courses[0].statusValue = 'invalid'; }]) {
    const value = fixtures.catalogResponse(); change(value); assert.throws(() => parseCatalogResponse(value), /incohérentes/);
  }
  const value = fixtures.catalogResponse(); value.catalog.courses[0].rating = '4.5';
  assert.equal(parseCatalogResponse(value).catalog.courses[0].rating, '4.5');
});

test('an unconfirmed SSR catalog recovers through the actual same-origin client route on explicit retry', async () => {
  access = undefined; const element = await Home(); assert.equal(bff.requests.length, 0);
  bff.on('get', '/elearning/catalog', { body: fixtures.catalogResponse() });
  installWindow(); runtime.accessToken = fixtures.accessToken(); runtime.install(); view = mount(element);
  assert.equal(runtime.frontCalls.length, 0);
  await view.click((_props, text, tag) => tag === 'button' && text.includes('Réessayer'));
  await view.waitFor(() => view.text().includes('RGPD et collectivités'));
  assert.equal(bff.requests.length, 1);
  assert.equal(runtime.frontCalls.filter(call => call.pathname === '/elearning/catalog').length, 1);
});

test('a contract-valid Admin catalog with integer adminStats is accepted and fractional counts are refused', async () => {
  const receipt = fixtures.catalogResponse();
  receipt.user = fixtures.currentUser({ role: 'Admin', isAdmin: true });
  receipt.catalog.adminStats = { totalCourses: 1, totalLearners: 2, mandatoryCourses: 0, totalContents: 3, averageRating: 4.5, completionRate: 50 };
  bff.on('get', '/elearning/catalog', { body: receipt });
  const element = await Home();
  assert.ok(element.props.initialState.data, 'Valid administrator statistics must survive the shared projection.');
  assert.deepEqual(element.props.initialState.data.catalog.adminStats, receipt.catalog.adminStats);
  const { parseCatalogResponse } = require('../src/lib/catalog-response.ts');
  for (const key of ['totalCourses', 'totalLearners', 'mandatoryCourses', 'totalContents']) {
    const invalid = structuredClone(receipt); invalid.catalog.adminStats[key] = 1.5;
    assert.throws(() => parseCatalogResponse(invalid), /incohérentes/);
    invalid.catalog.adminStats[key] = -1;
    assert.throws(() => parseCatalogResponse(invalid), /incohérentes/);
  }
});
