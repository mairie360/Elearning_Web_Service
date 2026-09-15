const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { describe, test } = require('node:test');
const { root } = require('./support/load-typescript.cjs');
const { loadOrvalContract, resolveOrvalPackage } = require('./support/orval-contract.ts');
const { PUBLISHED_CONTRACT_PACKAGE, contractSnapshot } = require('./support/mocked-front.ts');
const fixtures = require('./support/elearning-fixtures.ts');

// Le front ne consomme qu'un BFF : BFF_Elearning, dans une version publiée X.Y.Z.
// - Le paquet @mairie360/bff-elearning-openapi (version épinglée) pilote le mock des tests ;
// - contracts/openapi.json, allowlist du proxy et source de src/contracts/bff.d.ts, doit déclarer les mêmes opérations.
// Les opérations appelées sont relues dans src/lib/elearning-api.ts pour ne pas diverger de la liste ci-dessous.

const published = loadOrvalContract(PUBLISHED_CONTRACT_PACKAGE);
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

/** Opérations BFF E-learning appelées par le navigateur, toutes via src/lib/elearning-api.ts. */
const ELEARNING_OPERATIONS = [
  'GET /elearning/catalog',
  'GET /elearning/profile',
  'POST /elearning/courses/{courseId}/start',
  'POST /elearning/courses/{courseId}/contents/{contentId}/complete',
  'POST /elearning/courses/{courseId}/rating',
  'POST /elearning/admin/courses',
  'PATCH /elearning/admin/courses/{courseId}',
  'DELETE /elearning/admin/courses/{courseId}',
];

const operations = (contract) => Object.entries(contract.document.paths)
  .flatMap(([template, methods]) => Object.keys(methods).map((method) => `${method.toUpperCase()} ${template}`)).sort();

function successSchema(contract, method, pathname, status) {
  const match = contract.match(method, pathname);
  assert.ok(match, `${method} ${pathname} absent de ${contract.title}`);
  const { documented, schema } = contract.responseSchema(match, status);
  assert.ok(documented && schema, `${status} ${method} ${pathname} non documenté dans ${contract.title}`);
  return schema;
}

/** Valide contre le paquet publié et contre la copie versionnée. */
function valid(method, pathname, status, body) {
  const json = JSON.parse(JSON.stringify(body));
  for (const contract of [published, contractSnapshot]) {
    assert.deepEqual(contract.validate(successSchema(contract, method, pathname, status), json), [], contract === published ? 'paquet publié' : 'contracts/openapi.json');
  }
}

describe('single published BFF contract', () => {
  test('the contract package is a published X.Y.Z release of bff_elearning pinned in package.json', () => {
    const { dependencies = {}, devDependencies = {} } = JSON.parse(read('package.json'));
    const pinned = devDependencies[PUBLISHED_CONTRACT_PACKAGE];
    assert.match(pinned, /^\d+\.\d+\.\d+$/);
    assert.equal(resolveOrvalPackage(PUBLISHED_CONTRACT_PACKAGE).version, pinned);
    assert.equal(published.title, 'bff_elearning');
    assert.equal(dependencies[PUBLISHED_CONTRACT_PACKAGE], undefined);
    assert.deepEqual(Object.keys({ ...dependencies, ...devDependencies }).filter((name) => /^@mairie360\/bff-.*-openapi$/.test(name)), [PUBLISHED_CONTRACT_PACKAGE]);
  });

  test('every docker-compose file runs the BFF image of the same published release', () => {
    const version = resolveOrvalPackage(PUBLISHED_CONTRACT_PACKAGE).version;
    const files = fs.readdirSync(root).filter((file) => /^docker-compose.*\.ya?ml$/.test(file));
    assert.ok(files.length > 0);
    for (const file of files) {
      const tags = [...read(file).matchAll(/ghcr\.io\/mairie360\/bff-elearning:([^\s}"']+)/g)].map(([, tag]) => tag);
      assert.ok(tags.length > 0, `${file} : image bff-elearning absente`);
      assert.deepEqual([...new Set(tags)], [version], file);
      assert.doesNotMatch(read(file), /ghcr\.io\/mairie360\/bff-(?!elearning:)[\w-]+:(?!\d+\.\d+\.\d+)/, `${file} : image BFF non publiée`);
    }
  });

  test('contracts/openapi.json declares exactly the operations of the published package', () => {
    assert.equal(contractSnapshot.title, 'bff_elearning');
    assert.deepEqual(operations(contractSnapshot), operations(published));
  });

  test('src/lib/elearning-api.ts calls exactly the consumed operations, all declared by the contract', () => {
    const calls = [...read('src/lib/elearning-api.ts').matchAll(/callBff\("(\w+)", "([^"]+)"/g)]
      .map(([, method, template]) => `${method.toUpperCase()} ${template}`);
    assert.deepEqual([...new Set(calls)].sort(), [...ELEARNING_OPERATIONS].sort());
    assert.deepEqual(ELEARNING_OPERATIONS.filter((operation) => !operations(published).includes(operation)), []);
  });

  test('the catch-all proxy is the only route handler: no adapter towards another BFF', () => {
    const routes = [];
    const walk = (dir) => fs.readdirSync(path.join(root, dir), { withFileTypes: true }).forEach((entry) => {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(file);
      else if (/^route\.(ts|js)$/.test(entry.name)) routes.push(file.split(path.sep).join('/'));
    });
    walk('src/app');
    assert.deepEqual(routes, ['src/app/[...path]/route.ts']);
  });
});

describe('fixtures conform to the published contract', () => {
  test('BFF E-learning success responses', () => {
    valid('get', '/elearning/catalog', 200, fixtures.catalogResponse());
    valid('get', '/elearning/catalog', 200, fixtures.catalogResponse([], fixtures.currentUser({ isAdmin: true, role: 'Admin' })));
    valid('get', '/elearning/profile', 200, fixtures.profileResponse());
    valid('post', '/elearning/courses/c/start', 200, { course: fixtures.course('c', { statusValue: 'in-progress', progress: 10 }) });
    valid('post', '/elearning/courses/c/contents/x/complete', 200, fixtures.contentCompleteResponse());
    valid('post', '/elearning/courses/c/rating', 200, fixtures.ratingResponse());
    valid('post', '/elearning/admin/courses', 201, { course: fixtures.course('nouveau') });
    valid('patch', '/elearning/admin/courses/c', 200, { course: fixtures.course('c') });
    valid('delete', '/elearning/admin/courses/c', 200, { deleted: true, courseId: 'c' });
  });

  test('errors use the ApiError schema; orval only types success statuses', () => {
    for (const contract of [published, contractSnapshot]) {
      assert.deepEqual(contract.validate(contract.schema('ApiError'), fixtures.apiError('COURSE_NOT_FOUND', 'Formation introuvable.')), []);
    }
    assert.equal(published.responseSchema(published.match('get', '/elearning/catalog'), 401).documented, false);
  });
});

describe('contract validator', () => {
  test('reports wrong types, missing properties and enum violations', () => {
    const invalid = fixtures.catalogResponse([fixtures.course('c', { statusValue: 'paused', progress: 150 })]);
    delete invalid.catalog.emptyLabel;
    const errors = contractSnapshot.validate(successSchema(contractSnapshot, 'get', '/elearning/catalog', 200), invalid);
    assert.ok(errors.some((error) => error.includes('$.catalog.emptyLabel: propriété requise manquante')), errors.join('\n'));
    assert.ok(errors.some((error) => error.includes('statusValue: valeur "paused" hors enum')), errors.join('\n'));
    assert.ok(errors.some((error) => error.includes('progress: 150 > maximum 100')), errors.join('\n'));
  });

  test('rejects operations absent from the contract', () => {
    assert.match(published.validateRequest('PUT', new URL('http://bff/elearning/catalog')).errors[0], /n'existe pas dans le contrat bff_elearning/);
    assert.equal(published.match('get', '/elearning/admin/courses'), undefined);
    assert.equal(published.match('post', '/auth/logout'), undefined);
  });
});
