const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const ts = require('typescript');

// Charge src/**/*.ts et tests/support/*.ts sans build : transpilation CommonJS à la volée et résolution
// de l'alias `@/*` de tsconfig.json, pour exécuter les vrais route handlers Next.js dans node:test.
// Les source maps inline (lues grâce à --enable-source-maps, cf. script npm test) gardent la couverture
// alignée sur les lignes du fichier TypeScript.

const root = path.join(__dirname, '..', '..');
const resolveFilename = Module._resolveFilename;

Module._resolveFilename = function resolveWithAlias(request, ...rest) {
  const aliased = request.startsWith('@/') ? path.join(root, 'src', request.slice(2)) : request;
  return resolveFilename.call(this, aliased, ...rest);
};

require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  fileName: filename,
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true, resolveJsonModule: true, inlineSourceMap: true, inlineSources: true },
}).outputText, filename);

module.exports = { root };
