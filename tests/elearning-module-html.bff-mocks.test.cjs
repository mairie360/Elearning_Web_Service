const assert = require('node:assert/strict');
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
const { errorReply, useMockedFront } = require('./support/mocked-front.ts');
const Home = require('../src/app/page.tsx').default;

const front = useMockedFront({ before, after, beforeEach, afterEach });
const { bffElearning, runtime } = front;
let view;

afterEach(() => {
  view?.unmount();
  view = undefined;
});

const operations = () => bffElearning.requests.map((request) => `${request.method} ${request.template}`);

for (const returnedId of ['unrelated', ' ']) {
  test(`the actual admin form keeps all edits after an uncorrelated receipt ${JSON.stringify(returnedId)}`, async () => {
    const initial = f.catalogResponse([f.course(), f.course('unrelated', { title: 'Independent course' })], f.currentUser({ isAdmin: true }));
    await renderLoadedCatalog(initial);
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
      body: { course: f.course(returnedId, { title: 'Foreign course replacement' }) },
    });
    await view.fire((props, _text, tag) => tag === 'form' && props.role === 'dialog', 'onSubmit');
    await view.waitFor(html => html.includes('La modification n’a pas été confirmée'));
    assert.equal(view.props('ElearningCourseFormModal').isOpen, true);
    assert.deepEqual(view.props('ElearningCatalog').courses, initial.catalog.courses);
    for (const [id, value] of Object.entries(edits)) {
      assert.equal(view.hostElements(props => props.id === id)[0].props.value, value);
    }
    assert.doesNotMatch(view.html, /aria-label="Confirmation de la formation"/);
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
  await view.click('Commencer');
  await view.waitFor(html => html.includes('Le démarrage n’a pas été confirmé'));
  assert.deepEqual(view.props('ElearningCatalog').courses, courses);
  assert.match(view.html, /role="dialog"/);
  assert.match(view.text(), /Progression totale\s+0%/);
  assert.doesNotMatch(view.text(), /Remplacement étranger/);
  assert.deepEqual(operations(), ['GET /elearning/catalog', 'POST /elearning/courses/{courseId}/start']);
});

for (const scenario of ['foreign-content', 'negative-completion']) {
  test(`the real reader does not tick content or replace its progress after ${scenario}`, async () => {
    const course = f.course();
    course.progress = course.details.progress = 12;
    front.window().location.href = `https://elearning.test.example/?course=${course.id}`;
    await renderLoadedCatalog(f.catalogResponse([course]));
    const content = course.details.chapters[0].contents[0];
    const response = f.contentCompleteResponse();
    response.content = scenario === 'foreign-content'
      ? { ...response.content, id: 'foreign' }
      : { ...response.content, completed: false };
    bffElearning.on('post', '/elearning/courses/{courseId}/contents/{contentId}/complete', { body: response });
    await view.click(props => props['aria-label'] === `Marquer ${content.title} comme terminé`);
    await view.waitFor(html => html.includes('La progression n’a pas été confirmée'));
    assert.match(view.text(), /Progression totale\s+12%/);
    assert.deepEqual(view.props('ElearningCatalog').courses, [course]);
    assert.equal(view.find('ElearningCourseRating').length, 0);
    assert.match(view.html, /role="dialog"/);
    assert.deepEqual(operations(), ['GET /elearning/catalog', 'POST /elearning/courses/{courseId}/contents/{contentId}/complete']);
    assert.match(view.html, new RegExp(`aria-label="Marquer ${content.title} comme terminé"`));
    assert.equal(view.hostElements(props => props['aria-label'] === `Marquer ${content.title} comme terminé`)[0].props.disabled, false);
  });
}

for (const mode of ['create', 'update']) {
  test(`confirmed admin ${mode} announces the canonical response despite a refused GET and dismissal never writes`, async () => {
    await renderLoadedCatalog(f.catalogResponse([f.course()], f.currentUser({ isAdmin: true })));
    const method = mode === 'create' ? 'post' : 'patch';
    const path = mode === 'create' ? '/elearning/admin/courses' : '/elearning/admin/courses/{courseId}';
    const callback = mode === 'create' ? 'onCreateCourse' : 'onUpdateCourse';
    const canonical = f.course('rgpd-collectivites', { title: 'Titre canonique du serveur' });
    const draft = { ...canonical, title: 'Titre du brouillon' };
    bffElearning.on(method, path, { status: mode === 'create' ? 201 : 200, body: { course: canonical } });
    bffElearning.on('get', '/elearning/catalog', errorReply(503, 'UNAVAILABLE', 'Catalogue après confirmation refusé'));
    assert.equal(await view.act(() => view.props('ElearningCatalog')[callback](draft)), true);
    assert.match(view.html, /role="status"[^>]*aria-label="Confirmation de la formation"/);
    assert.match(view.text(), new RegExp(`Formation "Titre canonique du serveur" ${mode === 'create' ? 'créée' : 'mise à jour'}\\.`));
    assert.doesNotMatch(view.text(), /Titre du brouillon/);
    assert.match(view.text(), /Catalogue après confirmation refusé/);
    const beforeDismiss = operations();
    await view.click(props => props['aria-label'] === 'Fermer la confirmation');
    assert.doesNotMatch(view.html, /aria-label="Confirmation de la formation"/);
    assert.deepEqual(operations(), beforeDismiss);
    bffElearning.on('get', '/elearning/catalog', { body: f.catalogResponse([canonical], f.currentUser({ isAdmin: true })) });
    await view.click('Réessayer');
    await view.waitFor(html => !html.includes('Catalogue après confirmation refusé'));
    assert.deepEqual(operations(), ['GET /elearning/catalog', `${method.toUpperCase()} ${path}`, 'GET /elearning/catalog', 'GET /elearning/catalog']);
  });
}

test('a confirmed deletion has truthful status and a subsequent refused write clears that old confirmation', async () => {
  await renderLoadedCatalog(f.catalogResponse([f.course()], f.currentUser({ isAdmin: true })));
  bffElearning.on('delete', '/elearning/admin/courses/{courseId}', { body: { deleted: true, courseId: 'rgpd-collectivites' } });
  bffElearning.on('get', '/elearning/catalog', errorReply(503, 'UNAVAILABLE', 'Catalogue après suppression refusé'));
  await view.act(() => view.props('ElearningCatalog').onDeleteCourse(f.course()));
  await view.waitFor(html => html.includes('Catalogue après suppression refusé'));
  assert.match(view.text(), /Formation supprimée\./);
  assert.match(view.html, /aria-label="Confirmation de la formation"/);
  bffElearning.on('post', '/elearning/admin/courses', errorReply(403, 'FORBIDDEN', 'Création refusée'));
  assert.equal(await view.act(() => view.props('ElearningCatalog').onCreateCourse(f.course())), false);
  assert.doesNotMatch(view.html, /aria-label="Confirmation de la formation"/);
  assert.match(view.text(), /Création refusée/);
  assert.deepEqual(operations(), ['GET /elearning/catalog', 'DELETE /elearning/admin/courses/{courseId}', 'GET /elearning/catalog', 'POST /elearning/admin/courses']);
});

test('GET-only recovery retains the undismissed canonical success without repeating an admin write', async () => {
  await renderLoadedCatalog(f.catalogResponse([f.course()], f.currentUser({ isAdmin: true })));
  const canonical = f.course('rgpd-collectivites', { title: 'Titre confirmé conservé' });
  bffElearning.on('patch', '/elearning/admin/courses/{courseId}', { body: { course: canonical } });
  bffElearning.on('get', '/elearning/catalog', errorReply(503, 'UNAVAILABLE', 'Lecture de récupération refusée'));
  assert.equal(await view.act(() => view.props('ElearningCatalog').onUpdateCourse(canonical)), true);
  assert.match(view.text(), /Formation "Titre confirmé conservé" mise à jour\./);
  bffElearning.on('get', '/elearning/catalog', { body: f.catalogResponse([canonical], f.currentUser({ isAdmin: true })) });
  await view.click('Réessayer');
  await view.waitFor(html => !html.includes('Lecture de récupération refusée') && !html.includes('Actualisation des formations…'));
  assert.match(view.html, /aria-label="Confirmation de la formation"/);
  assert.match(view.text(), /Formation "Titre confirmé conservé" mise à jour\./);
  assert.deepEqual(operations(), ['GET /elearning/catalog', 'PATCH /elearning/admin/courses/{courseId}', 'GET /elearning/catalog', 'GET /elearning/catalog']);
});

test('a pending write and a contract-shaped unconfirmed deletion never announce success', async (t) => {
  await renderLoadedCatalog(f.catalogResponse([f.course()], f.currentUser({ isAdmin: true })));
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
  await view.waitFor(() => bffElearning.requests.length === 2);
  assert.doesNotMatch(view.html, /aria-label="Confirmation de la formation"/);
  release();
  assert.equal(await pending, false);
  await view.settle();
  assert.doesNotMatch(view.html, /aria-label="Confirmation de la formation"/);
  bffElearning.on('delete', '/elearning/admin/courses/{courseId}', { body: { deleted: false, courseId: 'rgpd-collectivites' } });
  await view.act(() => view.props('ElearningCatalog').onDeleteCourse(f.course()));
  await view.waitFor(html => html.includes('Une erreur inattendue est survenue'));
  assert.doesNotMatch(view.html, /aria-label="Confirmation de la formation"/);
  assert.equal(view.props('ElearningCatalog').courses.length, 1);
});

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
  assert.equal(view.find('AppShell').length, 1);
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
  assert.equal(view.props('ElearningCatalog').allowRatingEdits, true);
  assert.equal(view.props('ElearningCatalog').className, 'elearning-catalog-shell min-h-full !px-6 !py-8');
  assert.match(html, /<footer/);
  assert.match(html, /<aside\b[^]*?<footer\b[^]*?<\/footer>[^]*?<\/aside>/);
  assert.doesNotMatch(html, /<\/main>\s*<footer\b/);
  assert.match(view.text(), /1\.0\.0/);
});

test('an administrator sees the catalogue with the administrator role', async () => {
  await renderLoadedCatalog(f.catalogResponse([f.course()], f.currentUser({ name: 'Admin Mairie', initials: 'AM', role: 'Admin', isAdmin: true })));

  assert.equal(view.props('ElearningCatalog').currentUserRole, 'administrator');
  assert.equal(view.props('Sidebar').isAdmin, true);
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
    const resetChoices = view.props('ElearningFilterSelect', 0).options.filter(option => option.value === 'all');
    assert.equal(resetChoices.length, 1);
    await view.act(() => view.props('ElearningSearchInput').onValueChange('Parcours'));
    await view.act(() => view.props('ElearningFilterSelect', 1).onValueChange('in-progress'));
    if (supplied?.length !== 0) {
      await view.act(() => view.props('ElearningFilterSelect', 0).onValueChange('Juridique'));
      assert.match(view.html, /Parcours juridique/);
      assert.doesNotMatch(view.html, /Parcours accueil/);
    }
    await view.act(() => view.props('ElearningFilterSelect', 0).onValueChange('all'));
    assert.match(view.html, /Parcours juridique/);
    assert.match(view.html, /Parcours accueil/);
    assert.doesNotMatch(view.html, /Parcours non commencé|Autre formation/);
    assert.equal(view.props('ElearningSearchInput').value, 'Parcours');
    assert.equal(view.props('ElearningFilterSelect', 1).value, 'in-progress');
    assert.deepEqual(operations(), ['GET /elearning/catalog']);
  });
}

for (const supplied of [[], [{ label: 'En cours reçu', value: 'in-progress' }], [
  { label: 'En cours reçu', value: 'in-progress' }, { label: 'Tout', value: 'all', disabled: true },
  { label: 'Tout en double', value: 'all' },
]]) {
  test(`visible status reset preserves category/search and recovers an empty result (${JSON.stringify(supplied)})`, async () => {
    const body = f.catalogResponse([
      f.course('waiting', { title: 'Parcours non commencé' }),
      f.course('learning', { title: 'Parcours en cours', statusValue: 'in-progress' }),
      f.course('other-category', { title: 'Parcours ailleurs', category: 'Accueil', statusValue: 'in-progress' }),
      f.course('other-search', { title: 'Autre formation', statusValue: 'in-progress' }),
    ]);
    body.catalog.statuses = supplied;
    await renderLoadedCatalog(body);
    await view.act(() => view.props('ElearningSearchInput').onValueChange('Parcours non'));
    await view.act(() => view.props('ElearningFilterSelect', 0).onValueChange('Juridique'));
    if (supplied.length) {
      await view.click(props => props['aria-label'] === 'Tous les statuts');
      await view.click((props, text) => props.role === 'option' && text === 'En cours reçu');
      assert.match(view.text(), /Aucune formation/);
      assert.doesNotMatch(view.html, /<article/);
    }
    await view.click(props => props['aria-label'] === 'Tous les statuts');
    const options = view.props('ElearningFilterSelect', 1).options;
    const resets = options.filter(option => option.value === 'all');
    assert.equal(resets.length, 1, 'there must be one visible way back to all statuses');
    assert.notEqual(resets[0].disabled, true);
    await view.click((props, text) => props.role === 'option' && text === resets[0].label);
    assert.equal(view.props('ElearningFilterSelect', 1).value, 'all');
    assert.equal(view.props('ElearningFilterSelect', 0).value, 'Juridique');
    assert.equal(view.props('ElearningSearchInput').value, 'Parcours non');
    assert.match(view.html, /Parcours non commencé/);
    assert.doesNotMatch(view.html, /Parcours en cours|Parcours ailleurs|Autre formation/);
    assert.deepEqual(operations(), ['GET /elearning/catalog']);
  });
}

for (const mode of ['create', 'update']) {
  test(`the rendered administrator catalogue forwards ${mode} refusal and confirmation promises`, async () => {
    await renderLoadedCatalog(f.catalogResponse([f.course()], f.currentUser({ isAdmin: true })));
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

    bffElearning.on(method, path, ({ body }) => ({ status: mode === 'create' ? 201 : 200, body: { course: body } }));
    const confirmed = await view.act(() => view.props('ElearningCatalog')[callback](f.course()));
    assert.equal(confirmed, true);
    assert.deepEqual(operations(), ['GET /elearning/catalog', `${method.toUpperCase()} ${path}`, `${method.toUpperCase()} ${path}`, 'GET /elearning/catalog']);
  });
}

test('repeating the visible Delete action while pending sends one write; refusal keeps the course for retry', async () => {
  await renderLoadedCatalog(f.catalogResponse([f.course()], f.currentUser({ isAdmin: true })));
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
    bffElearning.on('delete', '/elearning/admin/courses/{courseId}', { body: { deleted: true, courseId: 'rgpd-collectivites' } });
    bffElearning.on('get', '/elearning/catalog', errorReply(503, 'UNAVAILABLE', 'Relecture refusée'));
    await view.click(remove);
    await view.waitFor(html => html.includes('Relecture refusée'));
    assert.doesNotMatch(view.text(), /RGPD et collectivités|Suppression refusée/);
    assert.deepEqual(operations(), ['GET /elearning/catalog', 'DELETE /elearning/admin/courses/{courseId}', 'DELETE /elearning/admin/courses/{courseId}', 'GET /elearning/catalog']);
  } finally {
    release();
    global.fetch = originalFetch;
  }
});

for (const mode of ['start', 'complete', 'rating']) {
  test(`the rendered learner catalogue forwards ${mode} refusal and confirmation promises`, async () => {
    await renderLoadedCatalog();
    const path = mode === 'complete'
      ? '/elearning/courses/{courseId}/contents/{contentId}/complete'
      : `/elearning/courses/{courseId}/${mode}`;
    const payload = f.contentCompleteResponse();
    const dispatch = () => {
      const props = view.props('ElearningCatalog');
      const course = props.courses[0];
      return mode === 'start' ? props.onCourseAction(course)
        : mode === 'complete' ? props.onCourseContentComplete(course, payload)
        : props.onCourseRatingSubmit(course, 5);
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

test('the catalog marks the real BFF statistic count for the responsive layout', async () => {
  const threeStats = f.catalogResponse();
  threeStats.catalog.stats = [
    { label: 'Formations disponibles', value: 3 },
    { label: 'En cours', value: 1 },
    { label: 'Terminées', value: 2 },
  ];
  const html = await renderLoadedCatalog(threeStats);

  assert.equal(view.props('ElearningCatalog')['data-stat-count'], 3);
  assert.match(html, /data-stat-count="3"/);
  assert.match(view.text(), /Formations disponibles/);
  assert.deepEqual(operations(), ['GET /elearning/catalog']);
});

test('four BFF statistics retain the shared four-column layout', async () => {
  const fourStats = f.catalogResponse();
  fourStats.catalog.stats = [
    { label: 'Formations disponibles', value: 4 },
    { label: 'En cours', value: 1 },
    { label: 'Terminées', value: 2 },
    { label: 'Certifications', value: 1 },
  ];
  const html = await renderLoadedCatalog(fourStats);

  assert.equal(view.props('ElearningCatalog')['data-stat-count'], 4);
  assert.match(html, /data-stat-count="4"/);
  assert.deepEqual(operations(), ['GET /elearning/catalog']);
});

test('a course link opens only an existing course and closing preserves other URL parameters', async () => {
  front.window().location.href = 'https://elearning.test.example/?view=all&course=rgpd-collectivites#catalog';
  await renderLoadedCatalog();

  assert.equal(view.props('ElearningCatalog').initialCourseId, 'rgpd-collectivites');
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
  assert.match(view.html, /role="alert"/);
  assert.match(view.text(), /Cette formation n’est plus disponible/);
  assert.doesNotMatch(view.html, /role="dialog"/);
  assert.deepEqual(operations(), ['GET /elearning/catalog']);

  await view.click('Voir le catalogue');
  assert.equal(front.window().location.href, 'https://elearning.test.example/?view=all');
  assert.doesNotMatch(view.html, /role="alert"/);
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
    front.window().location.href = `https://elearning.test.example/?course=${course.id}`;
    await renderLoadedCatalog(f.catalogResponse([course]));

    assert.match(view.html, /role="dialog"/);
    assert.match(view.text(), /Aucun contenu disponible pour cette formation/);
    assert.doesNotMatch(view.text(), /Progression totale|Marquer.*comme terminé|Noter cette formation/);
    const reader = view.props('ElearningCourseDetailsModal');
    assert.equal(reader.optimisticUpdates, false);
    assert.equal(reader.progress, undefined);
    assert.equal(reader.chapters.length, supplied === 'no-details' || supplied === 'no-chapters' ? 0 : 1);
    if (reader.chapters.length) {
      assert.equal(view.props('ElearningCourseDetailsModal').chapters[0].title, course.details.chapters[0].title);
      assert.match(view.text(), /0 contenu/);
    } else assert.match(view.text(), /Aucun chapitre disponible/);
    assert.equal(view.find('ElearningCourseRating').length, 0);
    assert.deepEqual(operations(), ['GET /elearning/catalog']);
  });
}

test('the real chapter controls retain the selected reader and server progression after a refused refresh', async () => {
  const first = f.chapter('first', [f.content('first-content', { type: 'document' })]);
  const second = f.chapter('second', [f.content('second-content', {
    type: 'pdf', title: 'Support officiel', href: '/documents/support.pdf', fileName: 'support.pdf',
  })]);
  const course = f.course('reader-course', {
    progress: 12,
    details: { title: 'Lecteur fourni', description: 'Description fournie', progress: 12, chapters: [first, second] },
  });
  front.window().location.href = `https://elearning.test.example/?course=${course.id}`;
  await renderLoadedCatalog(f.catalogResponse([course]));
  assert.match(view.html, /Chapitre second/);
  await view.click((props, _text, tag) => tag === 'button' && props['aria-pressed'] === false);
  assert.match(view.html, /href="\/documents\/support\.pdf"/);
  assert.match(view.text(), /Support officiel/);
  assert.match(view.text(), /Progression totale\s+12%/);

  const confirmedSecond = { ...second, contents: [{ ...second.contents[0], completed: true }], completed: true };
  const response = {
    progress: 37, completedRequiredContents: 1, totalRequiredContents: 2,
    completedChapters: 1, totalChapters: 2, completed: false,
    chapters: [first, confirmedSecond], chapter: confirmedSecond, content: confirmedSecond.contents[0],
  };
  bffElearning.on('post', '/elearning/courses/{courseId}/contents/{contentId}/complete', { body: response });
  bffElearning.on('get', '/elearning/catalog', errorReply(503, 'UNAVAILABLE', 'Relecture du parcours refusée'));
  await view.click(props => props['aria-label'] === 'Marquer Support officiel comme terminé');
  await view.waitFor(html => html.includes('Relecture du parcours refusée'));

  assert.match(view.html, /role="dialog"/);
  assert.match(view.text(), /Progression totale\s+37%/);
  assert.match(view.html, /aria-label="Support officiel terminé"[^>]*disabled=""/);
  assert.match(view.html, /<button[^>]*aria-pressed="true"[^>]*>(?:(?!<\/button>)[\s\S])*Chapitre second/);
  assert.deepEqual(view.props('ElearningCatalog').courses[0].details.chapters, response.chapters);
  assert.deepEqual(operations(), ['GET /elearning/catalog', 'POST /elearning/courses/{courseId}/contents/{contentId}/complete', 'GET /elearning/catalog']);
  assert.deepEqual(bffElearning.requests[1].pathParams, { courseId: course.id, contentId: 'second-content' });
  assert.deepEqual(bffElearning.requests[1].body, { chapterId: 'second', completed: true });
});

for (const previouslySubmitted of [false, true]) {
  test(`the published rating control retains selection and cancellation after a negative acknowledgement (prior=${previouslySubmitted})`, async () => {
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
    front.window().location.href = `https://elearning.test.example/?course=${course.id}`;
    await renderLoadedCatalog(f.catalogResponse([course]));
    if (previouslySubmitted) await view.click('Modifier ma note');
    await view.click(props => props['aria-label'] === 'Donner la note 3 sur 5');
    bffElearning.on('post', '/elearning/courses/{courseId}/rating', {
      body: { rating: 1, ratingCount: 99, ratingDistribution: { 1: 99 }, submitted: false },
    });
    await view.click(previouslySubmitted ? 'Enregistrer ma note' : 'Envoyer la note');
    await view.waitFor(html => html.includes('Votre sélection est conservée'));
    assert.match(view.html, /role="alert"/);
    assert.match(view.html, /aria-label="Donner la note 3 sur 5"[^>]*aria-pressed="true"/);
    assert.deepEqual(view.props('ElearningCatalog').courses[0], course);
    assert.deepEqual(operations(), ['GET /elearning/catalog', 'POST /elearning/courses/{courseId}/rating']);
    if (previouslySubmitted) {
      await view.click('Annuler la modification');
      assert.match(view.html, /aria-label="Donner la note 4 sur 5"[^>]*aria-pressed="true"/);
      assert.match(view.text(), /Modifier ma note/);
      assert.deepEqual(operations(), ['GET /elearning/catalog', 'POST /elearning/courses/{courseId}/rating']);
    } else {
      assert.doesNotMatch(view.text(), /Merci, votre note a bien été enregistrée/);
      assert.match(view.text(), /Envoyer la note/);
    }
  });
}

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

test('starting a course refreshes official statistics without resetting filters or the reader', async () => {
  await renderLoadedCatalog(f.catalogResponse([f.course(), f.course('accueil', { title: 'Accueil des administrés' })]));
  const started = f.course('rgpd-collectivites', { statusValue: 'in-progress', statusBadge: { label: 'En cours', variant: 'inProgress' }, progress: 10 });
  bffElearning.on('post', '/elearning/courses/{courseId}/start', { body: { course: started } });
  const updated = f.catalogResponse([started, f.course('accueil', { title: 'Accueil des administrés' })]);
  updated.catalog.stats = [{ label: 'En cours', value: 7 }];
  bffElearning.on('get', '/elearning/catalog', { body: updated });
  await view.act(() => view.props('ElearningSearchInput').onValueChange('RGPD'));
  await view.act(() => view.props('ElearningFilterSelect', 0).onValueChange('Juridique'));

  await view.click('Commencer');
  await view.waitFor(() => view.props('ElearningCatalog').stats[0].value === 7);

  assert.deepEqual(operations(), ['GET /elearning/catalog', 'POST /elearning/courses/{courseId}/start', 'GET /elearning/catalog']);
  assert.deepEqual(bffElearning.requests[1].pathParams, { courseId: 'rgpd-collectivites' });
  assert.deepEqual(view.props('ElearningCatalog').courses.map((item) => [item.id, item.statusValue]), [['rgpd-collectivites', 'in-progress'], ['accueil', 'not-started']]);
  assert.equal(view.props('ElearningSearchInput').value, 'RGPD');
  assert.equal(view.props('ElearningFilterSelect', 0).value, 'Juridique');
  assert.match(view.html, /role="dialog"/);
  assert.match(view.text(), /En cours/);
  assert.deepEqual(view.props('ElearningCatalog').stats, updated.catalog.stats);
  assert.doesNotMatch(view.html, /role="alert"/);
});

test('a failed start refresh keeps the confirmed reader and offers GET-only retry', async () => {
  await renderLoadedCatalog();
  const previousStats = view.props('ElearningCatalog').stats;
  const started = f.course('rgpd-collectivites', { statusValue: 'in-progress', statusBadge: { label: 'En cours', variant: 'inProgress' }, progress: 10 });
  bffElearning.on('post', '/elearning/courses/{courseId}/start', { body: { course: started } });
  bffElearning.on('get', '/elearning/catalog', errorReply(503, 'BFF_UNAVAILABLE', 'Actualisation indisponible'));
  await view.click('Commencer');
  await view.waitFor((html) => html.includes('Actualisation indisponible'));
  assert.deepEqual(view.props('ElearningCatalog').courses, [started]);
  assert.deepEqual(view.props('ElearningCatalog').stats, previousStats);
  assert.match(view.html, /role="dialog"/);
  const updated = f.catalogResponse([started]);
  updated.catalog.stats = [{ label: 'En cours', value: 2 }];
  bffElearning.on('get', '/elearning/catalog', { body: updated });
  await view.click('Réessayer');
  await view.waitFor((html) => !html.includes('role="alert"') && view.props('ElearningCatalog').stats[0].value === 2);
  assert.match(view.html, /role="dialog"/);
  assert.deepEqual(operations(), ['GET /elearning/catalog', 'POST /elearning/courses/{courseId}/start', 'GET /elearning/catalog', 'GET /elearning/catalog']);
});

test('a failed refresh after a rating keeps the catalogue visible and offers a reload-only retry', async () => {
  await renderLoadedCatalog();
  bffElearning.on('post', '/elearning/courses/{courseId}/rating', { body: f.ratingResponse(4) });
  bffElearning.on('get', '/elearning/catalog', errorReply(503, 'BFF_UNAVAILABLE', 'Actualisation indisponible'));

  await view.act(() => view.props('ElearningCatalog').onCourseRatingSubmit(view.props('ElearningCatalog').courses[0], 4));
  await view.waitFor(() => operations().length === 3);
  const html = await view.waitFor((current) => current.includes('role="alert"'));

  assert.match(html, /Actualisation indisponible/);
  assert.match(html, /class="fixed inset-x-4 bottom-4 z-\[60\]/);
  assert.match(view.text(), /Les dernières données confirmées restent affichées/);
  assert.equal(view.find('ElearningCatalog').length, 1);
  assert.match(view.text(), /RGPD et collectivités/);

  const updated = f.catalogResponse([f.course('rgpd-collectivites', { title: 'Catalogue actualisé' })]);
  bffElearning.on('get', '/elearning/catalog', { body: updated });
  await view.click('Réessayer');
  await view.waitFor((current) => !current.includes('role="alert"') && current.includes('Catalogue actualisé'));
  assert.match(view.text(), /Catalogue actualisé/);
  assert.deepEqual(operations(), ['GET /elearning/catalog', 'POST /elearning/courses/{courseId}/rating', 'GET /elearning/catalog', 'GET /elearning/catalog']);
});

test('a refused mutation is shown as an alert above the catalogue, which stays displayed', async () => {
  await renderLoadedCatalog();
  const initial = { courses: view.props('ElearningCatalog').courses, stats: view.props('ElearningCatalog').stats };
  bffElearning.on('post', '/elearning/courses/{courseId}/start', errorReply(403, 'FORBIDDEN', 'Cette formation ne vous est pas ouverte'));

  await view.act(() => view.props('ElearningCatalog').onCourseAction(view.props('ElearningCatalog').courses[0]));
  const html = await view.waitFor((current) => current.includes('role="alert"'));

  assert.match(html, /<div[^>]*role="alert">Cette formation ne vous est pas ouverte<\/div>/);
  assert.match(html, /class="fixed inset-x-4 bottom-4 z-\[60\]/);
  assert.match(html, /data-elearning-catalog-feedback/);
  assert.equal(view.find('ElearningCatalog').length, 1);
  assert.match(view.text(), /RGPD et collectivités/);
  assert.deepEqual({ courses: view.props('ElearningCatalog').courses, stats: view.props('ElearningCatalog').stats }, initial);
  assert.deepEqual(operations(), ['GET /elearning/catalog', 'POST /elearning/courses/{courseId}/start']);
});

async function confirmedCourseWithFailedRead() {
  const initial = f.catalogResponse([f.course()], f.currentUser({ isAdmin: true }));
  await renderLoadedCatalog(initial);
  const confirmed = f.course('rgpd-collectivites', { title: 'Formation confirmée' });
  bffElearning.on('patch', '/elearning/admin/courses/{courseId}', { body: { course: confirmed } });
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
  assert.deepEqual(view.props('ElearningCatalog').stats, initial.catalog.stats);
  assert.match(view.html, /data-elearning-feedback-stack/);
  assert.equal((view.html.match(/class="fixed inset-x-4 bottom-4/g) ?? []).length, 1, 'feedback occupies one non-overlapping stack');
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
    assert.match(view.html, /<button[^>]*disabled=""[^>]*aria-busy="true"[^>]*type="button">Réessayer<\/button>/);
    assert.match(view.html, /role="status"[^>]*>Actualisation des formations…/);
    assert.match(view.text(), /Formation confirmée/);
    release();
    await view.waitFor(html => !html.includes('Lecture refusée') && !html.includes('Actualisation des formations…'));
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
  await renderLoadedCatalog(initial);
  await view.act(() => view.props('ElearningSearchInput').onValueChange('Parcours'));
  await view.act(() => view.props('ElearningFilterSelect', 0).onValueChange('Juridique'));
  await view.act(() => view.props('ElearningFilterSelect', 1).onValueChange('completed'));
  assert.match(view.text(), /Aucune formation/);
  const resets = view.props('ElearningFilterSelect', 1).options.filter(option => option.value === 'all');
  assert.equal(resets.length, 1);
  assert.notEqual(resets[0].disabled, true);
  await view.act(() => view.props('ElearningFilterSelect', 1).onValueChange('all'));
  assert.match(view.text(), /Parcours juridique/);
  assert.doesNotMatch(view.text(), /Parcours accueil/);
  const confirmed = { ...course, title: 'Parcours confirmé' };
  bffElearning.on('patch', '/elearning/admin/courses/{courseId}', { body: { course: confirmed } });
  bffElearning.on('get', '/elearning/catalog', errorReply(503, 'UNAVAILABLE', 'Lecture composée refusée'));
  assert.equal(await view.act(() => view.props('ElearningCatalog').onUpdateCourse(confirmed)), true);
  bffElearning.on('delete', '/elearning/admin/courses/{courseId}', errorReply(403, 'FORBIDDEN', 'Suppression composée refusée'));
  await view.act(() => view.props('ElearningCatalog').onDeleteCourse(confirmed));
  await view.waitFor(html => html.includes('Suppression composée refusée'));
  assert.match(view.text(), /Parcours confirmé/);
  assert.match(view.text(), /Lecture composée refusée/);
  assert.deepEqual(view.props('ElearningCatalog').stats, initial.catalog.stats);
  await view.act(() => view.props('ElearningFilterSelect', 1).onValueChange('completed'));
  assert.match(view.text(), /Aucune formation/);
  await view.act(() => view.props('ElearningFilterSelect', 1).onValueChange('all'));
  assert.match(view.text(), /Parcours confirmé/);
  assert.equal(view.props('ElearningSearchInput').value, 'Parcours');
  assert.equal(view.props('ElearningFilterSelect', 0).value, 'Juridique');
  assert.deepEqual(operations(), ['GET /elearning/catalog', 'PATCH /elearning/admin/courses/{courseId}', 'GET /elearning/catalog', 'DELETE /elearning/admin/courses/{courseId}']);
  const empty = f.catalogResponse([], initial.user);
  empty.catalog.statuses = [];
  bffElearning.on('get', '/elearning/catalog', { body: empty });
  await view.click('Réessayer');
  await view.waitFor(html => !html.includes('Lecture composée refusée'));
  assert.match(view.text(), /Suppression composée refusée/);
  assert.match(view.text(), /Aucune formation/);
  assert.doesNotMatch(view.text(), /Parcours confirmé/);
  assert.equal(view.props('ElearningSearchInput').value, 'Parcours');
  assert.equal(view.props('ElearningFilterSelect', 0).value, 'Juridique');
  assert.equal(view.props('ElearningFilterSelect', 1).value, 'all');
  assert.deepEqual(view.props('ElearningFilterSelect', 1).options, [{ label: 'Tous les statuts', value: 'all' }]);
  assert.deepEqual(operations(), ['GET /elearning/catalog', 'PATCH /elearning/admin/courses/{courseId}', 'GET /elearning/catalog', 'DELETE /elearning/admin/courses/{courseId}', 'GET /elearning/catalog']);
});

test('composed status reset never restores a confirmed deletion after a failed read', async () => {
  const target = f.course('legal', { title: 'Parcours supprimé' });
  const body = f.catalogResponse([target, f.course('welcome', { title: 'Parcours accueil', category: 'Accueil' })], f.currentUser({ isAdmin: true }));
  body.catalog.statuses = [{ label: 'Terminées', value: 'completed' }];
  await renderLoadedCatalog(body);
  await view.act(() => view.props('ElearningSearchInput').onValueChange('Parcours'));
  await view.act(() => view.props('ElearningFilterSelect', 0).onValueChange('Juridique'));
  bffElearning.on('delete', '/elearning/admin/courses/{courseId}', { body: { deleted: true, courseId: target.id } });
  bffElearning.on('get', '/elearning/catalog', errorReply(503, 'UNAVAILABLE', 'Lecture après suppression refusée'));
  await view.act(() => view.props('ElearningCatalog').onDeleteCourse(target));
  await view.waitFor(html => html.includes('Lecture après suppression refusée'));
  await view.act(() => view.props('ElearningFilterSelect', 1).onValueChange('completed'));
  await view.act(() => view.props('ElearningFilterSelect', 1).onValueChange('all'));
  assert.match(view.text(), /Aucune formation/);
  assert.doesNotMatch(view.text(), /Parcours supprimé/);
  assert.deepEqual(view.props('ElearningCatalog').courses.map(course => course.id), ['welcome']);
  assert.deepEqual(view.props('ElearningCatalog').stats, body.catalog.stats);
  assert.equal(view.props('ElearningSearchInput').value, 'Parcours');
  assert.equal(view.props('ElearningFilterSelect', 0).value, 'Juridique');
  assert.deepEqual(operations(), ['GET /elearning/catalog', 'DELETE /elearning/admin/courses/{courseId}', 'GET /elearning/catalog']);
});

test('a session refused by the BFF leaves the page through the logout route', async () => {
  bffElearning.on('get', '/elearning/catalog', errorReply(401, 'UNAUTHORIZED', 'Session expirée'));
  view = mount(React.createElement(Home));

  await view.waitFor(() => front.window().location.assigned.length === 1);

  assert.deepEqual(front.window().location.assigned, ['/logout']);
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
    const isAdmin = view.props('Sidebar').isAdmin;
    for (const mobileOpen of [false, true]) {
      await view.act(() => view.props('Header').setSidebarOpen(mobileOpen));
      const sidebars = view.find('Sidebar');
      assert.equal(sidebars.length, mobileOpen ? 2 : 1);
      for (const { props } of sidebars) {
        assert.deepEqual(props.items.map(item => item.id),
          ['dashboard', 'projects', 'messages', 'training', 'calendar', 'admin', 'settings']);
        assert.equal(props.items.find(item => item.id === 'admin').adminOnly, true);
        assert.equal(props.isAdmin, isAdmin);
        assert.equal(props.activeItem, 'training');
      }
      const menus = view.html.match(/<nav\b[^>]*aria-label="Menu principal"[^>]*>[\s\S]*?<\/nav>/g) ?? [];
      assert.equal(menus.length, sidebars.length);
      for (const menu of menus) {
        assert.doesNotMatch(menu, /E-mails|Fichiers/);
        assert.match(menu, /Paramètres/);
        assert.equal(menu.includes('>Administration<'), isAdmin);
      }
    }
    const mobileSidebar = view.find('Sidebar')[1].props;
    await view.act(() => mobileSidebar.onItemSelect(mobileSidebar.items.find(item => item.id === 'settings')));
    assert.deepEqual(assigned, ['https://settings.test.example/']);
    assert.equal(view.find('Sidebar').length, 1);
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
