const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { createRequire } = require('node:module');
const { test } = require('node:test');
const postcss = createRequire(require.resolve('next/package.json'))('postcss');

// MAIR-877 / MAIR-890: the shell, the surfaces and the components come from lib-components. The front keeps
// no stylesheet rule of its own (no background, width, sidebar or catalogue override), only the theme tokens.
test('MAIR-877 globals.css holds no front-specific rule on the shell or the catalogue', () => {
  const parsed = postcss.parse(readFileSync(join(__dirname, '../src/app/globals.css'), 'utf8'));
  const rules = [];
  parsed.walkRules(rule => rules.push(rule.selector));
  assert.deepEqual(rules, []);
  let font;
  parsed.walkDecls('--font-sans', declaration => { font = declaration.value.split(',').map(name => name.trim()); });
  assert.deepEqual(font, ['system-ui', 'sans-serif']);
});

test('MAIR-877 the module draws no background, width or margin of its own around the catalogue', () => {
  for (const file of ['src/components/ElearningModule/ElearningModule.tsx', 'src/components/ElearningModule/components/ElearningCatalog/ElearningCatalog.tsx']) {
    const text = readFileSync(join(__dirname, '..', file), 'utf8');
    assert.doesNotMatch(text, /max-w-\[1130px\]|surface-raised|!px-6|!py-8|px-6 py-14/, file);
  }
});
