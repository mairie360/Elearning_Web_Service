import process from 'node:process';
import console from 'node:console';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const mode = process.argv[2] ?? '--check';
const spec = resolve('contracts/openapi.json');
const types = resolve('src/contracts/bff.d.ts');
// The exported contract belongs to the pinned published SDK, independently of
// the revision checked out in a neighbouring backend repository.
const metadataPath = resolve('contracts/source.json');
const metadata = JSON.parse(readFileSync(metadataPath, 'utf8'));
const manifest = JSON.parse(readFileSync(resolve('package.json'), 'utf8'));
const lock = JSON.parse(readFileSync(resolve('package-lock.json'), 'utf8'));
const installed = JSON.parse(readFileSync(resolve('node_modules', metadata.package, 'package.json'), 'utf8'));
if (manifest.dependencies?.[metadata.package] !== metadata.version ||
    installed.version !== metadata.version ||
    lock.packages?.[`node_modules/${metadata.package}`]?.version !== metadata.version ||
    (metadata.version.includes('-dev.') && metadata.version.split('-dev.')[1] !== metadata.commit)) {
  throw new Error('The exported contract source does not match the pinned and installed published SDK.');
}
if (mode === '--sync') {
  if (!process.env.BFF_CONTRACT_DIR) throw new Error('Set BFF_CONTRACT_DIR explicitly to the contracts directory at the pinned BFF commit.');
  const source = resolve(process.env.BFF_CONTRACT_DIR);
  const commit = execFileSync('git', ['-C', source, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  if (commit !== metadata.commit) throw new Error('The source checkout is not the pinned published BFF commit.');
  const incoming = readFileSync(join(source, 'openapi.json'));
  mkdirSync(resolve('contracts'), { recursive: true });
  writeFileSync(spec, incoming);
  writeFileSync(metadataPath, JSON.stringify({ ...metadata, sha256: createHash('sha256').update(incoming).digest('hex') }, null, 2) + '\n');
} else if (createHash('sha256').update(readFileSync(spec)).digest('hex') !== metadata.sha256) {
  throw new Error('The exported contract differs from its verified published-commit snapshot.');
}
if (!['--check', '--generate', '--sync'].includes(mode)) throw new Error('Unknown contracts mode.');
const temporary = mkdtempSync(join(tmpdir(), 'mairie360-contract-'));
try {
  const output = join(temporary, 'bff.d.ts');
  execFileSync('npm', ['exec', '--yes', '--package=openapi-typescript@7.10.1', '--', 'openapi-typescript', spec, '--output', output], { stdio: 'pipe' });
  const generated = readFileSync(output);
  if (mode === '--generate' || mode === '--sync') {
    mkdirSync(resolve(types, '..'), { recursive: true });
    writeFileSync(types, generated);
  } else if (!generated.equals(readFileSync(types))) {
    throw new Error('The generated TypeScript contract is stale. Regenerate it with npm run contracts:generate.');
  }
  console.log('OpenAPI data and routes match the generated TypeScript contract.');
} finally { rmSync(temporary, { recursive: true, force: true }); }
