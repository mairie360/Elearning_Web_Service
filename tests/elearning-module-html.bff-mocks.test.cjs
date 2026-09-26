const assert = require('node:assert/strict');
const { after, afterEach, before, beforeEach, test } = require('node:test');
require('./support/load-typescript.cjs');
const { installReactRuntime, mount } = require('./support/server-view.cjs');

// HTML of the e-learning catalogue (ElearningModule.tsx behind src/app/page.tsx) rendered with
// react-dom/server against the mocked BFF E-learning: the real modules and the real components of
// @mairie360/lib-components are rendered, the hook state is kept between render passes
// (tests/support/server-view.cjs), so the markup reflects what the BFF answered through the proxy.

const { router } = installReactRuntime();
const React = require('react');
const f = require('./support/elearning-fixtures.ts');
const { errorReply, useMockedFront } = require('./support/mocked-front.ts');
const Home = require('../src/app/page.tsx').default;

const front = useMockedFront({ before, after, beforeEach, afterEach });
const { bffElearning, runtime } = front;
let view;

beforeEach(() => { router.reset(); });
afterEach(() => {
  view?.unmount();
  view = undefined;
});

const operations = () => bffElearning.requests.map((request) => `${request.method} ${request.template}`);

async function renderLoadedCatalog(body = f.catalogResponse()) {
  bffElearning.on('get', '/elearning/catalog', { body });
  view = mount(React.createElement(Home));
  return view.waitFor((html) => !html.includes('role="status"'));
}

test('the first pass renders the loading state, the next one the catalogue of GET /elearning/catalog', async () => {
  bffElearning.on('get', '/elearning/catalog', { body: f.catalogResponse() });
  view = mount(React.createElement(Home));

  assert.equal(view.passes, 1);
  assert.match(view.html, /<div[^>]*role="status"[^>]*>Chargement des formations…<\/div>/);
  assert.equal(view.find('ElearningCatalog').length, 0);
  assert.equal(view.props('Header').user.name, '');

  const html = await view.waitFor((current) => !current.includes('role="status"'));

  assert.deepEqual(operations(), ['GET /elearning/catalog']);
  assert.deepEqual(runtime.frontCalls.map((call) => `${call.method} ${call.pathname} ${call.status}`), ['GET /elearning/catalog 200']);
  assert.doesNotMatch(html, /role="alert"/);
  assert.match(view.text(), /RGPD et collectivités/);
  assert.match(view.text(), /Protéger les données personnelles des administrés\./);
  assert.match(view.text(), /DPO Mairie/);
  assert.match(view.html, /<span[^>]*>Alice Martin<\/span>/);
  assert.equal(view.props('Sidebar').isAdmin, false);
  assert.equal(view.props('ElearningCatalog').currentUserRole, 'user');
  assert.match(html, /<footer/);
  assert.match(view.text(), /1\.0\.0/);
});

test('an administrator sees the catalogue with the administrator role', async () => {
  await renderLoadedCatalog(f.catalogResponse([f.course()], f.currentUser({ name: 'Admin Mairie', initials: 'AM', role: 'Admin', isAdmin: true })));

  assert.equal(view.props('ElearningCatalog').currentUserRole, 'administrator');
  assert.equal(view.props('Sidebar').isAdmin, true);
  assert.match(view.html, /<span[^>]*>Admin Mairie<\/span>/);
});

test('a BFF error is rendered as an alert with a retry button that reloads the catalogue', async () => {
  bffElearning.on('get', '/elearning/catalog', errorReply(503, 'BFF_UNAVAILABLE', 'Le service de formation est indisponible'));
  view = mount(React.createElement(Home));
  const failed = await view.waitFor((html) => html.includes('role="alert"'));

  assert.match(failed, /<p[^>]*>Le service de formation est indisponible<\/p>/);
  assert.match(failed, /<button[^>]*type="button">Réessayer<\/button>/);
  assert.equal(view.find('ElearningCatalog').length, 0);

  bffElearning.on('get', '/elearning/catalog', { body: f.catalogResponse() });
  await view.click('Réessayer');
  const html = await view.waitFor((current) => !current.includes('role="alert"') && !current.includes('role="status"'));

  assert.deepEqual(operations(), ['GET /elearning/catalog', 'GET /elearning/catalog']);
  assert.match(view.text(), /RGPD et collectivités/);
  assert.doesNotMatch(html, /Réessayer/);
});

test('starting a course replaces it in the rendered catalogue without reloading', async () => {
  await renderLoadedCatalog(f.catalogResponse([f.course(), f.course('accueil', { title: 'Accueil des administrés' })]));
  const started = f.course('rgpd-collectivites', { statusValue: 'in-progress', statusBadge: { label: 'En cours', variant: 'inProgress' }, progress: 10 });
  bffElearning.on('post', '/elearning/courses/{courseId}/start', { body: { course: started } });

  const [course] = view.props('ElearningCatalog').courses;
  await view.act(() => view.props('ElearningCatalog').onCourseAction(course));
  await view.waitFor(() => view.props('ElearningCatalog').courses[0].statusValue === 'in-progress');

  assert.deepEqual(operations(), ['GET /elearning/catalog', 'POST /elearning/courses/{courseId}/start']);
  assert.deepEqual(bffElearning.requests[1].pathParams, { courseId: 'rgpd-collectivites' });
  assert.deepEqual(view.props('ElearningCatalog').courses.map((item) => [item.id, item.statusValue]), [['rgpd-collectivites', 'in-progress'], ['accueil', 'not-started']]);
  assert.match(view.text(), /Accueil des administrés/);
  assert.doesNotMatch(view.html, /role="alert"/);
});

test('a refused mutation is shown as an alert above the catalogue, which stays displayed', async () => {
  await renderLoadedCatalog();
  bffElearning.on('post', '/elearning/courses/{courseId}/start', errorReply(403, 'FORBIDDEN', 'Cette formation ne vous est pas ouverte'));

  await view.act(() => view.props('ElearningCatalog').onCourseAction(view.props('ElearningCatalog').courses[0]));
  const html = await view.waitFor((current) => current.includes('role="alert"'));

  assert.match(html, /<div[^>]*role="alert">Cette formation ne vous est pas ouverte<\/div>/);
  assert.equal(view.find('ElearningCatalog').length, 1);
  assert.match(view.text(), /RGPD et collectivités/);
});

test('a session refused by the BFF leaves the page through the logout route', async () => {
  bffElearning.on('get', '/elearning/catalog', errorReply(401, 'UNAUTHORIZED', 'Session expirée'));
  view = mount(React.createElement(Home));

  await view.waitFor(() => front.window().location.assigned.length === 1);

  assert.deepEqual(front.window().location.assigned, ['/logout']);
  assert.deepEqual(operations(), ['GET /elearning/catalog']);
});

test('the sidebar has one Settings account entry and legacy profile actions reach its redirect', async () => {
  await renderLoadedCatalog();
  const ids = view.props('Sidebar').items.map((item) => item.id);
  assert.equal(ids.includes('profile'), false);
  assert.equal(ids.filter((id) => id === 'settings').length, 1);

  await view.act(() => view.props('Sidebar').onItemSelect({ id: 'profile' }));

  assert.deepEqual(router.pushes, ['/profile']);
  assert.deepEqual(operations(), ['GET /elearning/catalog']);
});
