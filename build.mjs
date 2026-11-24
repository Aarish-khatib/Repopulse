import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';

const source = await readFile(new URL('./src/repopulse.ts', import.meta.url), 'utf8');
await mkdir('dist', { recursive: true });
await writeFile('dist/repopulse.mjs', stripTypeScriptTypes(source));
