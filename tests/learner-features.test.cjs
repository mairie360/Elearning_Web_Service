const assert = require('node:assert/strict');
const { test } = require('node:test');
require('./support/load-typescript.cjs');
const { validateReview, prepareResourceDownload } = require('../src/features/elearning/learnerFeatures.ts');

test('written reviews validate rating and a nonempty bounded comment independently of numeric rating', () => {
  for (const rating of [0,6,1.5,NaN]) assert.match(validateReview({ rating,comment:'Avis' }), /1 à 5/);
  for (const comment of ['', '   ', 'x'.repeat(5001)]) assert.match(validateReview({ rating:4,comment }), /1 à 5 000/);
  assert.equal(validateReview({ rating:4,comment:'Contenu utile\nDeuxième ligne' }), '');
});
test('resource download needs a real bridge and leaves progress alone on empty, refused or late responses', async () => {
  const signal = new AbortController().signal;
  await assert.rejects(prepareResourceDownload({},'c1','r1',signal), /pas encore disponible/);
  await assert.rejects(prepareResourceDownload({ downloadResource:async () => ({ blob:new Blob([]),fileName:'cours.pdf' }) },'c1','r1',signal), /vide/);
  await assert.rejects(prepareResourceDownload({ downloadResource:async () => { throw new Error('Accès refusé'); } },'c1','r1',signal), /Accès refusé/);
  const controller = new AbortController(); controller.abort();
  await assert.rejects(prepareResourceDownload({ downloadResource:async () => ({ blob:new Blob(['PDF']),fileName:'cours.pdf' }) },'c1','r1',controller.signal), /annulé/);
  assert.equal((await prepareResourceDownload({ downloadResource:async (course,content,receivedSignal) => {
    assert.equal(course,'c/1'); assert.equal(content,'r/1'); assert.equal(receivedSignal,signal); return { blob:new Blob(['PDF']),fileName:'cours.pdf' };
  } },'c/1','r/1',signal)).fileName,'cours.pdf');
});
