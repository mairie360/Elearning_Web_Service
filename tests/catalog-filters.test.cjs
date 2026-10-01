const assert = require('node:assert/strict');
const { test } = require('node:test');
require('./support/load-typescript.cjs');
const { withCategoryReset } = require('../src/features/elearning/catalogFilters.ts');

test('absent categories keep the shared course-derived fallback', () => {
  assert.equal(withCategoryReset(undefined), undefined);
});

test('empty and missing-all lists gain only the neutral reset without mutation', () => {
  const reset = { label: 'Toutes les catégories', value: 'all' };
  assert.deepEqual(withCategoryReset(Object.freeze([])), [reset]);
  const business = Object.freeze([
    Object.freeze({ label: 'Libellé reçu B', value: 'category-b', disabled: true }),
    Object.freeze({ label: 'Libellé reçu A', value: 'category-a' }),
  ]);
  const result = withCategoryReset(business);
  assert.deepEqual(result, [reset, ...business]);
  assert.equal(result[1], business[0]);
  assert.equal(result[2], business[1]);
});

test('an existing reset retains its label and position, without duplicate all choices', () => {
  const supplied = Object.freeze([
    Object.freeze({ label: 'Libellé reçu', value: 'category-a' }),
    Object.freeze({ label: 'Afficher toutes les formations', value: 'all' }),
    Object.freeze({ label: 'Deuxième choix neutre', value: 'all' }),
    Object.freeze({ label: 'Autre libellé reçu', value: 'category-b' }),
  ]);
  assert.deepEqual(withCategoryReset(supplied), [supplied[0], supplied[1], supplied[3]]);
});

test('the neutral reset remains usable without enabling disabled business categories', () => {
  const supplied = Object.freeze([
    Object.freeze({ label: 'Tout', value: 'all', disabled: true }),
    Object.freeze({ label: 'Restreinte', value: 'category-a', disabled: true }),
  ]);
  assert.deepEqual(withCategoryReset(supplied), [
    { label: 'Tout', value: 'all', disabled: false }, supplied[1],
  ]);
  assert.equal(supplied[0].disabled, true);
});
