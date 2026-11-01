const assert = require('node:assert/strict');
const { after, afterEach, before, beforeEach, test } = require('node:test');
require('./support/load-typescript.cjs');
const f = require('./support/elearning-fixtures.ts');
const { errorReply, useMockedFront } = require('./support/mocked-front.ts');
const { createCatalogActions, getErrorMessage } = require('../src/features/elearning/catalogActions.ts');

// Actual consumer actions -> unchanged middleware/proxy -> published contract HTTP mock.
const { bffElearning } = useMockedFront({ before, after, beforeEach, afterEach });
const template = '/elearning/courses/{courseId}/rating';
const operations = () => bffElearning.requests.map(({ method, template }) => `${method} ${template}`);
const refusal = 'La note n’a pas été enregistrée. Votre sélection est conservée ; réessayez.';

function stateFor(previouslySubmitted) {
  const course = f.course();
  course.details.completionRating = previouslySubmitted
    ? { initialValue: 4, submitted: true }
    : { submitted: false };
  const initial = f.catalogResponse([course, f.course('unrelated')]);
  const state = { catalog: initial, error: 'Earlier catalogue refusal', mutationError: null };
  const actions = createCatalogActions({
    setCatalogResponse: update => { state.catalog = update(state.catalog); },
    setLoading: () => {},
    setError: value => { state.error = value; },
    setMutationError: value => { state.mutationError = value; },
  });
  return { initial, state, actions, course };
}

for (const previouslySubmitted of [false, true]) {
  test(`submitted:false preserves all confirmed data without a refresh (prior=${previouslySubmitted})`, async () => {
    const { initial, state, actions, course } = stateFor(previouslySubmitted);
    bffElearning.on('post', template, {
      body: { rating: 1, ratingCount: 99, ratingDistribution: { 1: 99 }, submitted: false },
    });
    assert.equal(await actions.rateCourse(course.id, 3), false);
    assert.equal(state.catalog, initial, 'no personal note, aggregate, unrelated course or statistics change');
    assert.equal(state.mutationError, refusal);
    assert.equal(state.error, 'Earlier catalogue refusal', 'read and write failures stay independent');
    assert.deepEqual(operations(), [`POST ${template}`]);
    assert.deepEqual(bffElearning.requests[0].body, { rating: 3 });
  });

  test(`only an explicit retry with submitted:true replaces the note (prior=${previouslySubmitted})`, async () => {
    const { initial, state, actions, course } = stateFor(previouslySubmitted);
    bffElearning.on('post', template, { body: { ...f.ratingResponse(1), submitted: false } });
    assert.equal(await actions.rateCourse(course.id, 3), false);
    const confirmed = { rating: 3.5, ratingCount: 2, ratingDistribution: { 3: 1, 4: 1 }, submitted: true };
    bffElearning.on('post', template, { body: confirmed });
    bffElearning.on('get', '/elearning/catalog', errorReply(503, 'UNAVAILABLE', 'Later read refused'));
    assert.equal(await actions.rateCourse(course.id, 3), true);
    const updated = state.catalog.catalog.courses[0];
    assert.equal(updated.details.completionRating.initialValue, 3);
    assert.equal(updated.details.completionRating.submitted, true);
    assert.equal(updated.rating, confirmed.rating);
    assert.deepEqual(updated.ratingDistribution, confirmed.ratingDistribution);
    assert.equal(state.catalog.catalog.courses[1], initial.catalog.courses[1]);
    assert.deepEqual(state.catalog.catalog.stats, initial.catalog.stats);
    assert.equal(state.mutationError, null);
    assert.equal(state.error, 'Later read refused');
    assert.deepEqual(operations(), [`POST ${template}`, `POST ${template}`, 'GET /elearning/catalog']);
    assert.deepEqual(bffElearning.requests.filter(({ method }) => method === 'POST').map(({ body }) => body),
      [{ rating: 3 }, { rating: 3 }]);
    bffElearning.on('get', '/elearning/catalog', { body: state.catalog });
    await actions.loadCatalog();
    assert.equal(state.error, null);
    assert.deepEqual(operations(), [`POST ${template}`, `POST ${template}`, 'GET /elearning/catalog', 'GET /elearning/catalog']);
  });
}

test('a pending negative confirmation shares one refusal and never replays a write', async () => {
  const { initial, state, actions, course } = stateFor(true);
  bffElearning.on('post', template, { body: { ...f.ratingResponse(1), submitted: false } });
  const originalFetch = global.fetch;
  let release;
  let received;
  const held = new Promise(resolve => { release = resolve; });
  const ready = new Promise(resolve => { received = resolve; });
  global.fetch = async (...args) => {
    const response = await originalFetch(...args);
    if (args[0] === `/elearning/courses/${course.id}/rating` && args[1]?.method === 'POST') {
      received();
      await held;
    }
    return response;
  };
  const pending = [];
  try {
    pending.push(actions.rateCourse(course.id, 3));
    await ready;
    pending.push(actions.rateCourse(course.id, 3));
    assert.equal(pending[0], pending[1]);
    assert.equal(await actions.rateCourse(course.id, 2), false);
    assert.equal(state.catalog, initial);
    release();
    assert.deepEqual(await Promise.all(pending), [false, false]);
    assert.equal(state.catalog, initial);
    assert.equal(state.mutationError, refusal);
    assert.deepEqual(operations(), [`POST ${template}`]);
  } finally {
    release();
    await Promise.allSettled(pending);
    global.fetch = originalFetch;
  }
});

test('unrelated unexpected error messages remain private', () => {
  assert.equal(getErrorMessage(new Error('internal diagnostic must not leak')), 'Une erreur inattendue est survenue.');
});
