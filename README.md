# RepoPulse

Inspect the Git index of a local checkout for documentation, licensing, test files and GitHub Actions workflows. Each observation includes the count and up to five example paths. Runs offline using Git and Node.js 24 with zero npm dependencies.

## Run

From the RepoPulse directory:

```sh
npm run build
node dist/repopulse.mjs /path/to/checkout
node dist/repopulse.mjs --json /path/to/checkout
npm test
```

Omit the path to inspect the current checkout. A checkout subdirectory also works. JSON output has a schema version of 1. Successful inspection exits 0 even when counts are zero. Invalid arguments or an unreadable index exit 1.

## Reading the results

| Check | Filename evidence |
| --- | --- |
| readme | README at the root, in docs, or in .github |
| license | Root LICENSE, LICENCE, or COPYING, optionally with an extension |
| githubActions | YAML files immediately inside .github/workflows |
| testFiles | JS/TS .test or .spec files, Python test_ or _test files, and Go _test files |

Counts reflect staged regular-file paths, including tracked paths missing from disk. Untracked files, unresolved conflict entries, symlinks and submodule contents are excluded. Matches establish filename presence only. A missing match may reflect a different naming convention. RepoPulse does not run project scripts, evaluate license terms or check whether workflows or tests pass. Git listing output is limited to 64 MiB and paths are decoded as UTF-8.
