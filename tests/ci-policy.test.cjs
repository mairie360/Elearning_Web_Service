const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');

const root = join(__dirname, '..');
const read = (path) => readFileSync(join(root, path), 'utf8');

test('third-party workflow actions use immutable commits', () => {
  const workflows = ['contracts.yml', 'auto-approve.yml'];
  const actions = workflows.flatMap((file) => [...read(`.github/workflows/${file}`)
    .matchAll(/uses:\s*([^\s@]+)@([^\s#]+)/g)]);
  assert.deepEqual(actions.map((match) => match[1]).sort(), [
    'actions/checkout', 'actions/setup-node', 'hmarr/auto-approve-action',
  ]);
  for (const [, name, ref] of actions) {
    assert.match(ref, /^[a-f0-9]{40}$/, `${name} must use a full commit SHA`);
  }
});

test('the reusable frontend workflow receives only its declared named secrets', () => {
  const workflow = read('.github/workflows/cicd.yml');
  assert.doesNotMatch(workflow, /secrets:\s*inherit/);
  const mappings = [...workflow.matchAll(/^ {6}([A-Z0-9_]+):[ \t]*\$\{\{[ \t]*secrets\.([A-Z0-9_]+)[ \t]*\}\}[ \t]*$/gm)];
  assert.deepEqual(mappings.map(([, name, source]) => [name, source]), [
    ['CODECOV_TOKEN', 'CODECOV_TOKEN'],
    ['N8N_WEBHOOK_SECRET', 'N8N_WEBHOOK_SECRET'],
    // AI pre-audit of the RGAA check (release-prod), MAIR-320.
    ['ANTHROPIC_API_KEY', 'ANTHROPIC_API_KEY'],
  ]);
  assert.doesNotMatch(workflow, /semgrep_fail_on_findings:\s*false|semgrep_config:|continue-on-error:/);
});

test('npm resolution keeps the seven-day window except for the internal UI package', () => {
  const config = read('.npmrc');
  assert.match(config, /^min-release-age\s*=\s*7\s*$/m);
  const exclusions = [...config.matchAll(/^\s*min-release-age-exclude(\[\])?\s*=\s*(.+?)\s*$/gm)];
  assert.deepEqual(exclusions.map(([, list, name]) => [list, name]), [
    ['[]', '@mairie360/lib-components'],
  ]);
  assert.doesNotMatch(config, /^\s*before\b/m);
  assert.match(config, /^@mairie360:registry=https:\/\/npm\.pkg\.github\.com\s*$/m);
});

test('CI uses Node 24 and the test toolchain supports npm release-age policy', () => {
  assert.match(read('.github/workflows/cicd.yml'), /node_version:\s*"24"/);
  assert.match(read('.github/workflows/contracts.yml'), /node-version:\s*'24'/);
  const version = execFileSync('npm', ['--version'], { cwd: root, encoding: 'utf8' }).trim();
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  assert.ok(match, 'npm must report a stable version');
  assert.ok(Number(match[1]) > 11 || (Number(match[1]) === 11 && Number(match[2]) >= 10),
    'npm >=11.10 is required for min-release-age; use the documented Node 24 toolchain');
});

test('isolated test stacks run the published image, the scripts build it with a secret only', () => {
  const stacks = {
    'docker-compose-security.yml': 'security_test.sh',
    'docker-compose-performance.yml': 'performance_test.sh',
    'docker-compose-accessibility.yml': 'accessibility_test.sh',
  };
  for (const [file, script] of Object.entries(stacks)) {
    const compose = read(file);
    const frontend = compose.split('  elearning-front:\n')[1]?.split('\n  security-scan:')[0]?.split('\n  k6-perf-test:')[0]?.split('\n  a11y:')[0];
    assert.ok(frontend, `${file} must keep the isolated frontend service`);
    // The CI exports IMAGE_REF (dev-<sha> for ZAP / k6, staging-<sha> for RGAA): never rebuilt.
    assert.match(frontend, /image: \$\{IMAGE_REF:\?/);
    assert.doesNotMatch(frontend, /build:|args:|NODE_AUTH_TOKEN|\/run\/secrets/);
    const code = compose.split('\n').filter((line) => !line.trimStart().startsWith('#')).join('\n');
    assert.doesNotMatch(code, /NODE_AUTH_TOKEN|\bbuild-arg\b/);
    const shell = read(script);
    assert.match(shell, /docker build -t elearning-front:local --secret id=node_auth_token,env=NODE_AUTH_TOKEN \./);
    assert.doesNotMatch(shell, /--build-arg|up -d --build/);
  }
});

test('the accessibility stack seeds its own users after the shared seed, and ignores its files in the image', () => {
  const compose = read('docker-compose-accessibility.yml');
  assert.match(compose, /\n  seeder-a11y:\n[\s\S]*?\.\/init-accessibility\.sql:\/init-accessibility\.sql:ro/);
  assert.match(compose.split('\n  seeder-a11y:\n')[1].split('\n  redis:\n')[0], /seeder:\n        condition: service_completed_successfully/);
  for (const ignored of ['accessibility_test.sh', 'init-accessibility.sql', 'rgaa.yaml', 'rgaa-report', '.rgaa-ai-cache', 'cicd-repo']) {
    assert.ok(read('.dockerignore').split(/\r?\n/).includes(ignored), `${ignored} must stay out of the image`);
  }
});
