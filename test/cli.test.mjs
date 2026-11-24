import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const cli = fileURLToPath(new URL('../dist/repopulse.mjs', import.meta.url));
function checkout(t) {
  const root = mkdtempSync(join(tmpdir(), 'pulse-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  execFileSync('git', ['init', '-q', root]);
  return root;
}
function report(path) {
  return JSON.parse(execFileSync(process.execPath, [cli, '--json', '--', path]));
}
test('empty index produces four empty checks', t => {
  const data = report(checkout(t));
  assert.equal(data.indexedRegularFiles, 0);
  assert.deepEqual(data.checks.map(c => c.count), [0, 0, 0, 0]);
});
test('reports staged paths across the checkout and ignores untracked decoys', t => {
  const root = checkout(t);
  for (const name of ['README.md', '.github/workflows/test.yml', 'src/a.test.ts', 'docs/LICENSE']) {
    const path = join(root, name);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, '');
  }
  execFileSync('git', ['-C', root, 'add', '.']);
  writeFileSync(join(root, 'LICENSE'), '');
  const data = report(join(root, 'src'));
  assert.equal(data.indexedRegularFiles, 4);
  assert.deepEqual(data.checks.map(c => c.count), [1, 0, 1, 1]);
  assert.deepEqual(data.checks[3].examples, ['src/a.test.ts']);
});
test('preserves filenames, caps examples and counts every match', t => {
  const root = checkout(t);
  for (const name of ['0 space', '1', '2', '3', '4', '5']) writeFileSync(join(root, name + '.spec.js'), '');
  execFileSync('git', ['-C', root, 'add', '.']);
  const tests = report(root).checks[3];
  assert.equal(tests.count, 6);
  assert.equal(tests.examples.length, 5);
  assert.equal(tests.examples[0], '0 space.spec.js');
});
test('fails cleanly for invalid arguments and missing checkout', t => {
  const root = checkout(t);
  for (const args of [['--invalid'], ['a', 'b'], [join(root, 'missing')]]) {
    const result = spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8' });
    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
    assert.ok(result.stderr.trim());
  }
});
