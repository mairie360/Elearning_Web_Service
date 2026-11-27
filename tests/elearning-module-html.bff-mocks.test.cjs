const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const { after, afterEach, before, beforeEach, test } = require('node:test');
require('./support/load-typescript.cjs');
const { installReactRuntime, mount } = require('./support/server-view.cjs');

// HTML of the e-learning catalogue (ElearningModule.tsx behind src/app/page.tsx) rendered with
// react-dom/server against the mocked BFF E-learning: the real modules and the real components of
// @mairie360/lib-components are rendered, the hook state is kept between render passes
// (tests/support/server-view.cjs), so the markup reflects what the BFF answered through the proxy.

installReactRuntime();
const React = require('react');
const f = require('./support/elearning-fixtures.ts');
const { errorReply, SIDE_READS, useMockedFront } = require('./support/mocked-front.ts');
const { ElearningModule } = require('../src/components/ElearningModule/index.ts');
// Client-only fallback/interactions; the async page's SSR contract is tested separately.
const Home = ElearningModule;
const { CONTENT_UNCOMPLETION_UNAVAILABLE_MESSAGE, fullCatalogCapabilities, pinnedBffCapabilities } = require('../src/features/elearning/bffCapabilities.ts');
const { NOT_IMPLEMENTED_MESSAGE } = require('../src/lib/bff-client.ts');

// lib-components 2.5.1 (RGAA 11.9): a clickable MetricCard is named by its visible text, not an `aria-label` of its own.
const reactText = node => node == null || typeof node === 'boolean' ? ''
  : typeof node === 'string' || typeof node === 'number' ? String(node)
    : Array.isArray(node) ? node.map(reactText).join(' ') : reactText(node.props?.children);
const metricCard = label => (props, _text, tag) => tag === 'button' && props['aria-label'] === undefined && reactText(props.children).trim().startsWith(label);
// The module once BFF_Elearning serves every contract operation (MAIR-513): the flows below that rate courses or
// administer them render it, the page itself (Home) only wires what the pinned BFF serves.
const FullModule = () => React.createElement(ElearningModule, { capabilities: fullCatalogCapabilities });

const front = useMockedFront({ before, after, beforeEach, afterEach });
const { bffElearning, runtime } = front;
let view;

afterEach(() => {
  view?.unmount();
  view = undefined;
});

// The training time and the administrator indicators are read beside the catalogue: the call lists below leave them out.
const requests = () => bffElearning.requests.filter((request) => !SIDE_READS.has(`${request.method} ${request.template}`));
const operations = () => requests().map((request) => `${request.method} ${request.template}`);

function assertLiveMessage(html, role, message, label) {
  const dom = new JSDOM(html);
  try {
    const notices = [...dom.window.document.querySelectorAll(`[role="${role}"]`)]
      .filter(node => node.textContent.includes(message) && (!label || node.getAttribute('aria-label') === label));
    assert.equal(notices.length, 1, 'The outcome has exactly one matching live announcement.');
  } finally { dom.window.close(); }
}

// MAIR-920: action outcomes are toasts of the lib ToastProvider (visible region named below).
function toasts(html) {
  const dom = new JSDOM(html);
  try {
    return [...dom.window.document.querySelectorAll('[aria-label="Notifications de la formation"] li')].map(node => node.textContent.replace(/\s+/g, ' ').trim());
  } finally { dom.window.close(); }
}

// The ToastProvider keeps empty live regions on the page: an alert counts only when it says something.
function hasAlert(html) {
  const dom = new JSDOM(html);
  try {
    return [...dom.window.document.querySelectorAll('[role="alert"]')].some(node => node.textContent.trim() !== '');
  } finally { dom.window.close(); }
}

for (const returnedId of ['unrelated', ' ']) {
  test(`the actual admin form keeps all edits after an uncorrelated receipt ${JSON.stringify(returnedId)}`, async () => {
    const initial = f.catalogResponse([f.course(), f.course('unrelated', { title: 'Independent course' })], f.currentUser({ isAdmin: true }));
    await renderLoadedCatalog(initial, FullModule);
    const course = initial.catalog.courses[0];
    const chapter = course.details.chapters[0];
    const content = chapter.contents[0];
    await view.click(props => props['aria-label'] === `Modifier ${course.title}`);
    const edits = {
      'elearning-course-title': 'Retained title draft',
      'elearning-course-description': 'Retained description draft',
      [`chapter-title-${chapter.id}`]: 'Retained chapter draft',
      [`content-title-${content.id}`]: 'Retained resource draft',
      [`content-resource-${content.id}`]: 'retained-support.pdf',
    };
    for (const [id, value] of Object.entries(edits)) {
      await view.fire(props => props.id === id, 'onChange', { target: { value } });
    }
    bffElearning.on('patch', '/elearning/admin/courses/{courseId}', {
      body: { id: '1', course: f.course(returnedId, { title: 'Foreign course replacement' }) },
    });
    const dialogDom = new JSDOM(view.html);
    try { assert.ok(dialogDom.window.document.querySelector('[role="dialog"] form'), 'The dialog contains a native submit form.'); }
    finally { dialogDom.window.close(); }
    // The native form submit bubbles to the dialog's existing handler.
    await view.fire((props, _text, tag) => tag === 'form' && 'aria-busy' in props, 'onSubmit'); // MAIR-608: the course form inside the lib Modal
    await view.waitFor(html => html.includes('La modification n’a pas été confirmée'));
    assert.equal(view.props('ElearningCourseFormModal').isOpen, true);
    assert.deepEqual(view.props('ElearningCatalog').courses, initial.catalog.courses);
    for (const [id, value] of Object.entries(edits)) {
      assert.equal(view.hostElements(props => props.id === id)[0].props.value, value);
    }
    assert.ok(toasts(view.html).every(toast => !/Formation (créée|modifiée|supprimée)/.test(toast)));
    assert.deepEqual(operations(), ['GET /elearning/catalog', 'PATCH /elearning/admin/courses/{courseId}']);
    await view.click('Annuler');
    assert.equal(view.props('ElearningCourseFormModal').isOpen, false);
    assert.deepEqual(operations(), ['GET /elearning/catalog', 'PATCH /elearning/admin/courses/{courseId}']);
  });
}

test('a foreign start receipt keeps the selected reader and unrelated catalogue course unchanged', async () => {
  const courses = [f.course(), f.course('independent', { title: 'Formation indépendante' })];
  await renderLoadedCatalog(f.catalogResponse(courses));
  bffElearning.on('post', '/elearning/courses/{courseId}/start', {
    body: { course: f.course('independent', { title: 'Remplacement étranger', progress: 100 }) },
  });
  await view.click('RGPD et collectivités');
  await view.click('Commencer');
  await view.waitFor(html => html.includes('Le démarrage n’a pas été confirmé'));
  assert.deepEqual(view.props('ElearningCatalog').courses, courses);
  assert.match(view.html, /role="dialog"/);
  assert.equal(view.props('CourseProgressCard').progress, 0);
  assert.equal(view.find('CoursePlayer').length, 0);
  assert.doesNotMatch(view.text(), /Remplacement étranger/);
  assert.deepEqual(operations(), ['GET /elearning/catalog', 'POST /elearning/courses/{courseId}/start']);
});

for (const scenario of ['foreign-content', 'negative-completion']) {
  test(`the real reader does not tick content or replace its progress after ${scenario}`, async () => {
    const course = f.course();
    course.progress = course.details.progress = 12;
    await renderPlayer(course);
    const content = course.details.chapters[0].contents[0];
    const response = f.contentCompleteResponse();
    response.content = scenario === 'foreign-content'
      ? { ...response.content, id: 'foreign' }
      : { ...response.content, completed: false };
    bffElearning.on('post', '/elearning/courses/{courseId}/contents/{contentId}/complete', { body: response });
    await view.click(props => props['aria-label'] === `Marquer ${content.title} comme terminé`);
    await view.waitFor(html => html.includes('La progression n’a pas été confirmée'));
    assert.equal(barProgress(), 12);
    assert.deepEqual(view.props('CoursePlayer').course, course);
    assert.equal(view.find('CourseRatingCard').length, 0);
    assert.deepEqual(operations(), ['GET /elearning/catalog', 'POST /elearning/courses/{courseId}/contents/{contentId}/complete']);
    assert.match(view.html, new RegExp(`aria-label="Marquer ${content.title} comme terminé"`));
    assert.equal(view.hostElements(props => props['aria-label'] === `Marquer ${content.title} comme terminé`)[0].props.disabled, false);
  });
}

for (const mode of ['create', 'update']) {
  test(`confirmed admin ${mode} announces the canonical response despite a refused GET and dismissal never writes`, async () => {
    await renderLoadedCatalog(f.catalogResponse([f.course()], f.currentUser({ isAdmin: true })), FullModule);
    const method = mode === 'create' ? 'post' : 'patch';
    const path = mode === 'create' ? '/elearning/admin/courses' : '/elearning/admin/courses/{courseId}';
    const callback = mode === 'create' ? 'onCreateCourse' : 'onUpdateCourse';
    const canonical = f.course('4', { title: 'Titre canonique du serveur' });
    const draft = { ...canonical, title: 'Titre du brouillon' };
    bffElearning.on(method, path, { status: mode === 'create' ? 201 : 200, body: { id: '1', course: canonical } });
    bffElearning.on('get', '/elearning/catalog', errorReply(503, 'UNAVAILABLE', 'Catalogue après confirmation refusé'));
    assert.equal(await view.act(() => view.props('ElearningCatalog')[callback](draft)), true);
    const [toast] = toasts(view.html);
    assert.match(toast, new RegExp(`Formation ${mode === 'create' ? 'créée' : 'modifiée'}`));
    assert.match(toast, /Titre canonique du serveur/);
    assert.doesNotMatch(view.text(), /Titre du brouillon/);
    assert.match(view.text(), /Catalogue après confirmation refusé/);
    const beforeDismiss = operations();
    await view.click(props => props['aria-label'] === 'Fermer la notification');
    assert.deepEqual(toasts(view.html), []);
    assert.deepEqual(operations(), beforeDismiss);
    bffElearning.on('get', '/elearning/catalog', { body: f.catalogResponse([canonical], f.currentUser({ isAdmin: true })) });
    await view.click('Réessayer');
    await view.waitFor(html => !html.includes('Catalogue après confirmation refusé'));
    assert.deepEqual(operations(), ['GET /elearning/catalog', `${method.toUpperCase()} ${path}`, 'GET /elearning/catalog', 'GET /elearning/catalog']);
  });
}

test('a confirmed deletion has truthful status and a subsequent refused write clears that old confirmation', async () => {
  await renderLoadedCatalog(f.catalogResponse([f.course()], f.currentUser({ isAdmin: true })), FullModule);
  bffElearning.on('delete', '/elearning/admin/courses/{courseId}', { body: { deleted: true, courseId: '4' } });
  bffElearning.on('get', '/elearning/catalog', errorReply(503, 'UNAVAILABLE', 'Catalogue après suppression refusé'));
  await view.act(() => view.props('ElearningCatalog').onDeleteCourse(f.course()));
  await view.waitFor(html => html.includes('Catalogue après suppression refusé'));
  assert.match(toasts(view.html)[0], /Formation supprimée/);
  bffElearning.on('post', '/elearning/admin/courses', errorReply(403, 'FORBIDDEN', 'Création refusée'));
  assert.equal(await view.act(() => view.props('ElearningCatalog').onCreateCourse(f.course())), false);
  assert.match(toasts(view.html).at(-1), /Formation non créée.*Création refusée/);
  assert.deepEqual(operations(), ['GET /elearning/catalog', 'DELETE /elearning/admin/courses/{courseId}', 'GET /elearning/catalog', 'POST /elearning/admin/courses']);
});

test('GET-only recovery retains the undismissed canonical success without repeating an admin write', async () => {
  await renderLoadedCatalog(f.catalogResponse([f.course()], f.currentUser({ isAdmin: true })), FullModule);
  const canonical = f.course('4', { title: 'Titre confirmé conservé' });
  bffElearning.on('patch', '/elearning/admin/courses/{courseId}', { body: { id: '1', course: canonical } });
  bffElearning.on('get', '/elearning/catalog', errorReply(503, 'UNAVAILABLE', 'Lecture de récupération refusée'));
  assert.equal(await view.act(() => view.props('ElearningCatalog').onUpdateCourse(canonical)), true);
  assert.match(toasts(view.html)[0], /Formation modifiée.*Titre confirmé conservé/);
  bffElearning.on('get', '/elearning/catalog', { body: f.catalogResponse([canonical], f.currentUser({ isAdmin: true })) });
  await view.click('Réessayer');
  await view.waitFor(html => !html.includes('Lecture de récupération refusée'));
  assert.match(toasts(view.html)[0], /Formation modifiée.*Titre confirmé conservé/);
  assert.deepEqual(operations(), ['GET /elearning/catalog', 'PATCH /elearning/admin/courses/{courseId}', 'GET /elearning/catalog', 'GET /elearning/catalog']);
});

test('a pending write and a contract-shaped unconfirmed deletion never announce success', async (t) => {
  await renderLoadedCatalog(f.catalogResponse([f.course()], f.currentUser({ isAdmin: true })), FullModule);
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  t.after(() => release());
  const originalFetch = global.fetch;
  t.mock.method(global, 'fetch', async (...args) => {
    const response = await originalFetch(...args);
    if (args[1]?.method === 'PATCH') await gate;
    return response;
  });
  bffElearning.on('patch', '/elearning/admin/courses/{courseId}', errorReply(503, 'UNAVAILABLE', 'Modification refusée'));
  let pending;
  await view.act(() => { pending = view.props('ElearningCatalog').onUpdateCourse(f.course()); });
  await view.waitFor(() => requests().length === 2);
  assert.ok(toasts(view.html).every(toast => !/Formation (créée|modifiée|supprimée)/.test(toast)));
  release();
  assert.equal(await pending, false);
  await view.settle();
  assert.ok(toasts(view.html).every(toast => !/Formation (créée|modifiée|supprimée)/.test(toast)));
  bffElearning.on('delete', '/elearning/admin/courses/{courseId}', { body: { deleted: false, courseId: '4' } });
  await view.act(() => view.props('ElearningCatalog').onDeleteCourse(f.course()));
  await view.waitFor(html => html.includes('Une erreur inattendue est survenue'));
  assert.ok(toasts(view.html).every(toast => !/Formation (créée|modifiée|supprimée)/.test(toast)));
  assert.equal(view.props('ElearningCatalog').courses.length, 1);
});

// MAIR-1148: `?play=<id>` shows the course screen in place of the application shell.
async function renderPlayer(course, body = f.catalogResponse([course]), Component = Home) {
  front.window().location.href = `https://elearning.test.example/?play=${course.id}`;
  return renderLoadedCatalog(body, Component);
}
const barProgress = () => view.find('ProgressMeter').map(({ props }) => props).find(props => / chapitres$/.test(props.label))?.value;

async function renderLoadedCatalog(body = f.catalogResponse(), Component = Home, displayRole = 'Guest') {
  bffElearning.on('get', '/elearning/catalog', { body });
  view = mount(React.createElement(require('@mairie360/lib-components/react').InstanceProvider, { role: displayRole, timeZone: 'UTC' }, React.createElement(Component)));
  return view.waitFor((html) => !html.includes('Chargement des formations'));
}

test('the first pass renders the loading state, the next one the catalogue of GET /elearning/catalog', async () => {
  bffElearning.on('get', '/elearning/catalog', { body: f.catalogResponse() });
  view = mount(React.createElement(Home));

  assert.equal(view.passes, 1);
  assertLiveMessage(view.html, 'status', 'Chargement des formations…');
  assert.equal(view.find('ElearningCatalog').length, 0);
  assert.equal(view.find('AppShell').length, 1);
  assert.equal(view.props('Header').user.name, '');

  const html = await view.waitFor((current) => !current.includes('Chargement des formations'));

  assert.deepEqual(operations(), ['GET /elearning/catalog']);
  assert.deepEqual(runtime.frontCalls.filter((call) => call.pathname !== '/elearning/training-time').map((call) => `${call.method} ${call.pathname} ${call.status}`), ['GET /elearning/catalog 200']);
  await view.waitFor(() => view.props('LearnerMetrics').trainingTimeState === 'default');
  assert.equal(bffElearning.calls('/elearning/training-time', 'GET')[0].url.searchParams.get('year'), String(new Date().getFullYear()));
  assert.equal(hasAlert(html), false);
  assert.match(view.text(), /RGPD et collectivités/);
  assert.match(view.text(), /Mon suivi/);
  assert.match(view.html, /<span[^>]*>Alice Martin<\/span>/);
  assert.equal(view.props('DesktopNavigation').isAdmin, false);
  assert.equal(view.props('ElearningCatalog').currentUserRole, 'user');
  assert.equal(view.props('PageHeader').title, 'E-learning');
  assert.equal(view.props('PageHeader').subtitle, 'Développez vos compétences à votre rythme.');
  // MAIR-1142: no page footer (lib 2.3 base page).
  assert.doesNotMatch(html, /<footer\b/);
});

test('an administrator sees the catalogue with the administrator role', async () => {
  await renderLoadedCatalog(f.catalogResponse([f.course()], f.currentUser({ name: 'Admin Mairie', initials: 'AM', role: 'Admin', isAdmin: true })), Home, 'Admin');

  assert.equal(view.props('ElearningCatalog').currentUserRole, 'administrator');
  assert.equal(view.props('DesktopNavigation').isAdmin, true);
  assert.match(view.html, /<span[^>]*>Admin Mairie<\/span>/);
});

for (const supplied of [undefined, [], [{ label: 'Juridique', value: 'Juridique' }], [
  { label: 'Tout le catalogue', value: 'all' }, { label: 'Juridique', value: 'Juridique' },
]]) {
  test(`category reset preserves search/status without another request (${JSON.stringify(supplied)})`, async () => {
    const body = f.catalogResponse([
      f.course('legal', { title: 'Parcours juridique', statusValue: 'in-progress' }),
      f.course('welcome', { title: 'Parcours accueil', category: 'Accueil', statusValue: 'in-progress' }),
      f.course('not-started', { title: 'Parcours non commencé', category: 'Accueil' }),
      f.course('other-search', { title: 'Autre formation', category: 'Accueil', statusValue: 'in-progress' }),
    ]);
    if (supplied === undefined) delete body.catalog.categories;
    else body.catalog.categories = supplied;
    await renderLoadedCatalog(body);
    const resetChoices = view.props('CatalogFilters').categories.filter(option => option.value === 'all');
    assert.equal(resetChoices.length, 1);
    await view.act(() => view.props('CatalogFilters').onSearchChange('Parcours'));
    await view.act(() => view.props('CatalogFilters').onStatusChange('in-progress'));
    if (supplied?.length !== 0) {
      await view.act(() => view.props('CatalogFilters').onCategoryChange('Juridique'));
      assert.match(view.html, /Parcours juridique/);
      assert.doesNotMatch(view.html, /Parcours accueil/);
    }
    await view.act(() => view.props('CatalogFilters').onCategoryChange('all'));
    assert.match(view.html, /Parcours juridique/);
    assert.match(view.html, /Parcours accueil/);
    assert.doesNotMatch(view.html, /Parcours non commencé|Autre formation/);
    assert.equal(view.props('CatalogFilters').search, 'Parcours');
    assert.equal(view.props('CatalogFilters').status, 'in-progress');
    assert.deepEqual(operations(), ['GET /elearning/catalog']);
  });
}

// MAIR-1145: the status filter has its own choices (« À terminer » included), whatever statuses the BFF lists.
test('the status filter preserves category/search, gathers « À terminer » and recovers an empty result', async () => {
  const body = f.catalogResponse([
    f.course('waiting', { title: 'Parcours non commencé' }),
    f.course('learning', { title: 'Parcours en cours', statusValue: 'in-progress' }),
    f.course('done', { title: 'Parcours terminé', statusValue: 'completed' }),
    f.course('other-category', { title: 'Parcours ailleurs', category: 'Accueil', statusValue: 'in-progress' }),
  ]);
  body.catalog.statuses = [{ label: 'En cours reçu', value: 'in-progress' }];
  await renderLoadedCatalog(body);
  assert.deepEqual(view.props('CatalogFilters').statuses.map(option => option.value), ['all', 'to-finish', 'not-started', 'in-progress', 'completed']);
  await view.act(() => view.props('CatalogFilters').onSearchChange('Parcours'));
  await view.act(() => view.props('CatalogFilters').onCategoryChange('Juridique'));
  await view.act(() => view.props('CatalogFilters').onStatusChange('to-finish'));
  assert.match(view.html, /Parcours non commencé/);
  assert.match(view.html, /Parcours en cours/);
  assert.doesNotMatch(view.html, /Parcours terminé|Parcours ailleurs/);
  assert.match(view.text(), /2 formations correspondent à votre recherche/);
  await view.act(() => view.props('CatalogFilters').onSearchChange('Parcours non'));
  await view.act(() => view.props('CatalogFilters').onStatusChange('in-progress'));
  assert.match(view.text(), /Aucune formation ne correspond à votre recherche\./);
  await view.act(() => view.props('CatalogFilters').onStatusChange('all'));
  assert.equal(view.props('CatalogFilters').category, 'Juridique');
  assert.equal(view.props('CatalogFilters').search, 'Parcours non');
  assert.match(view.html, /Parcours non commencé/);
  assert.deepEqual(operations(), ['GET /elearning/catalog']);
});

for (const mode of ['create', 'update']) {
  test(`the rendered administrator catalogue forwards ${mode} refusal and confirmation promises`, async () => {
    await renderLoadedCatalog(f.catalogResponse([f.course()], f.currentUser({ isAdmin: true })), FullModule);
    const method = mode === 'create' ? 'post' : 'patch';
    const path = mode === 'create' ? '/elearning/admin/courses' : '/elearning/admin/courses/{courseId}';
    const callback = mode === 'create' ? 'onCreateCourse' : 'onUpdateCourse';
    bffElearning.on(method, path, errorReply(503, 'UNAVAILABLE', 'Enregistrement refusé'));
    const refused = await view.act(() => {
      const pending = view.props('ElearningCatalog')[callback](f.course());
      assert.equal(typeof pending?.then, 'function');
      return pending;
    });
    assert.equal(refused, false);
    assert.match(view.text(), /Enregistrement refusé/);
    assert.deepEqual(operations(), ['GET /elearning/catalog', `${method.toUpperCase()} ${path}`]);

    bffElearning.on(method, path, ({ body }) => ({ status: mode === 'create' ? 201 : 200, body: { id: '1', course: body } }));
    const confirmed = await view.act(() => view.props('ElearningCatalog')[callback](f.course()));
    assert.equal(confirmed, true);
    assert.deepEqual(operations(), ['GET /elearning/catalog', `${method.toUpperCase()} ${path}`, `${method.toUpperCase()} ${path}`, 'GET /elearning/catalog']);
  });
}

test('repeating the visible Delete action while pending sends one write; refusal keeps the course for retry', async () => {
  await renderLoadedCatalog(f.catalogResponse([f.course()], f.currentUser({ isAdmin: true })), FullModule);
  const originalFetch = global.fetch;
  let release;
  let received;
  const held = new Promise(resolve => { release = resolve; });
  const ready = new Promise(resolve => { received = resolve; });
  let first = true;
  bffElearning.on('delete', '/elearning/admin/courses/{courseId}', errorReply(403, 'FORBIDDEN', 'Suppression refusée'));
  global.fetch = async (...args) => {
    const hold = first && args[1]?.method === 'DELETE';
    if (hold) first = false;
    const response = await originalFetch(...args);
    if (hold) { received(); await held; }
    return response;
  };
  try {
    const remove = props => props['aria-label'] === 'Supprimer RGPD et collectivités';
    await view.click(remove);
    await ready;
    assert.match(view.text(), /RGPD et collectivités/);
    await view.click(remove);
    release();
    await view.waitFor(html => html.includes('Suppression refusée'));
    assert.match(view.text(), /RGPD et collectivités/);
    assert.deepEqual(operations(), ['GET /elearning/catalog', 'DELETE /elearning/admin/courses/{courseId}']);
    bffElearning.on('delete', '/elearning/admin/courses/{courseId}', { body: { deleted: true, courseId: '4' } });
    bffElearning.on('get', '/elearning/catalog', errorReply(503, 'UNAVAILABLE', 'Relecture refusée'));
    await view.click(remove);
    await view.waitFor(html => html.includes('Relecture refusée'));
    assert.doesNotMatch(view.text(), /RGPD et collectivités/);
    assert.deepEqual(operations(), ['GET /elearning/catalog', 'DELETE /elearning/admin/courses/{courseId}', 'DELETE /elearning/admin/courses/{courseId}', 'GET /elearning/catalog']);
  } finally {
    release();
    global.fetch = originalFetch;
  }
});

for (const mode of ['start', 'complete', 'rating']) {
  test(`the rendered learner page forwards ${mode} refusal and confirmation promises`, async () => {
    if (mode === 'start') await renderLoadedCatalog(f.catalogResponse(), FullModule);
    else await renderPlayer(f.course(), f.catalogResponse(), FullModule);
    const path = mode === 'complete'
      ? '/elearning/courses/{courseId}/contents/{contentId}/complete'
      : `/elearning/courses/{courseId}/${mode}`;
    const payload = f.contentCompleteResponse();
    const dispatch = () => {
      if (mode === 'start') return view.props('ElearningCatalog').onCourseAction(view.props('ElearningCatalog').courses[0]);
      const player = view.props('CoursePlayer');
      return mode === 'complete' ? player.onContentComplete(player.course, payload) : player.onRatingSubmit(player.course, 5);
    };
    bffElearning.on('post', path, errorReply(503, 'UNAVAILABLE', 'Écriture apprenant refusée'));
    const refused = await view.act(() => {
      const result = dispatch();
      assert.equal(typeof result?.then, 'function');
      return result;
    });
    assert.equal(refused, false);
    assert.match(view.text(), /Écriture apprenant refusée/);
    bffElearning.on('post', path, { body: mode === 'start'
      ? { course: f.course() } : mode === 'complete' ? payload : f.ratingResponse(5) });
    assert.equal(await view.act(dispatch), true);
    assert.deepEqual(operations(), ['GET /elearning/catalog', `POST ${path}`, `POST ${path}`, 'GET /elearning/catalog']);
  });
}

test('the agent indicators are computed from the catalogue and filter the list in place (MAIR-1144)', async () => {
  await renderLoadedCatalog(f.catalogResponse([
    f.course('1', { title: 'Parcours en cours', statusValue: 'in-progress' }),
    f.course('2', { title: 'Parcours obligatoire', titleBadge: { label: 'Obligatoire', variant: 'mandatory' }, deadline: '30 nov. 2026' }),
    f.course('3', { title: 'Parcours terminé', statusValue: 'completed' }),
  ]));
  assert.deepEqual(view.props('LearnerMetrics').metrics, { inProgress: 1, mandatoryToFinish: 1, nextDeadline: '30 nov. 2026', completed: 1, completedInYear: 0, year: new Date().getFullYear(), available: 3 });
  await view.click(metricCard('Obligatoires à terminer'));
  assert.equal(view.props('CatalogFilters').status, 'to-finish');
  assert.equal(view.props('CatalogFilters').requirement, 'mandatory');
  assert.deepEqual(view.find('ManagedCourseCard').map(({ props }) => props.course.title), ['Parcours obligatoire']);
  assert.deepEqual(operations(), ['GET /elearning/catalog']);
});

test('a course link opens only an existing course and closing preserves other URL parameters', async () => {
  front.window().location.href = 'https://elearning.test.example/?view=all&course=4#catalog';
  await renderLoadedCatalog();

  assert.equal(view.props('ElearningCatalog').initialCourseId, '4');
  assert.match(view.html, /role="dialog"/);
  assert.deepEqual(operations(), ['GET /elearning/catalog']);

  await view.click((props, _text, tag) => tag === 'button' && props['aria-label'] === 'Fermer le détail du cours');
  assert.doesNotMatch(view.html, /role="dialog"/);
  assert.equal(front.window().location.href, 'https://elearning.test.example/?view=all#catalog');
  assert.deepEqual(operations(), ['GET /elearning/catalog']);
});

test('an unavailable course link reports the missing course without inventing data', async () => {
  front.window().location.href = 'https://elearning.test.example/?course=unknown&view=all';
  await renderLoadedCatalog();

  assert.equal(view.props('ElearningCatalog').initialCourseId, 'unknown');
  assert.equal(hasAlert(view.html), true);
  assert.match(view.text(), /Cette formation n’est plus disponible/);
  assert.doesNotMatch(view.html, /role="dialog"/);
  assert.deepEqual(operations(), ['GET /elearning/catalog']);

  await view.click('Voir le catalogue');
  assert.equal(front.window().location.href, 'https://elearning.test.example/?view=all');
  assert.equal(hasAlert(view.html), false);
});

for (const supplied of ['no-details', 'no-chapters', 'no-contents', 'empty-contents']) {
  test(`the actual reader does not invent resources or progression (${supplied})`, async () => {
    const course = f.course();
    delete course.progress;
    delete course.details.progress;
    delete course.details.completed;
    if (supplied === 'no-details') delete course.details;
    else if (supplied === 'no-chapters') course.details.chapters = [];
    else {
      const chapter = course.details.chapters[0];
      delete chapter.completed;
      delete chapter.active;
      if (supplied === 'no-contents') delete chapter.contents;
      else chapter.contents = [];
    }
    await renderPlayer(course);

    const empty = supplied === 'no-details' || supplied === 'no-chapters';
    assert.match(view.text(), empty ? /Aucun chapitre disponible pour cette formation/ : /Aucun contenu disponible pour ce chapitre/);
    assert.doesNotMatch(view.text(), /Notez cette formation/);
    assert.equal(view.find('ChapterContentItem').length, 0);
    assert.equal(barProgress(), 0);
    if (!empty) {
      assert.equal(view.props('PlayerChapter').chapter.title, course.details.chapters[0].title);
      assert.equal(view.hostElements((props, text) => text === 'Marquer comme terminé')[0]?.props.disabled, true);
    }
    assert.equal(view.find('CourseRatingCard').length, 0);
    assert.deepEqual(operations(), ['GET /elearning/catalog']);
  });
}

test('the real chapter controls retain the selected reader and server progression after a refused refresh', async () => {
  const first = f.chapter('first', [f.content('first-content', { type: 'document' })]);
  const second = f.chapter('42', [f.content('421', {
    type: 'pdf', title: 'Support officiel', href: '/documents/support.pdf', fileName: 'support.pdf',
  })]);
  const course = f.course('reader-course', {
    progress: 12,
    details: { title: 'Lecteur fourni', description: 'Description fournie', progress: 12, chapters: [first, second] },
  });
  await renderPlayer(course);
  assert.match(view.html, /Chapitre 42/);
  // The summary has two chapters: the one not pressed is « Chapitre 42 ».
  await view.click((props, _text, tag) => tag === 'button' && props['aria-pressed'] === false);
  // MAIR-817: a stored PDF opens through the BFF (signed URL), never through the address it carries.
  assert.doesNotMatch(view.html, /href="\/documents\/support\.pdf"/);
  assert.match(view.html, /aria-label="Ouvrir le support Support officiel dans un nouvel onglet"/);
  assert.match(view.text(), /Support officiel/);
  assert.equal(barProgress(), 12);

  const confirmedSecond = { ...second, contents: [{ ...second.contents[0], completed: true }], completed: true };
  const response = {
    progress: 37, completedRequiredContents: 1, totalRequiredContents: 2,
    completedChapters: 1, totalChapters: 2, completed: false,
    chapters: [first, confirmedSecond], chapter: confirmedSecond, content: confirmedSecond.contents[0],
  };
  bffElearning.on('post', '/elearning/courses/{courseId}/contents/{contentId}/complete', { body: response });
  bffElearning.on('get', '/elearning/catalog', errorReply(503, 'UNAVAILABLE', 'Relecture du parcours refusée'));
  await view.click(props => props['aria-label'] === 'Marquer Support officiel comme terminé');
  await view.waitFor(() => operations().length === 3 && barProgress() === 37);

  assert.equal(barProgress(), 37);
  assert.equal(view.hostElements(props => props['aria-label'] === 'Support officiel terminé')[0].props.disabled, true);
  assert.equal(view.props('PlayerChapter').chapter.id, '42');
  assert.deepEqual(view.props('CoursePlayer').course.details.chapters, response.chapters);
  assert.deepEqual(operations(), ['GET /elearning/catalog', 'POST /elearning/courses/{courseId}/contents/{contentId}/complete', 'GET /elearning/catalog']);
  assert.deepEqual(requests()[1].pathParams, { courseId: course.id, contentId: '421' });
  assert.deepEqual(requests()[1].body, { chapterId: '42', completed: true });
  // The refused refresh is reported in the catalogue, where « Réessayer » reads it again.
  // The screen stays locked until the refused read settles: « Quitter la formation » is only enabled then.
  await view.waitFor(() => view.hostElements((props, text, tag) => tag === 'button' && text === 'Quitter la formation' && !props.disabled).length === 1);
  await view.click('Quitter la formation');
  assert.match(view.text(), /Relecture du parcours refusée/);
});

for (const previouslySubmitted of [false, true]) {
  test(`the end-screen rating keeps the choice after a negative acknowledgement (prior=${previouslySubmitted})`, async () => {
    const course = f.course();
    course.progress = 100;
    course.details.progress = 100;
    course.details.completed = true;
    course.details.chapters = course.details.chapters.map(chapter => ({
      ...chapter, completed: true,
      contents: chapter.contents.map(content => ({ ...content, completed: true })),
    }));
    course.details.completionRating = previouslySubmitted
      ? { initialValue: 4, submitted: true } : { submitted: false };
    await renderPlayer(course, f.catalogResponse([course]), FullModule);
    await view.click('Terminer');
    assert.match(view.text(), /Formation terminée/);
    if (previouslySubmitted) {
      assert.match(view.text(), /Merci pour votre avis · Votre note : 4\/5/);
      assert.deepEqual(operations(), ['GET /elearning/catalog']);
      return;
    }
    await view.fire(props => props['aria-label'] === '3 étoiles sur 5', 'onChange', { target: { checked: true } });
    bffElearning.on('post', '/elearning/courses/{courseId}/rating', {
      body: { rating: 1, ratingCount: 99, ratingLabel: '1 (99 avis)', myRating: 1, ratingDistribution: { 1: 99 }, submitted: false },
    });
    await view.click('Envoyer la note');
    await view.waitFor(html => html.includes('Votre choix est conservé'));
    assert.equal(view.hostElements(props => props['aria-label'] === '3 étoiles sur 5')[0].props.checked, true);
    assert.match(toasts(view.html).at(-1), /Note non envoyée/);
    assert.deepEqual(view.props('CoursePlayer').course, course);
    assert.deepEqual(operations(), ['GET /elearning/catalog', 'POST /elearning/courses/{courseId}/rating']);
    assert.match(view.text(), /Envoyer la note/);
  });
}

test('a BFF error is rendered as an alert with a retry button that reloads the catalogue', async () => {
  bffElearning.on('get', '/elearning/catalog', errorReply(503, 'BFF_UNAVAILABLE', 'Le service de formation est indisponible'));
  view = mount(React.createElement(Home));
  const failed = await view.waitFor((html) => hasAlert(html));

  assert.match(view.text(), /Service de formation indisponible Le service de formation est indisponible/);
  assert.match(failed, />Réessayer</);
  assert.equal(view.props('DataState').state, 'error');
  assert.equal(view.find('ElearningCatalog').length, 0);

  bffElearning.on('get', '/elearning/catalog', { body: f.catalogResponse() });
  await view.click('Réessayer');
  const html = await view.waitFor((current) => !hasAlert(current) && !current.includes('Chargement des formations'));

  assert.deepEqual(operations(), ['GET /elearning/catalog', 'GET /elearning/catalog']);
  assert.match(view.text(), /RGPD et collectivités/);
  assert.doesNotMatch(html, /Réessayer/);
});

test('« Commencer » starts the course, opens its screen and keeps the filters for the way back', async () => {
  await renderLoadedCatalog(f.catalogResponse([f.course(), f.course('accueil', { title: 'Accueil des administrés' })]));
  const started = f.course('4', { statusValue: 'in-progress', statusBadge: { label: 'En cours', variant: 'inProgress' }, progress: 10 });
  bffElearning.on('post', '/elearning/courses/{courseId}/start', { body: { course: started } });
  const updated = f.catalogResponse([started, f.course('accueil', { title: 'Accueil actualisé' })]);
  bffElearning.on('get', '/elearning/catalog', { body: updated });
  await view.act(() => view.props('CatalogFilters').onSearchChange('RGPD'));
  await view.act(() => view.props('CatalogFilters').onCategoryChange('Juridique'));

  await view.click('RGPD et collectivités');
  await view.click('Commencer');
  await view.waitFor(() => view.find('CoursePlayer').length === 1 && operations().length === 3);

  assert.deepEqual(operations(), ['GET /elearning/catalog', 'POST /elearning/courses/{courseId}/start', 'GET /elearning/catalog']);
  assert.deepEqual(requests()[1].pathParams, { courseId: '4' });
  assert.equal(view.props('CoursePlayer').course.statusValue, 'in-progress');
  assert.equal(view.find('AccessibleShell').length, 0);
  assert.match(toasts(view.html)[0], /Formation commencée/);
  await view.click('Quitter la formation');
  assert.equal(view.find('CoursePlayer').length, 0);
  assert.match(toasts(view.html).at(-1), /Progression enregistrée/);
  assert.deepEqual(view.props('ElearningCatalog').courses.map((item) => [item.id, item.statusValue, item.title]), [['4', 'in-progress', 'RGPD et collectivités'], ['accueil', 'not-started', 'Accueil actualisé']]);
  assert.equal(view.props('CatalogFilters').search, 'RGPD');
  assert.equal(view.props('CatalogFilters').category, 'Juridique');
  assert.equal(hasAlert(view.html), false);
});

test('a failed refresh after a confirmed start keeps the course screen and offers a GET-only retry back in the catalogue', async () => {
  await renderLoadedCatalog();
  const started = f.course('4', { statusValue: 'in-progress', statusBadge: { label: 'En cours', variant: 'inProgress' }, progress: 10 });
  bffElearning.on('post', '/elearning/courses/{courseId}/start', { body: { course: started } });
  bffElearning.on('get', '/elearning/catalog', errorReply(503, 'BFF_UNAVAILABLE', 'Actualisation indisponible'));
  await view.click('RGPD et collectivités');
  await view.click('Commencer');
  await view.waitFor(() => operations().length === 3 && view.find('CoursePlayer').length === 1);
  assert.deepEqual(view.props('CoursePlayer').course, started);
  await view.click('Quitter la formation');
  assert.match(view.text(), /Actualisation indisponible/);
  const updated = f.catalogResponse([{ ...started, title: 'RGPD actualisée' }]);
  bffElearning.on('get', '/elearning/catalog', { body: updated });
  await view.click('Réessayer');
  await view.waitFor((html) => !html.includes('Actualisation indisponible') && view.props('ElearningCatalog').courses[0].title === 'RGPD actualisée');
  assert.deepEqual(operations(), ['GET /elearning/catalog', 'POST /elearning/courses/{courseId}/start', 'GET /elearning/catalog', 'GET /elearning/catalog']);
});

test('a failed refresh after a rating keeps the confirmed note and offers a reload-only retry in the catalogue', async () => {
  await renderPlayer(f.course(), f.catalogResponse(), FullModule);
  bffElearning.on('post', '/elearning/courses/{courseId}/rating', { body: f.ratingResponse(4) });
  bffElearning.on('get', '/elearning/catalog', errorReply(503, 'BFF_UNAVAILABLE', 'Actualisation indisponible'));

  await view.act(() => view.props('CoursePlayer').onRatingSubmit(view.props('CoursePlayer').course, 4));
  await view.waitFor(() => operations().length === 3);
  assert.match(toasts(view.html)[0], /Merci pour votre avis/);
  await view.click('Quitter la formation');
  assert.match(view.text(), /Actualisation indisponible/);
  assert.match(view.text(), /Les dernières données confirmées restent affichées/);
  assert.match(view.text(), /RGPD et collectivités/);

  const updated = f.catalogResponse([f.course('4', { title: 'Catalogue actualisé' })]);
  bffElearning.on('get', '/elearning/catalog', { body: updated });
  await view.click('Réessayer');
  await view.waitFor((current) => !current.includes('Actualisation indisponible') && current.includes('Catalogue actualisé'));
  assert.deepEqual(operations(), ['GET /elearning/catalog', 'POST /elearning/courses/{courseId}/rating', 'GET /elearning/catalog', 'GET /elearning/catalog']);
});

test('a refused mutation is shown as an alert above the catalogue, which stays displayed', async () => {
  await renderLoadedCatalog();
  const initial = { courses: view.props('ElearningCatalog').courses, adminStats: view.props('ElearningCatalog').adminStats };
  bffElearning.on('post', '/elearning/courses/{courseId}/start', errorReply(403, 'FORBIDDEN', 'Cette formation ne vous est pas ouverte'));

  await view.act(() => view.props('ElearningCatalog').onCourseAction(view.props('ElearningCatalog').courses[0]));
  const html = await view.waitFor((current) => hasAlert(current));

  assertLiveMessage(html, 'alert', 'Cette formation ne vous est pas ouverte');
  assert.match(toasts(html)[0], /Impossible de commencer.*Cette formation ne vous est pas ouverte/);
  assert.equal(view.find('ElearningCatalog').length, 1);
  assert.match(view.text(), /RGPD et collectivités/);
  assert.deepEqual({ courses: view.props('ElearningCatalog').courses, adminStats: view.props('ElearningCatalog').adminStats }, initial);
  assert.deepEqual(operations(), ['GET /elearning/catalog', 'POST /elearning/courses/{courseId}/start']);
});

async function confirmedCourseWithFailedRead() {
  const initial = f.catalogResponse([f.course()], f.currentUser({ isAdmin: true }));
  await renderLoadedCatalog(initial, FullModule);
  const confirmed = f.course('4', { title: 'Formation confirmée' });
  bffElearning.on('patch', '/elearning/admin/courses/{courseId}', { body: { id: '1', course: confirmed } });
  bffElearning.on('get', '/elearning/catalog', errorReply(503, 'UNAVAILABLE', 'Lecture refusée'));
  assert.equal(await view.act(() => view.props('ElearningCatalog').onUpdateCourse(confirmed)), true);
  assert.match(view.text(), /Formation confirmée/);
  return { initial, confirmed };
}

test('a refused write does not hide catalogue read recovery; GET success clears only its read error', async () => {
  const { initial, confirmed } = await confirmedCourseWithFailedRead();
  bffElearning.on('patch', '/elearning/admin/courses/{courseId}', errorReply(403, 'FORBIDDEN', 'Écriture refusée'));
  assert.equal(await view.act(() => view.props('ElearningCatalog').onUpdateCourse(f.course())), false);
  assert.match(view.text(), /Écriture refusée/);
  assert.match(view.text(), /Lecture refusée/);
  assert.match(view.html, />Réessayer<\/button>/);
  assert.deepEqual(view.props('ElearningCatalog').courses, [confirmed]);
  assert.match(toasts(view.html).at(-1), /Formation non modifiée.*Écriture refusée/);
  bffElearning.on('get', '/elearning/catalog', { body: f.catalogResponse([confirmed], initial.user) });
  await view.click('Réessayer');
  await view.waitFor(html => !html.includes('Lecture refusée'));
  assert.match(view.text(), /Écriture refusée/);
  assert.deepEqual(view.props('ElearningCatalog').courses, [confirmed]);
  assert.deepEqual(operations(), ['GET /elearning/catalog', 'PATCH /elearning/admin/courses/{courseId}', 'GET /elearning/catalog', 'PATCH /elearning/admin/courses/{courseId}', 'GET /elearning/catalog']);
});

test('read retry keeps its failure and disabled pending control until the catalogue confirms recovery', async () => {
  await confirmedCourseWithFailedRead();
  const originalFetch = global.fetch;
  let release;
  let received;
  const held = new Promise(resolve => { release = resolve; });
  const ready = new Promise(resolve => { received = resolve; });
  bffElearning.on('get', '/elearning/catalog', { body: f.catalogResponse() });
  global.fetch = async (...args) => {
    const response = await originalFetch(...args);
    if (args[0] === '/elearning/catalog') { received(); await held; }
    return response;
  };
  try {
    await view.click('Réessayer');
    await ready;
    await view.settle();
    assert.match(view.text(), /Lecture refusée/);
    assert.equal(view.props('RetryButton').loading, true);
    assert.match(view.text(), /Formation confirmée/);
    release();
    await view.waitFor(html => !html.includes('Lecture refusée'));
    assert.match(view.text(), /RGPD et collectivités/);
    assert.deepEqual(operations(), ['GET /elearning/catalog', 'PATCH /elearning/admin/courses/{courseId}', 'GET /elearning/catalog', 'GET /elearning/catalog']);
  } finally {
    release();
    global.fetch = originalFetch;
  }
});

test('composed status reset retains filters and independent write refusal through confirmed empty read recovery', async () => {
  const course = f.course('legal', { title: 'Parcours juridique' });
  const initial = f.catalogResponse([course, f.course('welcome', { title: 'Parcours accueil', category: 'Accueil' })], f.currentUser({ isAdmin: true }));
  initial.catalog.statuses = [{ label: 'Terminées', value: 'completed' }, { label: 'Tout reçu', value: 'all', disabled: true }, { label: 'Doublon', value: 'all' }];
  await renderLoadedCatalog(initial, FullModule);
  await view.act(() => view.props('CatalogFilters').onSearchChange('Parcours'));
  await view.act(() => view.props('CatalogFilters').onCategoryChange('Juridique'));
  await view.act(() => view.props('CatalogFilters').onStatusChange('completed'));
  assert.match(view.text(), /Aucune formation/);
  const resets = view.props('CatalogFilters').statuses.filter(option => option.value === 'all');
  assert.equal(resets.length, 1);
  assert.notEqual(resets[0].disabled, true);
  await view.act(() => view.props('CatalogFilters').onStatusChange('all'));
  assert.match(view.text(), /Parcours juridique/);
  assert.doesNotMatch(view.text(), /Parcours accueil/);
  const confirmed = { ...course, title: 'Parcours confirmé' };
  bffElearning.on('patch', '/elearning/admin/courses/{courseId}', { body: { id: '1', course: confirmed } });
  bffElearning.on('get', '/elearning/catalog', errorReply(503, 'UNAVAILABLE', 'Lecture composée refusée'));
  assert.equal(await view.act(() => view.props('ElearningCatalog').onUpdateCourse(confirmed)), true);
  bffElearning.on('delete', '/elearning/admin/courses/{courseId}', errorReply(403, 'FORBIDDEN', 'Suppression composée refusée'));
  await view.act(() => view.props('ElearningCatalog').onDeleteCourse(confirmed));
  await view.waitFor(html => html.includes('Suppression composée refusée'));
  assert.match(view.text(), /Parcours confirmé/);
  assert.match(view.text(), /Lecture composée refusée/);
  await view.act(() => view.props('CatalogFilters').onStatusChange('completed'));
  assert.match(view.text(), /Aucune formation/);
  await view.act(() => view.props('CatalogFilters').onStatusChange('all'));
  assert.match(view.text(), /Parcours confirmé/);
  assert.equal(view.props('CatalogFilters').search, 'Parcours');
  assert.equal(view.props('CatalogFilters').category, 'Juridique');
  assert.deepEqual(operations(), ['GET /elearning/catalog', 'PATCH /elearning/admin/courses/{courseId}', 'GET /elearning/catalog', 'DELETE /elearning/admin/courses/{courseId}']);
  const empty = f.catalogResponse([], initial.user);
  empty.catalog.statuses = [];
  bffElearning.on('get', '/elearning/catalog', { body: empty });
  await view.click('Réessayer');
  await view.waitFor(html => !html.includes('Lecture composée refusée'));
  assert.match(view.text(), /Suppression composée refusée/);
  assert.match(view.text(), /Aucune formation/);
  assert.deepEqual(view.props('ElearningCatalog').courses, []);
  assert.equal(view.props('CatalogFilters').search, 'Parcours');
  assert.equal(view.props('CatalogFilters').category, 'Juridique');
  assert.equal(view.props('CatalogFilters').status, 'all');
  assert.equal(view.props('CatalogFilters').statuses[0].value, 'all');
  assert.deepEqual(operations(), ['GET /elearning/catalog', 'PATCH /elearning/admin/courses/{courseId}', 'GET /elearning/catalog', 'DELETE /elearning/admin/courses/{courseId}', 'GET /elearning/catalog']);
});

test('composed status reset never restores a confirmed deletion after a failed read', async () => {
  const target = f.course('legal', { title: 'Parcours supprimé' });
  const body = f.catalogResponse([target, f.course('welcome', { title: 'Parcours accueil', category: 'Accueil' })], f.currentUser({ isAdmin: true }));
  body.catalog.statuses = [{ label: 'Terminées', value: 'completed' }];
  await renderLoadedCatalog(body, FullModule);
  await view.act(() => view.props('CatalogFilters').onSearchChange('Parcours'));
  await view.act(() => view.props('CatalogFilters').onCategoryChange('Juridique'));
  bffElearning.on('delete', '/elearning/admin/courses/{courseId}', { body: { deleted: true, courseId: target.id } });
  bffElearning.on('get', '/elearning/catalog', errorReply(503, 'UNAVAILABLE', 'Lecture après suppression refusée'));
  await view.act(() => view.props('ElearningCatalog').onDeleteCourse(target));
  await view.waitFor(html => html.includes('Lecture après suppression refusée'));
  await view.act(() => view.props('CatalogFilters').onStatusChange('completed'));
  await view.act(() => view.props('CatalogFilters').onStatusChange('all'));
  assert.match(view.text(), /Aucune formation/);
  assert.doesNotMatch(view.text(), /Parcours supprimé/);
  assert.deepEqual(view.props('ElearningCatalog').courses.map(course => course.id), ['welcome']);
  assert.equal(view.props('CatalogFilters').search, 'Parcours');
  assert.equal(view.props('CatalogFilters').category, 'Juridique');
  assert.deepEqual(operations(), ['GET /elearning/catalog', 'DELETE /elearning/admin/courses/{courseId}', 'GET /elearning/catalog']);
});

test('a session refused by the BFF returns to canonical Login without invoking logout', async () => {
  bffElearning.on('get', '/elearning/catalog', errorReply(401, 'UNAUTHORIZED', 'Session expirée'));
  view = mount(React.createElement(Home));

  await view.waitFor(() => front.window().location.assigned.length === 1);

  assert.equal(front.window().location.assigned.length, 1);
  assert.equal(new URL(front.window().location.assigned[0]).searchParams.get('redirect'), front.window().location.href);
  assert.deepEqual(operations(), ['GET /elearning/catalog']);
});

test('desktop and mobile navigation expose only active modules and keep Settings functional', async () => {
  const { setBrowserFrontUrls } = require('../src/lib/front-urls.ts');
  const assigned = [];
  const originalAssign = global.window.location.assign;
  global.window.location.assign = (href) => assigned.push(href);
  setBrowserFrontUrls({
    DASHBOARD_FRONT_URL: 'https://dashboard.test.example/',
    PROJECT_FRONT_URL: 'https://projects.test.example/',
    MESSAGE_FRONT_URL: 'https://messages.test.example/',
    ELEARNING_FRONT_URL: 'https://training.test.example/',
    CALENDAR_FRONT_URL: 'https://calendar.test.example/',
    ADMINISTRATION_FRONT_URL: 'https://admin.test.example/',
    SETTINGS_FRONT_URL: 'https://settings.test.example/',
  });
  try {
    await renderLoadedCatalog();
    assert.equal(view.props('AppShell').activeItem, 'training');
    assert.equal(view.props('AppShell').hrefs.profile, 'https://settings.test.example/');
    const isAdmin = view.props('DesktopNavigation').isAdmin;
    const desktop = view.props('DesktopNavigation');
    assert.equal(desktop.activeItem, 'training');
    const desktopMenu = view.html.match(/<aside\b[^>]*aria-label="Navigation principale"[^>]*>[\s\S]*?<\/aside>/)?.[0] ?? '';
    assert.doesNotMatch(desktopMenu, /E-mails|Fichiers/);
    assert.match(desktopMenu, /Paramètres/);
    assert.equal(desktopMenu.includes('>Administration<'), isAdmin);
    await view.act(() => view.props('Header').setSidebarOpen(true));
    const mobile = view.props('Sidebar');
    assert.deepEqual(mobile.items.map(item => item.id),
      ['dashboard', 'projects', 'messages', 'training', 'calendar', 'admin', 'settings']);
    assert.equal(mobile.items.find(item => item.id === 'admin').adminOnly, true);
    assert.equal(mobile.isAdmin, isAdmin);
    assert.equal(mobile.activeItem, 'training');
    await view.act(() => mobile.onItemSelect(mobile.items.find(item => item.id === 'settings')));
    assert.deepEqual(assigned, ['https://settings.test.example/']);
    assert.equal(view.find('Sidebar').length, 0);
  } finally {
    setBrowserFrontUrls({});
    global.window.location.assign = originalAssign;
  }
});

test('the shared shell directs profile access to configured Settings', async () => {
  const { setBrowserFrontUrls } = require('../src/lib/front-urls.ts');
  const assigned = [];
  const originalAssign = global.window.location.assign;
  global.window.location.assign = (href) => assigned.push(href);
  setBrowserFrontUrls({ SETTINGS_FRONT_URL: 'https://settings.test.example/' });
  try {
    await renderLoadedCatalog();
    await view.act(() => view.props('Header').setSidebarOpen(true));
    const ids = view.props('Sidebar').items.map((item) => item.id);
    assert.equal(ids.includes('profile'), false);
    assert.equal(ids.filter((id) => id === 'settings').length, 1);
    assert.equal(view.props('Header').profileHref, 'https://settings.test.example/');
    await view.act(() => view.props('Header').onPageChange('profile'));
    assert.deepEqual(assigned, ['https://settings.test.example/']);
    assert.deepEqual(operations(), ['GET /elearning/catalog']);
  } finally {
    setBrowserFrontUrls({});
    global.window.location.assign = originalAssign;
  }
});

// MAIR-513 then E-learning V2: the pinned BFF_Elearning stores ratings and administers courses; only `completed: false`
// still answers 501. The page wires every served callback; no « indisponible » notice is left.
test('the page wires the rating and administration callbacks the pinned BFF serves', async () => {
  assert.deepEqual(pinnedBffCapabilities, { courseRating: true, courseManagement: true, contentUncompletion: false });
  const course = f.course();
  await renderLoadedCatalog(f.catalogResponse([course], f.currentUser({ isAdmin: true })));
  const props = view.props('ElearningCatalog');
  assert.equal(props.currentUserRole, 'administrator');
  for (const name of ['onCreateCourse', 'onUpdateCourse', 'onDeleteCourse']) assert.equal(typeof props[name], 'function', name);
  assert.match(view.html, new RegExp(`aria-label="Modifier ${course.title}"`));
  assert.doesNotMatch(view.html, /data-elearning-capability-notice/);
  assert.doesNotMatch(view.text(), /pas encore disponible/);
  assert.deepEqual(operations(), ['GET /elearning/catalog']);
});

test('a learner rates a completed course on the end screen through the real route', async () => {
  const course = f.course();
  course.progress = 100; course.details.progress = 100; course.details.completed = true;
  course.details.completionRating = { submitted: false };
  await renderPlayer(course);
  assert.doesNotMatch(view.html, /data-elearning-capability-notice/);
  assert.equal(typeof view.props('CoursePlayer').onRatingSubmit, 'function');
  await view.click('Terminer');
  assert.match(view.text(), /Notez cette formation/);
  bffElearning.on('post', '/elearning/courses/{courseId}/rating', { body: { ...f.ratingResponse(4.5), myRating: 5 } });
  bffElearning.on('get', '/elearning/catalog', { body: f.catalogResponse([course]) });
  assert.equal(await view.act(() => view.props('CourseRatingCard').onSubmit(5)), true);
  await view.waitFor(html => html.includes('Votre note : 5/5'));
  assert.ok(toasts(view.html).some(toast => /Merci pour votre avis.*Votre note : 5\/5/.test(toast)));
  assert.deepEqual(requests().find(request => request.method === 'POST').body, { rating: 5 });
});

test('a refused rating keeps the choice of the agent on the end screen', async () => {
  const course = f.course();
  course.progress = 100; course.details.progress = 100; course.details.completed = true;
  course.details.completionRating = { submitted: false };
  await renderPlayer(course);
  await view.click('Terminer');
  bffElearning.on('post', '/elearning/courses/{courseId}/rating', errorReply(409, 'CONFLICT', 'Course not completed'));
  await view.fire(props => props['aria-label'] === '4 étoiles sur 5', 'onChange', { target: { checked: true, value: '4' } });
  await view.click('Envoyer la note');
  await view.waitFor(html => html.includes('La note n’a pas été enregistrée'));
  assert.match(view.html, /aria-label="4 étoiles sur 5"[^>]*checked=""|checked=""[^>]*aria-label="4 étoiles sur 5"/);
  assert.doesNotMatch(view.text(), /Votre note : 4\/5/);
  assert.deepEqual(operations(), ['GET /elearning/catalog', 'POST /elearning/courses/{courseId}/rating']);
});

test('un-ticking a completed content is refused locally in French, ticking it still reaches the BFF', async () => {
  const course = f.course();
  await renderPlayer(course);
  const receipt = f.contentCompleteResponse();
  const untick = { ...receipt, content: { ...receipt.content, completed: false } };

  assert.equal(await view.act(() => view.props('CoursePlayer').onContentComplete(view.props('CoursePlayer').course, untick)), false);
  assertLiveMessage(view.html, 'alert', CONTENT_UNCOMPLETION_UNAVAILABLE_MESSAGE);
  assert.deepEqual(operations(), ['GET /elearning/catalog']);

  bffElearning.on('post', '/elearning/courses/{courseId}/contents/{contentId}/complete', { body: receipt });
  assert.equal(await view.act(() => view.props('CoursePlayer').onContentComplete(view.props('CoursePlayer').course, { ...receipt, content: { ...receipt.content, completed: true } })), true);
  const [, write] = requests();
  assert.deepEqual(write.body, { chapterId: receipt.chapter.id, completed: true });
  assert.deepEqual(operations(), ['GET /elearning/catalog', 'POST /elearning/courses/{courseId}/contents/{contentId}/complete', 'GET /elearning/catalog']);
});

test('a 501 of the BFF is shown in French, never with its English message', async () => {
  await renderLoadedCatalog();
  bffElearning.on('post', '/elearning/courses/{courseId}/start', errorReply(501, 'NOT_IMPLEMENTED', 'Course starts are not available yet.'));
  assert.equal(await view.act(() => view.props('ElearningCatalog').onCourseAction(view.props('ElearningCatalog').courses[0])), false);
  assert.match(view.text(), new RegExp(NOT_IMPLEMENTED_MESSAGE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.doesNotMatch(view.text(), /not available yet/);
  assert.deepEqual(operations(), ['GET /elearning/catalog', 'POST /elearning/courses/{courseId}/start']);
});

test('an empty enrolment catalogue renders the BFF empty label without inventing courses', async () => {
  await renderLoadedCatalog(f.catalogResponse([]));
  assert.match(view.text(), /Aucune formation/);
  assert.doesNotMatch(view.html, /<article/);
  assert.deepEqual(view.props('ElearningCatalog').courses, []);
  assert.deepEqual(operations(), ['GET /elearning/catalog']);
});

test('the module guards duplicate logout clicks, displays refusal and permits an explicit retry', async t => {
  const previousLogin=process.env.LOGIN_FRONT_URL;
  process.env.LOGIN_FRONT_URL='https://login.mairie.test/';
  t.after(()=>{previousLogin===undefined?delete process.env.LOGIN_FRONT_URL:process.env.LOGIN_FRONT_URL=previousLogin;});
  await renderLoadedCatalog();
  let release;
  const pending = new Promise(resolve => { release = resolve; });
  runtime.owner = { origin:'https://login.mairie.test',calls:[],handle:async()=>{await pending;return Response.json({message:'Unconfirmed',session_revoked:false});} };
  await view.act(() => { view.props('AccessibleShell').onLogout(); view.props('AccessibleShell').onLogout(); });
  await view.waitFor(()=>runtime.owner.calls.length===1);
  assert.deepEqual(front.window().location.assigned,[]);
  release();
  await view.waitFor(html=>html.includes('déconnexion n’a pas été confirmée'));
  assert.equal(runtime.owner.calls.length,1);assert.deepEqual(front.window().location.assigned,[]);
  runtime.owner.handle=async()=>Response.json({message:'Session revoked',session_revoked:true});
  await view.act(()=>view.props('AccessibleShell').onLogout());
  await view.waitFor(()=>front.window().location.assigned.length===1);
  assert.equal(runtime.owner.calls.length,2);
  assert.equal(new URL(front.window().location.assigned[0]).origin,'https://login.mairie.test');
});

test('the module wires course completion policy and opens a stored file through its signed URL (MAIR-817)', async () => {
  const course=f.course();const content=course.details.chapters[0].contents[0];
  const learnerPort={
    downloadResource:async(target,signal)=>{calls.push({target,signal});return {url:'https://storage.example/signed?sig=1'};},
    canCompleteResource:(courseId,contentId)=>courseId===course.id&&contentId===content.id,
  };
  const calls=[];
  const Module=()=>React.createElement(ElearningModule,{learnerPort});
  await renderPlayer(course,f.catalogResponse([course]),Module);
  const player=view.props('CoursePlayer');
  assert.equal(player.canCompleteContent(course,content),true);
  assert.equal(player.canCompleteContent(course,{id:'other'}),false);
  const previousDocument=global.document;
  const events=[];let opened;
  const link={href:'',target:'',rel:'',click(){opened={href:this.href,target:this.target,rel:this.rel};events.push('click');},remove(){events.push('remove');}};
  global.document={createElement:tag=>{assert.equal(tag,'a');return link;},body:{append:node=>{assert.equal(node,link);events.push('append');}}};
  try{
    assert.equal(await player.onContentDownload(course,content),true);
    assert.deepEqual(opened,{href:'https://storage.example/signed?sig=1',target:'_blank',rel:'noopener noreferrer'});
    assert.deepEqual(events,['append','click','remove']);
    assert.deepEqual(calls[0].target,{courseId:course.id,chapterId:course.details.chapters[0].id,contentId:content.id});
    assert.equal(calls[0].signal.aborted,false);
    await assert.rejects(player.onContentDownload(course,{id:'unknown'}),/aucun chapitre/);
    assert.deepEqual(operations(),['GET /elearning/catalog']);
  }finally{previousDocument===undefined?delete global.document:global.document=previousDocument;}
});

test('by default a stored file is opened through GET …/contents/{contentId}/file', async () => {
  const course = f.course();
  await renderPlayer(course);
  bffElearning.on('get', '/elearning/courses/{courseId}/chapters/{chapterId}/contents/{contentId}/file', { body: { url: 'https://storage.example/a.mp4?sig=2' } });
  const previousDocument = global.document; let opened;
  global.document = { createElement: () => ({ click() { opened = this.href; }, remove() {} }), body: { append() {} } };
  try {
    const player = view.props('CoursePlayer');
    assert.equal(await player.onContentDownload(player.course, course.details.chapters[0].contents[0]), true);
    assert.equal(opened, 'https://storage.example/a.mp4?sig=2');
  } finally { previousDocument === undefined ? delete global.document : global.document = previousDocument; }
  assert.deepEqual(requests()[1].pathParams, { courseId: '4', chapterId: '41', contentId: '411' });
});

test('a superseded opening is cancelled and cannot open a stale address',async()=>{
  const course=f.course();const content=course.details.chapters[0].contents[0];
  const pending=[];
  const learnerPort={downloadResource:(target,signal)=>new Promise(resolve=>pending.push({target,signal,resolve}))};
  await renderPlayer(course,f.catalogResponse([course]),()=>React.createElement(ElearningModule,{learnerPort}));
  const callback=view.props('CoursePlayer').onContentDownload;
  const first=callback(course,content);const firstRejected=assert.rejects(first,/annulée/);
  const second=callback(course,content);const secondRejected=assert.rejects(second,/annulée/);
  assert.equal(pending[0].signal.aborted,true);assert.equal(pending[1].signal.aborted,false);
  pending[0].resolve({url:'https://storage.example/stale'});await firstRejected;
  view.unmount();view=undefined;assert.equal(pending[1].signal.aborted,true);
  pending[1].resolve({url:'https://storage.example/unmounted'});await secondRejected;
});

test('leaving the course screen with the browser back button cancels its pending opening', async () => {
  const course = f.course(); const content = course.details.chapters[0].contents[0];
  const pending = [];
  const learnerPort = { downloadResource: (target, signal) => new Promise(resolve => pending.push({ signal, resolve })) };
  await renderPlayer(course, f.catalogResponse([course]), () => React.createElement(ElearningModule, { learnerPort }));
  const opening = view.props('CoursePlayer').onContentDownload(course, content);
  const rejected = assert.rejects(opening, /annulée/);
  assert.equal(pending[0].signal.aborted, false);
  front.window().location.href = 'https://elearning.test.example/';
  await view.act(() => front.window().dispatchEvent(new Event('popstate')));
  await view.waitFor(() => view.find('CoursePlayer').length === 0);
  assert.equal(pending[0].signal.aborted, true);
  pending[0].resolve({ url: 'https://storage.example/late' });
  await rejected;
});

// ---- E-learning V2 on the real BFF data (MAIR-1143, MAIR-1144, MAIR-1149, MAIR-1150, MAIR-817, MAIR-703) ----

/** Replaces the browser saving of a PDF (temporary link) for the time of `run`. */
async function capturingSaves(run) {
  const previousDocument = global.document, create = URL.createObjectURL, revoke = URL.revokeObjectURL;
  const saved = [];
  global.document = { createElement: () => ({ click() { saved.push({ href: this.href, name: this.download }); }, remove() {} }), body: { append() {} } };
  URL.createObjectURL = () => 'blob:attestation'; URL.revokeObjectURL = () => {};
  front.window().setTimeout = callback => { callback(); return 1; };
  try { await run(saved); } finally {
    URL.createObjectURL = create; URL.revokeObjectURL = revoke;
    previousDocument === undefined ? delete global.document : global.document = previousDocument;
  }
}
const pdfReply = name => ({ raw: '%PDF-1.4', contentType: 'application/pdf', headers: { 'Content-Disposition': `attachment; filename="${name}"` } });
const year = new Date().getFullYear();

test('the agent reads its training time of the year and downloads its attestations from the drawer (MAIR-1144)', async () => {
  await renderLoadedCatalog(f.catalogResponse([f.course('1', { statusValue: 'completed', completedAt: `${year}-02-01T10:00:00Z` })]));
  await view.waitFor(() => view.props('LearnerMetrics').trainingTimeState === 'default');
  assert.match(view.text(), new RegExp(`Terminées en ${year}`));
  assert.equal(view.props('LearnerMetrics').metrics.completedInYear, 1);
  assert.match(view.text(), new RegExp(`Temps de formation en ${year}`));
  assert.match(view.text(), /2 h 15/);
  assert.match(view.text(), /objectif annuel : 10 h/);
  await view.click(metricCard(`Temps de formation en ${year}`));
  assert.match(view.html, /role="dialog"[^>]*aria-labelledby/);
  assert.match(view.text(), /Mon temps de formation/);
  assert.match(view.text(), /Accueil du public/);
  await capturingSaves(async saved => {
    bffElearning.on('get', '/elearning/certificates', pdfReply(`attestations-${year}.pdf`));
    await view.click('Télécharger mes attestations');
    await view.waitFor(() => saved.length === 1);
    assert.deepEqual(saved, [{ href: 'blob:attestation', name: `attestations-${year}.pdf` }]);
    await view.waitFor(html => toasts(html).some(toast => toast.includes('Attestations téléchargées')));
    bffElearning.on('get', '/elearning/certificates', errorReply(404, 'NOT_FOUND', 'Nothing completed'));
    await view.click('Télécharger mes attestations');
    await view.waitFor(html => toasts(html).some(toast => toast.includes('Aucune attestation pour cette année')));
    assert.equal(saved.length, 1);
  });
  assert.deepEqual(bffElearning.calls('/elearning/certificates', 'GET').map(({ url }) => url.searchParams.get('year')), [String(year), String(year)]);
  assert.equal(bffElearning.calls('/elearning/admin/stats').length, 0, 'an agent never reads the administrator indicators');
});

test('an unavailable training time says so without blocking the catalogue', async () => {
  bffElearning.on('get', '/elearning/training-time', errorReply(503, 'UNAVAILABLE', 'E-learning API down'));
  await renderLoadedCatalog();
  await view.waitFor(() => view.props('LearnerMetrics').trainingTimeState === 'unavailable');
  assert.match(view.text(), /temporairement indisponible/);
  assert.match(view.text(), /RGPD et collectivités/);
});

test('« Reprendre » follows the last activity of the agent and says when it was (MAIR-1143)', async () => {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  await renderLoadedCatalog(f.catalogResponse([
    f.course('1', { title: 'Très avancée', statusValue: 'in-progress', progress: 90, lastActivityAt: '2020-01-01T10:00:00Z' }),
    f.course('2', { title: 'Touchée hier', statusValue: 'in-progress', progress: 10, lastActivityAt: yesterday, deadline: '2026-06-30' }),
  ]));
  assert.equal(view.props('ResumeCard').suggestion.course.id, '2');
  assert.match(view.text(), /Reprendre où vous en étiez/);
  assert.match(view.text(), /Avant le 30 juin 2026/);
  assert.match(view.text(), /Dernière activité hier/);
});

test('the course sheet shows the V2 facts and the reminder of the administrator (MAIR-1147)', async () => {
  const course = f.course('4', {
    mandatory: true, level: 'intermediate', levelBadge: { label: 'Intermédiaire', variant: 'intermediate' }, deadline: '2026-06-30',
    ratingCount: 12, lastReminderAt: '2026-10-02T08:00:00Z', source: 'platform', statusValue: 'in-progress',
  });
  course.details.ratingLabel = '4,5 (12 avis)';
  course.details.duration = '2 h 15';
  front.window().location.href = 'https://elearning.test.example/?course=4';
  await renderLoadedCatalog(f.catalogResponse([course]));
  const text = view.text();
  for (const fact of ['Obligatoire', 'Intermédiaire', 'Juridique', 'Fournie par Mairie360', 'DPO Mairie', '2 h 15', '4,5 (12 avis)', '30 juin 2026', 'Relancé le 2 octobre 2026']) {
    assert.ok(text.includes(fact), fact);
  }
});

test('the end screen downloads the attestation of the course (MAIR-1149)', async () => {
  const course = f.course();
  course.progress = 100; course.details.progress = 100; course.details.completed = true;
  await renderPlayer(course);
  await view.click('Terminer');
  await capturingSaves(async saved => {
    bffElearning.on('get', '/elearning/courses/{courseId}/certificate', pdfReply('attestation-rgpd.pdf'));
    await view.click('Télécharger l’attestation');
    await view.waitFor(() => saved.length === 1);
    assert.equal(saved[0].name, 'attestation-rgpd.pdf');
    await view.waitFor(html => toasts(html).some(toast => toast.includes('Attestation téléchargée')));
    bffElearning.on('get', '/elearning/courses/{courseId}/certificate', errorReply(502, 'BAD_GATEWAY', 'Upstream'));
    await view.click('Télécharger l’attestation');
    await view.waitFor(html => toasts(html).some(toast => toast.includes('Téléchargement impossible')));
  });
  assert.deepEqual(bffElearning.calls('/elearning/courses/{courseId}/certificate').map(({ pathParams }) => pathParams.courseId), ['4', '4']);
});

const adminCatalog = () => f.catalogResponse([
  f.course('4', { title: 'RGPD interne', source: 'internal' }),
  f.course('9', { title: 'Prise en main de l’outil', source: 'platform' }),
], f.currentUser({ isAdmin: true, role: 'Admin' }));

test('the administrator reads the indicators of the instance and filters the origin from them (MAIR-1150)', async () => {
  await renderLoadedCatalog(adminCatalog());
  await view.waitFor(() => view.props('ElearningAdminStats').state === 'default');
  const text = view.text();
  for (const figure of ['Formations internes', 'créées par la commune · 2 obligatoires', 'Formations de l’outil', 'fournies par Mairie360', '79,2 %', '61,4 %', 'Obligatoires en retard']) {
    assert.ok(text.includes(figure), figure);
  }
  assert.equal(bffElearning.calls('/elearning/training-time').length, 0, 'an administrator page reads no training time');
  await view.click(metricCard('Formations de l’outil'));
  assert.equal(view.props('CatalogFilters').source, 'platform');
  assert.deepEqual(view.find('ManagedCourseCard').map(({ props }) => props.course.title), ['Prise en main de l’outil']);
  await view.act(() => view.props('CatalogFilters').onSourceChange('internal'));
  assert.deepEqual(view.find('ManagedCourseCard').map(({ props }) => props.course.title), ['RGPD interne']);
  await view.act(() => view.props('CatalogFilters').onSourceChange('all'));
  assert.equal(view.find('ManagedCourseCard').length, 2);
});

test('unavailable indicators do not block the catalogue, and « Actualiser » reads them again', async () => {
  bffElearning.on('get', '/elearning/admin/stats', errorReply(503, 'UNAVAILABLE', 'E-learning API down'));
  await renderLoadedCatalog(adminCatalog());
  await view.waitFor(() => view.props('ElearningAdminStats').state === 'unavailable');
  assert.match(view.text(), /Indicateurs temporairement indisponibles\./);
  assert.equal(view.find('ManagedCourseCard').length, 2);
  bffElearning.on('get', '/elearning/admin/stats', { body: f.adminStatsResponse({ internalCourses: 11 }) });
  await view.click('Actualiser');
  await view.waitFor(() => view.props('ElearningAdminStats').stats?.internalCourses === 11);
  assert.equal(bffElearning.calls('/elearning/admin/stats').length, 2);
  assert.equal(bffElearning.calls('/elearning/catalog').length, 1, '« Actualiser » reads the indicators only');
});

test('the late agents drawer reminds each course concerned and reports the total (MAIR-1150)', async () => {
  await renderLoadedCatalog(adminCatalog());
  await view.waitFor(() => view.props('ElearningAdminStats').state === 'default');
  await view.click(metricCard('Obligatoires en retard'));
  assert.match(view.text(), /Agents en retard/);
  assert.match(view.text(), /Chloé Roux/);
  bffElearning.on('post', '/elearning/admin/courses/{courseId}/reminders', ({ body }) => ({ body: { sent: body.userIds.length } }));
  await view.click('Relancer les 3 agents');
  await view.waitFor(html => toasts(html).some(toast => toast.includes('Relances envoyées')));
  assert.ok(toasts(view.html).some(toast => toast.includes('3 relances envoyées aux agents en retard.')));
  assert.deepEqual(bffElearning.calls('/elearning/admin/courses/{courseId}/reminders').map(({ pathParams, body }) => [pathParams.courseId, body.userIds]).sort(),
    [['4', ['42', '43']], ['7', ['44']]]);
  await view.waitFor(() => bffElearning.calls('/elearning/admin/stats').length === 2);
});

test('the participation and completion drawers list the indicators of the instance', async () => {
  await renderLoadedCatalog(adminCatalog());
  await view.waitFor(() => view.props('ElearningAdminStats').state === 'default');
  await view.click(metricCard('Taux de participation'));
  assert.match(view.text(), /Participation par service/);
  assert.match(view.text(), /État civil/);
  assert.match(view.text(), /Sans service/);
  await view.click(props => props['aria-label'] === 'Fermer la participation par service');
  assert.doesNotMatch(view.text(), /État civil/);
  await view.click(metricCard('Complétion moyenne'));
  assert.match(view.text(), /Complétion par formation/);
  assert.match(view.text(), /75,5 %/);
});

test('a create refused field by field shows the message under the resource and keeps the draft (MAIR-932)', async () => {
  await renderLoadedCatalog(adminCatalog());
  await view.click('Nouvelle formation');
  const form = view.props('ElearningCourseFormModal');
  const contentId = form.initialValues.chapters[0].contents[0].id;
  for (const [id, value] of Object.entries({
    'elearning-course-title': 'Prévention', 'elearning-course-description': 'Les bons réflexes', 'elearning-course-duration': '1 h',
    [`chapter-title-${form.initialValues.chapters[0].id}`]: 'Alerter', [`content-title-${contentId}`]: 'Guide',
    [`content-resource-${contentId}`]: 'https://exemple.fr/guide',
  })) await view.fire(props => props.id === id, 'onChange', { target: { value } });
  bffElearning.on('post', '/elearning/admin/courses', {
    status: 400, outOfContract: true,
    body: f.apiError('BAD_REQUEST', 'Validation failed', [
      { path: 'body.details.chapters.0.contents.0.href', message: 'A link needs an absolute https:// URL.' },
      { path: 'body.deadline', message: 'Expected a date (YYYY-MM-DD).' },
    ]),
  });
  await view.fire((props, _text, tag) => tag === 'form' && 'aria-busy' in props, 'onSubmit');
  await view.waitFor(html => html.includes('Le service de formation a refusé certains champs'));
  assert.equal(view.props('ElearningCourseFormModal').isOpen, true);
  assert.match(view.text(), /Saisissez une adresse sécurisée commençant par https:\/\//);
  assert.match(view.text(), /Saisissez une date, par exemple 30 juin 2026\./);
  assert.equal(view.hostElements(props => props.id === 'elearning-course-title')[0].props.value, 'Prévention');
  const sent = requests().find(request => request.method === 'POST').body;
  assert.equal(sent.source, 'internal');
  assert.equal(sent.mandatory, false);
  assert.equal(sent.details.chapters[0].contents[0].type, 'link');
  assert.equal(sent.details.chapters[0].contents[0].href, 'https://exemple.fr/guide');
  assert.equal(bffElearning.calls('/elearning/catalog').length, 1, 'a refused save reads nothing again');
});

test('the administrator enrols and unenrols agents from « Agents inscrits » of a course (MAIR-817)', async () => {
  const learners = [f.courseLearner('42', 'Bruno', 'Petit', { status: 'in-progress', progress: 50, lastActivityAt: '2026-10-02T08:00:00' })];
  bffElearning.on('get', '/elearning/admin/courses/{courseId}/learners', ({ pathParams }) => ({
    body: { courseId: pathParams.courseId, learners, total: learners.length, limit: 50, offset: 0, nextOffset: null },
  }));
  bffElearning.on('get', '/elearning/admin/agents', ({ url }) => ({
    body: {
      agents: url.searchParams.get('search') === 'zz' ? [] : [f.agent('50', 'Chloé', 'Durand'), f.agent('51', 'Denis', 'Roy')],
      limit: 20, offset: Number(url.searchParams.get('offset') ?? 0), nextOffset: url.searchParams.get('offset') ? null : 20,
    },
  }));
  bffElearning.on('post', '/elearning/admin/courses/{courseId}/learners', ({ pathParams, body }) => {
    learners.push(...body.userIds.map((id) => f.courseLearner(id, 'Chloé', 'Durand')));
    return { body: { courseId: pathParams.courseId, enrolled: body.userIds, alreadyEnrolled: [], failed: [] } };
  });
  bffElearning.on('delete', '/elearning/admin/courses/{courseId}/learners/{userId}', ({ pathParams }) => {
    learners.splice(learners.findIndex((learner) => learner.userId === pathParams.userId), 1);
    return { body: { removed: true, ...pathParams } };
  });
  await renderLoadedCatalog(adminCatalog());

  await view.click(props => props['aria-label'] === 'Agents inscrits à RGPD interne');
  await view.waitFor(() => view.text().includes('1 agent inscrit'));
  assert.match(view.text(), /Agents inscrits à « RGPD interne »/);
  assert.match(view.text(), /Bruno Petit/);
  assert.match(view.text(), /2 octobre 2026/);
  assert.equal(bffElearning.calls('/elearning/admin/courses/{courseId}/learners', 'GET')[0].pathParams.courseId, '4');

  // The drawer's own « Inscrire des agents » (the page header has one too, which opens the header entry).
  const drawerEnrol = view.hostElements((props, text, tag) => tag === 'button' && text === 'Inscrire des agents').at(-1).props;
  await view.click(props => props === drawerEnrol);
  await view.waitFor(() => view.text().includes('Chloé Durand'));
  assert.equal(bffElearning.calls('/elearning/admin/agents', 'GET')[0].url.searchParams.get('excludeCourseId'), '4');
  await view.click('Afficher plus d’agents');
  await view.waitFor(() => bffElearning.calls('/elearning/admin/agents', 'GET').length === 2);
  await view.fire((props, _text, tag) => tag === 'input' && props.placeholder === 'Nom, prénom ou e-mail', 'onChange', { target: { value: 'zz' } });
  await view.waitFor(() => view.text().includes('Aucun agent ne correspond à cette recherche.'));
  await view.fire((props, _text, tag) => tag === 'input' && props.placeholder === 'Nom, prénom ou e-mail', 'onChange', { target: { value: '' } });
  await view.waitFor(() => view.text().includes('Denis Roy'));
  await view.fire((props, _text, tag) => tag === 'input' && props.type === 'checkbox' && view.hostElements('Chloé Durand').length > 0 && props.checked === false, 'onChange', { target: { checked: true } });
  await view.waitFor(() => view.text().includes('1 agent sélectionné'));
  await view.click('Inscrire l’agent');
  await view.waitFor(html => toasts(html).some(toast => toast.includes('Agents inscrits')));
  assert.deepEqual(bffElearning.calls('/elearning/admin/courses/{courseId}/learners', 'POST')[0].body, { userIds: ['50'] });
  await view.waitFor(() => view.text().includes('2 agents inscrits'));

  await view.click(props => props['aria-label'] === 'Désinscrire Bruno Petit');
  await view.waitFor(() => view.text().includes('Désinscrire l’agent ?'));
  await view.click((props, text, tag) => tag === 'button' && text === 'Désinscrire');
  await view.waitFor(html => toasts(html).some(toast => toast.includes('Agent désinscrit')));
  assert.equal(bffElearning.calls('/elearning/admin/courses/{courseId}/learners/{userId}', 'DELETE')[0].pathParams.userId, '42');
  await view.waitFor(() => view.text().includes('1 agent inscrit'));
  await view.click(props => props['aria-label'] === 'Fermer la liste des agents inscrits');
  assert.doesNotMatch(view.text(), /Agents inscrits à « RGPD interne »/);
});

// MAIR-1224: the enrolment of agents is reachable from the page header (the course chosen first) and from the
// course sheet; the catalogue and the indicators follow the mockup; RGAA 11.9 and 12.6.
function enrolmentMocks() {
  const enrolled = [];
  bffElearning.on('get', '/elearning/admin/courses/{courseId}/learners', ({ pathParams }) => ({
    body: { courseId: pathParams.courseId, learners: enrolled.filter(learner => learner.courseId === pathParams.courseId).map(learner => learner.row), total: enrolled.filter(learner => learner.courseId === pathParams.courseId).length, limit: 50, offset: 0, nextOffset: null },
  }));
  bffElearning.on('get', '/elearning/admin/agents', () => ({ body: { agents: [f.agent('50', 'Chloé', 'Durand')], limit: 20, offset: 0, nextOffset: null } }));
  bffElearning.on('post', '/elearning/admin/courses/{courseId}/learners', ({ pathParams, body }) => {
    enrolled.push(...body.userIds.map(id => ({ courseId: pathParams.courseId, row: f.courseLearner(id, 'Chloé', 'Durand') })));
    return { body: { courseId: pathParams.courseId, enrolled: body.userIds, alreadyEnrolled: [], failed: [] } };
  });
}

test('MAIR-1224 the administrator enrols an agent from the header, choosing the course first, then reads the learners back', async () => {
  enrolmentMocks();
  await renderLoadedCatalog(adminCatalog());
  await view.click((props, text, tag) => tag === 'button' && text === 'Inscrire des agents');
  await view.waitFor(() => view.text().includes('Les agents déjà inscrits ne sont pas proposés.'));
  // « Formation » comes first, among the courses of the catalogue.
  assert.match(view.html, />Formation<\/label>/);
  assert.match(view.html, /<option value="4"[^>]*>RGPD interne<\/option><option value="9"[^>]*>Prise en main de l’outil<\/option>/);
  assert.match(view.html, /Inscrire des agents<\/h2>/);
  await view.fire((props, _text, tag) => tag === 'select', 'onChange', { target: { value: '9' } });
  await view.waitFor(() => view.text().includes('Chloé Durand') && bffElearning.calls('/elearning/admin/agents', 'GET').some(call => call.url.searchParams.get('excludeCourseId') === '9'));
  await view.fire((props, _text, tag) => tag === 'input' && props.type === 'checkbox' && props.checked === false, 'onChange', { target: { checked: true } });
  await view.waitFor(() => view.text().includes('1 agent sélectionné'));
  await view.click('Inscrire l’agent');
  await view.waitFor(html => toasts(html).some(toast => toast.includes('Agents inscrits')));
  const post = bffElearning.calls('/elearning/admin/courses/{courseId}/learners', 'POST')[0];
  assert.equal(post.pathParams.courseId, '9');
  assert.deepEqual(post.body, { userIds: ['50'] });
  await view.waitFor(() => !view.text().includes('Les agents déjà inscrits ne sont pas proposés.'));

  // Read back from the course sheet: « Agents inscrits » lists the agent just enrolled.
  await view.act(() => view.find('ManagedCourseCard').find(({ props }) => props.course.id === '9').props.onOpen(view.find('ManagedCourseCard').find(({ props }) => props.course.id === '9').props.course));
  await view.click((props, text, tag) => tag === 'button' && text === 'Agents inscrits');
  await view.waitFor(() => view.text().includes('Agents inscrits à « Prise en main de l’outil »') && view.text().includes('1 agent inscrit'));
  assert.ok(bffElearning.calls('/elearning/admin/courses/{courseId}/learners', 'GET').some(call => call.pathParams.courseId === '9'));
});

test('MAIR-1224 an agent has no enrolment entry, and an empty catalogue disables the header one', async () => {
  await renderLoadedCatalog(f.catalogResponse([f.course('4', { title: 'RGPD interne' })]));
  assert.equal(view.hostElements((props, text, tag) => tag === 'button' && text === 'Inscrire des agents').length, 0);
  assert.equal(view.props('CatalogHeader').onEnrol, undefined);
  await view.act(() => view.props('ManagedCourseCard').onOpen(view.props('ManagedCourseCard').course));
  assert.equal(view.hostElements((props, text, tag) => tag === 'button' && text === 'Agents inscrits').length, 0);

  view.unmount?.();
  await renderLoadedCatalog(f.catalogResponse([], f.currentUser({ isAdmin: true, role: 'Admin' })));
  assert.equal(view.props('CatalogHeader').enrolDisabled, true);
  assert.equal(view.hostElements((props, text, tag) => tag === 'button' && text === 'Inscrire des agents')[0].props.disabled, true);
});

test('MAIR-1224 the catalogue and the indicators carry the mockup titles, counter and filter labels', async () => {
  await renderLoadedCatalog(adminCatalog());
  await view.waitFor(() => view.props('ElearningAdminStats').state === 'default');
  const text = view.text();
  for (const label of ['Indicateurs de la commune', 'Toutes formations et tous agents confondus.', 'Catalogue de la commune', '2 formations · 1 interne, 1 de l’outil']) assert.ok(text.includes(label), label);
  assert.doesNotMatch(text, /Indicateurs du centre/);
  const filters = view.find('FilterSelect').map(({ props }) => props.label);
  assert.deepEqual(filters, ['Toutes les catégories', 'Tous les statuts', 'Obligatoires et facultatives', 'Toutes les origines']);
  assert.match(view.html, /type="search"[^>]*placeholder="Rechercher une formation…"|placeholder="Rechercher une formation…"[^>]*type="search"/);
  // The visible label is gone, the accessible name stays.
  assert.match(view.html, /class="sr-only">Rechercher une formation</);
  await view.act(() => view.props('CatalogFilters').onStatusChange('in-progress'));
  assert.equal(view.find('FilterSelect').map(({ props }) => props.label)[1], 'Statut');
});

test('MAIR-1224 RGAA 11.9: the indicator buttons are named by their visible text, without an aria-label of their own', async () => {
  await renderLoadedCatalog(adminCatalog());
  await view.waitFor(() => view.props('ElearningAdminStats').state === 'default');
  const cards = view.hostElements(metricCard('Taux de participation'));
  assert.equal(cards.length, 1);
  assert.equal(cards[0].props['aria-label'], undefined);
});

test('MAIR-1224 RGAA 12.6: the chapter actions of the course screen sit in a named region', async () => {
  const course = f.course();
  await renderPlayer(course);
  await view.waitFor(() => view.find('CoursePlayer').length === 1);
  assert.equal(view.html.match(/role="region" aria-label="Actions du chapitre"/g)?.length, 1);
  assert.match(view.html, /aria-label="Actions du chapitre"[^>]*>[\s\S]*Marquer comme terminé/);
});

test('MAIR-1224 the shared header names the commune of the deployment', async () => {
  const React = require('react');
  const Page = () => React.createElement(Home, { commune: 'Saint-André' });
  await renderLoadedCatalog(adminCatalog(), Page);
  assert.equal(view.props('AccessibleShell').commune, 'Saint-André');
});

// The shared header searches every module through BFF_Elearning and links a course to `?course=<id>`.
const searchAnswer = (id) => ({
  groups: [{ module: 'elearning', items: [{ kind: 'course', id, title: 'Sécurité incendie (recherche)', excerpt: 'Évacuation des locaux', parent_id: null, updated_at: '2026-11-20T10:00:00Z' }] }],
  unavailable: ['projects'],
});
const searchField = (props, _text, tag) => tag === 'input' && props.role === 'combobox';

test('MAIR-1230 typing in the header search lists the matching courses, choosing one opens its details', async () => {
  await renderLoadedCatalog(f.catalogResponse([f.course('4', { title: 'Sécurité incendie' })]));
  bffElearning.on('get', '/search', { body: searchAnswer(4) });

  await view.fire(searchField, 'onChange', { target: { value: 'sécu' } });
  await view.waitFor((html) => html.includes('Sécurité incendie (recherche)'));

  assert.deepEqual(operations(), ['GET /elearning/catalog', 'GET /search']);
  assert.equal(requests()[1].url.searchParams.get('q'), 'sécu');
  const dom = new JSDOM(view.html);
  try {
    const option = [...dom.window.document.querySelectorAll('[role="option"]')].find((node) => node.textContent.includes('Sécurité incendie (recherche)'));
    assert.ok(option, 'the course result is an option of the list');
    assert.equal(new URL(option.dataset.href).searchParams.get('course'), '4');
    assert.match(dom.window.document.body.textContent, /Projets ne répond pas/);
  } finally { dom.window.close(); }

  // Choosing the result navigates to the e-learning page with `?course=4`, which opens the course sheet.
  const location = front.window().location;
  const assign = location.assign;
  let target;
  location.assign = (href) => { target = String(href); };
  try {
    await view.click((props) => typeof props['data-href'] === 'string' && props['data-href'].includes('course=4'));
  } finally { location.assign = assign; }
  assert.equal(new URL(target).searchParams.get('course'), '4');
  view.unmount();

  front.window().location.href = target;
  await renderLoadedCatalog(f.catalogResponse([f.course('4', { title: 'Sécurité incendie' })]));
  assert.equal(view.props('ElearningCatalog').initialCourseId, '4');
  assert.match(view.html, /role="dialog"/);
  assert.match(view.text(), /Sécurité incendie/);
});

test('MAIR-1230 opening a course result shows its details, an unknown course id the missing-course notice', async () => {
  front.window().location.href = 'http://localhost:5006/?course=4';
  await renderLoadedCatalog(f.catalogResponse([f.course('4', { title: 'Sécurité incendie' })]));
  assert.equal(view.props('ElearningCatalog').initialCourseId, '4');
  assert.match(view.html, /role="dialog"/);
  assert.match(view.text(), /Sécurité incendie/);
  assert.deepEqual(operations(), ['GET /elearning/catalog']);
  view.unmount();

  front.window().location.href = 'http://localhost:5006/?course=999';
  await renderLoadedCatalog(f.catalogResponse([f.course('4', { title: 'Sécurité incendie' })]));
  assert.doesNotMatch(view.html, /role="dialog"/);
  assert.match(view.text(), /Cette formation n’est plus disponible/);
  assert.deepEqual(operations(), ['GET /elearning/catalog', 'GET /elearning/catalog'], 'one catalogue read per page load, no request loop');
});
