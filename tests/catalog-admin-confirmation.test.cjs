const assert = require('node:assert/strict');
const { after, afterEach, before, beforeEach, test } = require('node:test');
require('./support/load-typescript.cjs');
const f = require('./support/elearning-fixtures.ts');
const { errorReply, useMockedFront } = require('./support/mocked-front.ts');
const { createCatalogActions } = require('../src/features/elearning/catalogActions.ts');

// Real consumer actions -> unchanged middleware/proxy -> contract-validated HTTP mock.
const { bffElearning } = useMockedFront({ before, after, beforeEach, afterEach });
const operations = () => bffElearning.requests.map(({ method, template }) => `${method} ${template}`);

function stateFor(initial) {
  const state = { catalog: initial, loading: false, error: null, mutationError: null };
  const actions = createCatalogActions({
    setCatalogResponse: update => { state.catalog = update(state.catalog); },
    setLoading: value => { state.loading = value; },
    setError: value => { state.error = value; },
    setMutationError: value => { state.mutationError = value; },
  }, async () => { throw new Error('Unexpected authorization rejection'); });
  return { state, actions };
}

for (const confirmed of [false, true]) {
  test(`delete: repeated pending dispatch shares one confirmation and permits a later retry (${confirmed})`, async () => {
    const initial = f.catalogResponse([f.course('existing'), f.course('unrelated')]);
    const { state, actions } = stateFor(initial);
    const template = '/elearning/admin/courses/{courseId}';
    bffElearning.on('delete', template, confirmed
      ? { body: { deleted: true, courseId: 'existing' } }
      : errorReply(403, 'FORBIDDEN', 'Deletion refused'));
    bffElearning.on('get', '/elearning/catalog', errorReply(503, 'UNAVAILABLE', 'Read refused'));
    const originalFetch = global.fetch;
    let release;
    let received;
    const held = new Promise(resolve => { release = resolve; });
    const ready = new Promise(resolve => { received = resolve; });
    let first = true;
    global.fetch = async (...args) => {
      const hold = first && args[0] === '/elearning/admin/courses/existing' && args[1]?.method === 'DELETE';
      if (hold) first = false;
      const response = await originalFetch(...args);
      if (hold) { received(); await held; }
      return response;
    };
    const pending = [];
    try {
      pending.push(actions.deleteCourse('existing'));
      await ready;
      assert.deepEqual(state.catalog, initial, 'a pending response is not confirmation');
      pending.push(actions.deleteCourse('existing'));
      release();
      assert.deepEqual(await Promise.all(pending), [confirmed, confirmed]);
      assert.deepEqual(operations(), confirmed ? [`DELETE ${template}`, 'GET /elearning/catalog'] : [`DELETE ${template}`]);
      assert.deepEqual(state.catalog.catalog.courses.map(course => course.id), confirmed ? ['unrelated'] : ['existing', 'unrelated']);
      if (!confirmed) {
        assert.equal(state.mutationError, 'Deletion refused');
        bffElearning.on('delete', template, { body: { deleted: true, courseId: 'existing' } });
        assert.equal(await actions.deleteCourse('existing'), true);
        assert.deepEqual(operations(), [`DELETE ${template}`, `DELETE ${template}`, 'GET /elearning/catalog']);
        assert.deepEqual(state.catalog.catalog.courses.map(course => course.id), ['unrelated']);
      }
    } finally {
      release();
      await Promise.allSettled(pending);
      global.fetch = originalFetch;
    }
  });
}

test('create: an already-received server ID is updated without a duplicate or submitted draft', async () => {
  const initial = f.catalogResponse([f.course('existing'), f.course('unrelated')]);
  const { state, actions } = stateFor(initial);
  const confirmed = f.course('existing', { title: 'Server canonical title' });
  bffElearning.on('post', '/elearning/admin/courses', { status: 201, body: { course: confirmed } });
  bffElearning.on('get', '/elearning/catalog', errorReply(503, 'UNAVAILABLE', 'Refresh refused'));
  assert.equal(await actions.createCourse(f.course('draft-id')), true);
  assert.deepEqual(state.catalog.catalog.courses, [confirmed, initial.catalog.courses[1]]);
  assert.deepEqual(state.catalog.catalog.stats, initial.catalog.stats);
});

test('delete: different course identifiers remain independent while one deletion is pending', async () => {
  const initial = f.catalogResponse([f.course('held'), f.course('other')]);
  const { state, actions } = stateFor(initial);
  bffElearning.on('delete', '/elearning/admin/courses/{courseId}', ({ pathParams }) => ({ body: { deleted: true, courseId: pathParams.courseId } }));
  bffElearning.on('get', '/elearning/catalog', errorReply(503, 'UNAVAILABLE', 'Read refused'));
  const originalFetch = global.fetch;
  let release;
  let received;
  const held = new Promise(resolve => { release = resolve; });
  const ready = new Promise(resolve => { received = resolve; });
  global.fetch = async (...args) => {
    const response = await originalFetch(...args);
    if (args[0] === '/elearning/admin/courses/held' && args[1]?.method === 'DELETE') { received(); await held; }
    return response;
  };
  let pending;
  try {
    pending = actions.deleteCourse('held');
    await ready;
    assert.equal(await actions.deleteCourse('other'), true);
    assert.deepEqual(state.catalog.catalog.courses.map(course => course.id), ['held']);
    release();
    assert.equal(await pending, true);
    assert.deepEqual(state.catalog.catalog.courses, []);
    assert.deepEqual(operations(), ['DELETE /elearning/admin/courses/{courseId}', 'DELETE /elearning/admin/courses/{courseId}', 'GET /elearning/catalog', 'GET /elearning/catalog']);
  } finally {
    release();
    if (pending) await pending;
    global.fetch = originalFetch;
  }
});

test('delete: the same flight also covers its pending post-confirmation catalogue read', async () => {
  const { state, actions } = stateFor(f.catalogResponse([f.course('existing')]));
  bffElearning.on('delete', '/elearning/admin/courses/{courseId}', { body: { deleted: true, courseId: 'existing' } });
  bffElearning.on('get', '/elearning/catalog', errorReply(503, 'UNAVAILABLE', 'Read refused'));
  const originalFetch = global.fetch;
  let release;
  let received;
  const held = new Promise(resolve => { release = resolve; });
  const ready = new Promise(resolve => { received = resolve; });
  global.fetch = async (...args) => {
    const response = await originalFetch(...args);
    if (args[0] === '/elearning/catalog') { received(); await held; }
    return response;
  };
  const pending = [];
  try {
    pending.push(actions.deleteCourse('existing'));
    await ready;
    assert.deepEqual(state.catalog.catalog.courses, []);
    pending.push(actions.deleteCourse('existing'));
    release();
    assert.deepEqual(await Promise.all(pending), [true, true]);
    assert.deepEqual(operations(), ['DELETE /elearning/admin/courses/{courseId}', 'GET /elearning/catalog']);
    assert.equal(state.error, 'Read refused');
  } finally {
    release();
    await Promise.allSettled(pending);
    global.fetch = originalFetch;
  }
});

for (const response of [{ deleted: false, courseId: 'existing' }, { deleted: true, courseId: 'unrelated' }]) {
  test(`delete: does not remove courses without a matching positive confirmation (${JSON.stringify(response)})`, async () => {
    const initial = f.catalogResponse([f.course('existing'), f.course('unrelated')]);
    const { state, actions } = stateFor(initial);
    bffElearning.on('delete', '/elearning/admin/courses/{courseId}', { body: response });
    assert.equal(await actions.deleteCourse('existing'), false);
    assert.deepEqual(state.catalog, initial);
    assert.equal(state.mutationError, 'Une erreur inattendue est survenue.');
    assert.deepEqual(operations(), ['DELETE /elearning/admin/courses/{courseId}']);
  });
}

for (const mode of ['create', 'update', 'delete']) {
  const method = mode === 'create' ? 'post' : mode === 'update' ? 'patch' : 'delete';
  const template = mode === 'create' ? '/elearning/admin/courses' : '/elearning/admin/courses/{courseId}';

  function configureWrite() {
    const confirmed = f.course(mode === 'create' ? 'server-created-id' : 'existing', { title: 'Confirmed server title' });
    bffElearning.on(method, template, {
      status: mode === 'create' ? 201 : 200,
      body: mode === 'delete' ? { deleted: true, courseId: 'existing' } : { course: confirmed },
    });
    return confirmed;
  }

  function assertConfirmed(state, confirmed, initial) {
    const courses = state.catalog.catalog.courses;
    if (mode === 'delete') assert.ok(!courses.some(course => course.id === 'existing'));
    else assert.deepEqual(courses.find(course => course.id === confirmed.id), confirmed);
    assert.deepEqual(courses.find(course => course.id === 'unrelated'), initial.catalog.courses[1]);
    assert.deepEqual(state.catalog.catalog.stats, initial.catalog.stats, 'do not invent official counters');
    assert.deepEqual(state.catalog.user, initial.user);
    assert.deepEqual(state.catalog.footer, initial.footer);
  }

  function run(actions) {
    return actions[`${mode}Course`](mode === 'delete' ? 'existing' : f.course('existing', { title: 'Submitted draft, not the confirmed response' }));
  }

  test(`${mode}: a confirmed server response survives refused catalogue refresh and GET-only retry`, async () => {
    const initial = f.catalogResponse([f.course('existing'), f.course('unrelated')]);
    const { state, actions } = stateFor(initial);
    const confirmed = configureWrite();
    bffElearning.on('get', '/elearning/catalog', errorReply(503, 'UNAVAILABLE', 'Catalogue unavailable'));
    assert.equal(await run(actions), true);
    assertConfirmed(state, confirmed, initial);
    assert.equal(state.mutationError, null);
    assert.equal(state.error, 'Catalogue unavailable');
    const refreshed = f.catalogResponse(mode === 'delete' ? [f.course('unrelated')] : [confirmed, f.course('unrelated')]);
    refreshed.catalog.stats = [{ label: 'Official value', value: 42 }];
    bffElearning.on('get', '/elearning/catalog', { body: refreshed });
    await actions.loadCatalog();
    assert.deepEqual(state.catalog, refreshed);
    assert.equal(state.error, null);
    assert.deepEqual(operations(), [`${method.toUpperCase()} ${template}`, 'GET /elearning/catalog', 'GET /elearning/catalog']);
  });

  test(`${mode}: a pre-mutation catalogue response cannot erase the confirmation`, async () => {
    const initial = f.catalogResponse([f.course('existing'), f.course('unrelated')]);
    const { state, actions } = stateFor(initial);
    const originalFetch = global.fetch;
    let release;
    let received;
    const held = new Promise(resolve => { release = resolve; });
    const ready = new Promise(resolve => { received = resolve; });
    let first = true;
    global.fetch = async (...args) => {
      const response = await originalFetch(...args);
      if (args[0] === '/elearning/catalog' && first) {
        first = false;
        received();
        await held;
      }
      return response;
    };
    let staleRead;
    try {
      bffElearning.on('get', '/elearning/catalog', { body: initial });
      staleRead = actions.loadCatalog();
      await ready;
      const confirmed = configureWrite();
      bffElearning.on('get', '/elearning/catalog', errorReply(503, 'UNAVAILABLE', 'Current refresh refused'));
      assert.equal(await run(actions), true);
      release();
      await staleRead;
      assertConfirmed(state, confirmed, initial);
      assert.equal(state.error, 'Current refresh refused');
      assert.equal(state.loading, false);
    } finally {
      release();
      if (staleRead) await staleRead;
      global.fetch = originalFetch;
    }
  });

  test(`${mode}: refused write leaves the received catalogue untouched and does not refresh`, async () => {
    const initial = f.catalogResponse([f.course('existing'), f.course('unrelated')]);
    const { state, actions } = stateFor(initial);
    bffElearning.on(method, template, errorReply(503, 'UNAVAILABLE', 'Write refused'));
    assert.equal(await run(actions), false);
    assert.deepEqual(state.catalog, initial);
    assert.equal(state.mutationError, 'Write refused');
    assert.deepEqual(operations(), [`${method.toUpperCase()} ${template}`]);
  });
}
