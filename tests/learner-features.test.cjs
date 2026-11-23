const assert = require('node:assert/strict');
const { test } = require('node:test');
require('./support/load-typescript.cjs');
const { validateReview, prepareResourceDownload } = require('../src/features/elearning/learnerFeatures.ts');

test('written reviews validate rating and a nonempty bounded comment independently of numeric rating', () => {
  for (const rating of [0,6,1.5,NaN]) assert.match(validateReview({ rating,comment:'Avis' }), /1 à 5/);
  for (const comment of ['', '   ', 'x'.repeat(5001)]) assert.match(validateReview({ rating:4,comment }), /1 à 5 000/);
  assert.equal(validateReview({ rating:4,comment:'Contenu utile\nDeuxième ligne' }), '');
});
test('MAIR-817 a stored file opens only through a real bridge and a secure signed URL', async () => {
  const signal = new AbortController().signal;
  const target = { courseId: 'c1', chapterId: 'h1', contentId: 'r1' };
  await assert.rejects(prepareResourceDownload({}, target, signal), /pas disponible/);
  await assert.rejects(prepareResourceDownload({ downloadResource: async () => ({ url: 'http://storage.test/a.pdf' }) }, target, signal), /pas sûre/);
  await assert.rejects(prepareResourceDownload({ downloadResource: async () => ({}) }, target, signal), /pas sûre/);
  await assert.rejects(prepareResourceDownload({ downloadResource: async () => { throw new Error('Accès refusé'); } }, target, signal), /Accès refusé/);
  const controller = new AbortController(); controller.abort();
  await assert.rejects(prepareResourceDownload({ downloadResource: async () => ({ url: 'https://storage.test/a.pdf' }) }, target, controller.signal), /annulée/);
  assert.deepEqual(await prepareResourceDownload({ downloadResource: async (received, receivedSignal) => {
    assert.deepEqual(received, target); assert.equal(receivedSignal, signal); return { url: 'https://storage.test/a.pdf?sig=1' };
  } }, target, signal), { url: 'https://storage.test/a.pdf?sig=1' });
});
