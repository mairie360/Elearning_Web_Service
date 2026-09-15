const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { describe, test } = require('node:test');
const { root } = require('./support/load-typescript.cjs');
const { OpenApiContract } = require('./support/openapi-contract.ts');
const { loadOrvalContract, resolveOrvalPackage } = require('./support/orval-contract.ts');
const fixtures = require('./support/elearning-fixtures.ts');

// Contrats consommés par le front : contracts/openapi.json (copie de BFF_Elearning, seule allowlist du proxy)
// et le paquet @mairie360/bff-user-openapi installé pour les adaptateurs de session src/app/api/**.
// Les opérations réellement appelées sont relues dans le code source pour ne pas diverger de ces listes.

const elearning = OpenApiContract.load(path.join(root, 'contracts', 'openapi.json'));
const userBff = loadOrvalContract('@mairie360/bff-user-openapi');
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

/** Adaptateurs same-origin vers BFF User : route du front -> opération du contrat bff_user. */
const USER_BFF_ADAPTERS = {
  'GET /api/user/me': 'GET /me',
  'GET /api/auth/me': 'GET /me',
  'GET /api/auth/session': 'GET /session/me',
  'POST /api/auth/logout': 'POST /auth/logout',
};

function declared(contract, operation) {
  const [method, template] = operation.split(' ');
  return Boolean(contract.document.paths[template]?.[method.toLowerCase()]);
}

function schemaFor(contract, method, pathname, status) {
  const match = contract.match(method, pathname);
  assert.ok(match, `${method} ${pathname} absent de ${contract.title}`);
  const { documented, schema } = contract.responseSchema(match, status);
  assert.ok(documented && schema, `${status} ${method} ${pathname} non documenté dans ${contract.title}`);
  return schema;
}

const valid = (contract, method, pathname, status, body) => assert.deepEqual(contract.validate(schemaFor(contract, method, pathname, status), JSON.parse(JSON.stringify(body))), []);

describe('contracts consumed by the front', () => {
  test('contracts/openapi.json is the BFF_Elearning contract and declares every operation the front calls', () => {
    assert.equal(elearning.title, 'bff_elearning');
    assert.deepEqual(ELEARNING_OPERATIONS.filter((operation) => !declared(elearning, operation)), []);
  });

  test('src/lib/elearning-api.ts calls exactly the declared BFF E-learning operations', () => {
    const calls = [...read('src/lib/elearning-api.ts').matchAll(/callBff\("(\w+)", "([^"]+)"/g)]
      .map(([, method, template]) => `${method.toUpperCase()} ${template}`);
    assert.deepEqual([...new Set(calls)].sort(), [...ELEARNING_OPERATIONS].sort());
  });

  test('@mairie360/bff-user-openapi is bff_user at the version pinned in package.json', () => {
    const { devDependencies } = JSON.parse(read('package.json'));
    assert.equal(userBff.title, 'bff_user');
    assert.equal(resolveOrvalPackage('@mairie360/bff-user-openapi').version, devDependencies['@mairie360/bff-user-openapi']);
  });

  test('every src/app/api route handler forwards to a BFF User operation of the contract', () => {
    const found = {};
    const walk = (dir) => fs.readdirSync(path.join(root, dir), { withFileTypes: true }).forEach((entry) => {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) return walk(file);
      const source = read(file);
      const route = `/${path.dirname(file).split(path.sep).slice(2).join('/')}`;
      for (const [, method, target] of source.matchAll(/export function (\w+)\(request: NextRequest\) \{\s*return userBffRequest\(request, '([^']+)'\);/g)) {
        found[`${method} ${route}`] = `${method} ${target}`;
      }
      assert.equal((source.match(/export function/g) ?? []).length, Object.keys(found).filter((key) => key.endsWith(` ${route}`)).length, `${file} : handler non reconnu`);
    });
    walk('src/app/api');
    assert.deepEqual(found, USER_BFF_ADAPTERS);
    assert.deepEqual(Object.values(found).filter((operation) => !declared(userBff, operation)), []);
  });
});

describe('fixtures conform to the contracts', () => {
  test('BFF E-learning success responses', () => {
    valid(elearning, 'get', '/elearning/catalog', 200, fixtures.catalogResponse());
    valid(elearning, 'get', '/elearning/catalog', 200, fixtures.catalogResponse([], fixtures.currentUser({ isAdmin: true, role: 'Admin' })));
    valid(elearning, 'get', '/elearning/profile', 200, fixtures.profileResponse());
    valid(elearning, 'post', '/elearning/courses/c/start', 200, { course: fixtures.course('c', { statusValue: 'in-progress', progress: 10 }) });
    valid(elearning, 'post', '/elearning/courses/c/contents/x/complete', 200, fixtures.contentCompleteResponse());
    valid(elearning, 'post', '/elearning/courses/c/rating', 200, fixtures.ratingResponse());
    valid(elearning, 'post', '/elearning/admin/courses', 201, { course: fixtures.course('nouveau') });
    valid(elearning, 'patch', '/elearning/admin/courses/c', 200, { course: fixtures.course('c') });
    valid(elearning, 'delete', '/elearning/admin/courses/c', 200, { deleted: true, courseId: 'c' });
  });

  test('BFF E-learning errors use the common ApiError format', () => {
    for (const status of [400, 401, 500, 502]) valid(elearning, 'get', '/elearning/catalog', status, fixtures.apiError('ERROR', 'Erreur'));
    valid(elearning, 'post', '/elearning/admin/courses', 409, fixtures.apiError('COURSE_ALREADY_EXISTS', 'Formation existante'));
  });

  test('BFF User session and logout responses', () => {
    valid(userBff, 'get', '/me', 200, fixtures.sessionResponse());
    valid(userBff, 'get', '/session/me', 200, fixtures.sessionResponse({ role: 'Admin', phone: null }, []));
    valid(userBff, 'post', '/auth/logout', 200, { message: 'Déconnecté' });
  });
});

describe('contract validator', () => {
  test('reports wrong types, missing properties and enum violations', () => {
    const invalid = fixtures.catalogResponse([fixtures.course('c', { statusValue: 'paused', progress: 150 })]);
    delete invalid.catalog.emptyLabel;
    const errors = elearning.validate(schemaFor(elearning, 'get', '/elearning/catalog', 200), invalid);
    assert.ok(errors.some((error) => error.includes('$.catalog.emptyLabel: propriété requise manquante')), errors.join('\n'));
    assert.ok(errors.some((error) => error.includes('statusValue: valeur "paused" hors enum')), errors.join('\n'));
    assert.ok(errors.some((error) => error.includes('progress: 150 > maximum 100')), errors.join('\n'));
  });

  test('rejects operations absent from the contracts', () => {
    assert.match(elearning.validateRequest('PUT', new URL('http://bff/elearning/catalog')).errors[0], /n'existe pas dans le contrat bff_elearning/);
    assert.equal(elearning.match('get', '/elearning/admin/courses'), undefined);
    assert.equal(userBff.match('get', '/elearning/catalog'), undefined);
  });
});
