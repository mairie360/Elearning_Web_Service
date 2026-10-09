const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { createRequire } = require('node:module');
const { test } = require('node:test');
const postcss = createRequire(require.resolve('next/package.json'))('postcss');
const compact = text => text.replace(/\s+/g, '');
function policy() {
  const parsed = postcss.parse(readFileSync(join(__dirname, '../src/app/globals.css'), 'utf8'));
  const value = (selector, property, media = null) => {
    let result;
    parsed.walkRules(rule => {
      const conditions = [];
      for (let parent = rule.parent; parent; parent = parent.parent) if (parent.type === 'atrule' && parent.name === 'media') conditions.unshift(compact(parent.params));
      if (compact(rule.selector) === compact(selector) && (conditions.join(' and ') || null) === (media ? compact(media) : null)) rule.walkDecls(property, declaration => { result = declaration.value; });
    });
    assert.ok(result, `Keep ${selector} / ${property} / ${media || 'base'}`); return result;
  };
  return { parsed, value };
}
test('parsed reader policies preserve mobile inset and sticky header scoped to its chapter aside', () => {
  const { value } = policy(), reader = '.elearning-catalog-shell [role="dialog"]:has(> div > aside)', media = '(max-width: 767px)';
  assert.equal(value(reader, 'padding', media), '16px');
  assert.equal(value(reader + ' > header', 'top', media), '-16px');
  assert.equal(value(reader + ' > header', 'margin', media).replace(/\s+/g, ' '), '-16px -16px 0');
  assert.equal(value(reader + ' > header', 'padding', media), '16px');
  // Configuration does not establish native author/reader geometry.
});
test('parsed catalog policies preserve tablet controls, desktop tracks and the system token', () => {
  const { parsed, value } = policy(), controls = '.elearning-catalog-shell > div > .mt-7.grid.gap-4';
  assert.equal(compact(value(controls, 'grid-template-columns', '(min-width: 768px) and (max-width: 1023px)')), 'minmax(0,1fr)');
  assert.equal(compact(value(controls, 'grid-template-columns', '(min-width: 1024px)')), 'repeat(3,minmax(0,1fr))');
  assert.equal(compact(value('.elearning-catalog-shell[data-stat-count="3"] > div > .mt-6.grid.gap-4', 'grid-template-columns', '(min-width: 768px)')), 'repeat(3,minmax(0,1fr))');
  let font;
  parsed.walkDecls('--font-sans', declaration => { if (declaration.parent.type === 'atrule' && declaration.parent.name === 'theme') font = declaration.value.split(',').map(name => name.trim()); });
  assert.deepEqual(font, ['system-ui', 'sans-serif']);
});
