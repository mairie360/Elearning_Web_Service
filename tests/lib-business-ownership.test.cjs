const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)]);

// MAIR-607: the library keeps only components shared by several fronts. The
// e-learning catalog and its sub-components are Elearning's own code now.
test('MAIR-607 the e-learning front owns its components instead of importing a library entry', () => {
  for (const file of walk(path.join(root, 'src'))) {
    if (!/\.(tsx?|mjs|cjs|js)$/.test(file)) continue;
    assert.doesNotMatch(fs.readFileSync(file, 'utf8'), /@mairie360\/lib-components\/(dashboard|settings|projects|messages|calendar|admin|elearning)/, `${path.relative(root, file)} must not import a removed library entry`);
  }
  for (const component of ['ElearningCatalog', 'ElearningCourseCard', 'ElearningCourseDetailsModal', 'ElearningCourseFormModal', 'ElearningAdminStats', 'ElearningFilterSelect', 'ElearningSearchInput']) {
    assert.ok(fs.existsSync(path.join(root, 'src/components/elearning', `${component}.tsx`)), `${component} lives in src/components/elearning`);
    assert.match(read('src/components/elearning/index.ts'), new RegExp(`export \\{ ${component} \\}`));
  }
  assert.match(read('src/features/elearning/ElearningModule.tsx'), /from "@\/components\/elearning"/);
});

test('MAIR-607 the installed library no longer publishes an elearning entry', () => {
  const pkg = JSON.parse(read('node_modules/@mairie360/lib-components/package.json'));
  assert.equal(pkg.exports['./elearning'], undefined, 'the installed lib-components must not expose ./elearning (bump the pin to the MAIR-607 major)');
  assert.ok(pkg.exports['./primitives'] && pkg.exports['./shell'], 'primitives and shell entries remain');
});
