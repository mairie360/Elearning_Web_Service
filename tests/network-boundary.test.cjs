const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const ts = require('typescript');

// Garde-fou statique : tout appel réseau du front doit passer par les chemins couverts par les contrats.
// - navigateur : src/lib/elearning-api.ts (opérations de contracts/openapi.json) -> requestBff -> fetch same-origin,
//   ou src/lib/auth-session.ts -> adaptateurs /api/* (opérations du contrat bff_user) ;
// - serveur : src/lib/bff-proxy.ts (allowlist contracts/openapi.json) et src/lib/user-bff-proxy.ts qui le réutilise.
// Les tests *.bff-mocks.test.cjs vérifient ensuite ces chemins à l'exécution contre des BFF simulés.

const root = path.join(__dirname, '..');
const FETCH_ALLOWED = {
  'src/lib/bff-client.ts': 'fetch same-origin des opérations de elearning-api.ts',
  'src/lib/bff-proxy.ts': 'proxy serveur vers les BFFs',
  'src/lib/auth-session.ts': 'adaptateurs de session /api/*',
};
const SESSION_ADAPTERS = ['/api/user/me', '/api/auth/logout'];
const FORBIDDEN_GLOBALS = new Set(['XMLHttpRequest', 'WebSocket', 'EventSource', 'sendBeacon', 'axios']);
const FORBIDDEN_MODULES = /^(node:)?(http|https|net|tls|dgram)$|^(axios|ky|got|node-fetch|undici|swr)$/;

function sourceFiles(dir = path.join(root, 'src')) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(file);
    return /\.(ts|tsx|js|jsx|mjs|cjs)$/.test(entry.name) && !entry.name.endsWith('.d.ts') ? [file] : [];
  });
}

function scan() {
  const findings = { fetch: [], requestBff: [], forbidden: [] };
  for (const file of sourceFiles()) {
    const relative = path.relative(root, file).split(path.sep).join('/');
    const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    const visit = (node) => {
      const at = `${relative}:${source.getLineAndCharacterOfPosition(node.getStart()).line + 1}`;
      if (ts.isCallExpression(node)) {
        const callee = node.expression;
        const name = ts.isIdentifier(callee) ? callee.text : ts.isPropertyAccessExpression(callee) ? callee.name.text : undefined;
        if (name === 'fetch') findings.fetch.push({ file: relative, at, argument: node.arguments[0] });
        if (name === 'requestBff') findings.requestBff.push({ file: relative, at, argument: node.arguments[0] });
      }
      if (ts.isIdentifier(node) && FORBIDDEN_GLOBALS.has(node.text)) findings.forbidden.push(`${at} ${node.text}`);
      if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier) && FORBIDDEN_MODULES.test(node.moduleSpecifier.text)) {
        findings.forbidden.push(`${at} import ${node.moduleSpecifier.text}`);
      }
      if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) findings.forbidden.push(`${at} import() dynamique`);
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
  return findings;
}

const findings = scan();

test('no other network API or HTTP client is used in src', () => {
  assert.deepEqual(findings.forbidden, []);
});

test('fetch is only called by the contract-bound modules', () => {
  assert.deepEqual(findings.fetch.filter(({ file }) => !FETCH_ALLOWED[file]).map(({ at }) => at), []);
  assert.deepEqual([...new Set(findings.fetch.map(({ file }) => file))].sort(), Object.keys(FETCH_ALLOWED).sort());
});

test('the browser-side fetch in bff-client.ts only receives the path built by elearning-api.ts', () => {
  const [call, ...others] = findings.fetch.filter(({ file }) => file === 'src/lib/bff-client.ts');
  assert.equal(others.length, 0);
  assert.equal(call.argument.getText(), 'path');
  assert.deepEqual(findings.requestBff.map(({ file }) => file), ['src/lib/elearning-api.ts']);
  const [request] = findings.requestBff;
  assert.match(request.argument.getText(), /^contractUrl\(template,/);
});

test('auth-session.ts only fetches the same-origin session adapters', () => {
  const targets = findings.fetch.filter(({ file }) => file === 'src/lib/auth-session.ts')
    .map(({ at, argument }) => (argument && ts.isStringLiteral(argument) ? argument.text : `${at} cible non littérale`));
  assert.deepEqual(targets.sort(), [...SESSION_ADAPTERS].sort());
});

test('server-side forwarding only happens in bff-proxy.ts, gated by the contract for the catch-all route', () => {
  const proxy = fs.readFileSync(path.join(root, 'src/lib/bff-proxy.ts'), 'utf8');
  assert.match(proxy, /import contract from '\.\.\/\.\.\/contracts\/openapi\.json'/);
  const [call, ...others] = findings.fetch.filter(({ file }) => file === 'src/lib/bff-proxy.ts');
  assert.equal(others.length, 0);
  assert.equal(call.argument.getText(), 'target');
  const catchAll = fs.readFileSync(path.join(root, 'src/app/[...path]/route.ts'), 'utf8');
  assert.match(catchAll, /from '@\/lib\/bff-proxy'/);
  assert.doesNotMatch(catchAll, /forwardToBff/);
});
