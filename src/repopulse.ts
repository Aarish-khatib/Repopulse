import { execFileSync } from 'node:child_process';
import { parseArgs } from 'node:util';

const usage = 'Usage: node dist/repopulse.mjs [--json] [--] [checkout]';
const checks = [
  ['readme', /^(?:\.github\/|docs\/)?readme(?:\.[^/]+)?$/i],
  ['license', /^(?:licen[cs]e|copying)(?:\.[^/]+)?$/i],
  ['githubActions', /^\.github\/workflows\/[^/]+\.ya?ml$/],
  ['testFiles', /(?:^|\/)(?:test_[^/]+\.py|[^/]+_test\.(?:py|go)|[^/]+\.(?:test|spec)\.[cm]?[jt]sx?)$/],
] as const;

function inspect(checkout: string) {
  // Index stage information lets us exclude symlinks and submodules without reading files.
  const raw = execFileSync('git', ['-c', 'core.fsmonitor=false', '-C', checkout,
    'ls-files', '--cached', '--stage', '--full-name', '-z', '--', ':/'], {
    encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'],
  });
  const paths = raw.split('\0').filter(entry => /^100(?:644|755) [0-9a-f]+ 0\t/.test(entry))
    .map(entry => entry.slice(entry.indexOf('\t') + 1)).sort();
  return {
    schemaVersion: 1,
    indexedRegularFiles: paths.length,
    checks: checks.map(([id, pattern]) => {
      const matches = paths.filter(path => pattern.test(path));
      return { id, count: matches.length, examples: matches.slice(0, 5) };
    }),
  };
}

try {
  const { values, positionals } = parseArgs({
    options: { json: { type: 'boolean' }, help: { type: 'boolean', short: 'h' } },
    allowPositionals: true,
  });
  if (values.help) console.log(usage);
  else {
    if (positionals.length > 1) throw new Error(usage);
    const report = inspect(positionals[0] ?? '.');
    if (values.json) console.log(JSON.stringify(report, null, 2));
    else {
      console.log('Indexed regular files:', report.indexedRegularFiles);
      for (const check of report.checks) {
        console.log(check.id, check.count, ...check.examples.map(path => JSON.stringify(path)));
      }
    }
  }
} catch (error) {
  // Git errors can embed raw paths in the command or stderr.
  const argumentError = error instanceof Error && ('code' in error && String(error.code).startsWith('ERR_PARSE_ARGS') || error.message === usage);
  console.error(argumentError ? usage : 'Unable to read the Git index. Check the checkout path, Git installation and index size.');
  process.exitCode = 1;
}
