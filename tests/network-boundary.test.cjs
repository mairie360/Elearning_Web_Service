const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const ts = require('typescript');
const policy = require('./support/source-policy.cjs');

// Business requests use the published Elearning contract; auth operations delegate to the existing Login owner.
// - navigateur : src/lib/elearning-api.ts (opérations du contrat) -> requestBff -> fetch same-origin ;
// - serveur : src/lib/bff-proxy.ts (allowlist contracts/openapi.json) vers la seule URL configuredBffUrl().
// tests/elearning.bff-mocks.test.cjs vérifie ensuite ces chemins à l'exécution contre le BFF simulé.

const root = path.join(__dirname, '..');
const FETCH_ALLOWED = {
  'src/lib/bff-client.ts': 'fetch same-origin des opérations de elearning-api.ts',
  'src/lib/auth-session.ts': 'POST same-origin delegated to Login owner',
};
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
  const findings = { fetch: [], requestBff: [], forwardToBff: [], forbidden: [] };
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
        if (name === 'forwardToBff') findings.forwardToBff.push({ file: relative, at, baseUrl: node.arguments[1] });
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
  assert.ok(ts.isBinaryExpression(call.argument));
  assert.equal(call.argument.left.text, '/api/bff');
  assert.ok(policy.parameterReference(call.argument.right));
  assert.deepEqual(findings.requestBff.map(({ file }) => file), ['src/lib/elearning-api.ts']);
  const [request] = findings.requestBff;
  assert.ok(ts.isCallExpression(request.argument) && policy.callName(request.argument.expression) === 'contractUrl');
  assert.ok(policy.parameterReference(request.argument.arguments[0], 1));
});

test('server-side forwarding only targets the configured BFF_Elearning URL, gated by the contract', () => {
  const proxyAst = policy.parse('src/lib/bff-proxy.ts');
  assert.ok(policy.imports(proxyAst).includes('../../contracts/openapi.json'));
  assert.deepEqual(findings.fetch.filter(({ file }) => file === 'src/lib/bff-proxy.ts'), []);
  assert.ok(policy.imports(proxyAst).includes('@mairie360/lib-components/next'));
  assert.equal(policy.calls(proxyAst, 'proxyPublishedBffRequest').length, 1);
  assert.deepEqual(findings.forwardToBff.map(({ file }) => file), ['src/lib/bff-proxy.ts']);
  assert.ok(findings.forwardToBff.every(({ baseUrl }) => policy.configuredUrl(baseUrl)));
  assert.deepEqual([...new Set(policy.envNames(proxyAst))].sort(), ['LOGIN_FRONT_URL', 'ELEARNING_FRONT_URL', 'BFF_ELEARNING_BASE_URL', 'ELEARNING_BFF_URL', 'NEXT_PUBLIC_BFF_ELEARNING_BASE_URL'].sort());
  const catchAll = policy.parse('src/app/[...path]/route.ts');
  assert.ok(policy.imports(catchAll).includes('@/lib/bff-proxy'));
  assert.equal(policy.calls(catchAll, 'forwardToBff').length, 0);
});

test('explicit logout has a single same-origin POST and no browser bearer', () => {
 const calls=findings.fetch.filter(({file})=>file==='src/lib/auth-session.ts');
 assert.equal(calls.length,1);assert.equal(calls[0].argument.text,'/api/auth/logout');
});
