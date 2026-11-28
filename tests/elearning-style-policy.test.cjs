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

test('MAIR-934 no colour of its own in the e-learning components: every colour is a lib token', () => {
  const { readdirSync, statSync } = require('node:fs');
  const walk = dir => readdirSync(dir).flatMap(name => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
  for (const file of walk(join(__dirname, '../src/components')).filter(path => /\.tsx?$/.test(path) && !/\.test\.tsx?$/.test(path))) {
    const text = readFileSync(file, 'utf8');
    assert.doesNotMatch(text, /#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/, `${file} holds a hard-coded colour`);
    assert.doesNotMatch(text, /\b(?:text|bg|border)-(?:red|green|blue|gray|white|black)(?:-\d+)?\b/, `${file} holds a Tailwind palette colour`);
  }
});

// MAIR-1257 (design-match): the lib Card draws no inner padding (only its title has one), so every Card of the
// module must pad its content, or the text touches the border as in the first build of the redesigned catalogue.
test('MAIR-1257 every lib Card of the module pads its content', () => {
  const { readdirSync, statSync } = require('node:fs');
  const walk = dir => readdirSync(dir).flatMap(name => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
  const files = walk(join(__dirname, '../src/components')).filter(path => /\.tsx$/.test(path) && !/\.test\.tsx$/.test(path));
  let cards = 0;
  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    for (const match of text.matchAll(/<Card\b[^>]*>([\s\S]{0,200})/g)) {
      cards += 1;
      const padded = /className="[^"]*\bp-\d/.test(match[0].split('>')[0]) || /^\s*<div className="[^"]*\bpx-\d[^"]*\bpb-\d/.test(match[1]);
      assert.ok(padded, `${file}: a Card without inner padding`);
    }
  }
  assert.ok(cards >= 5, 'the module renders its cards with the lib Card');
});
