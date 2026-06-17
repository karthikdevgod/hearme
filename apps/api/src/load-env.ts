import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { config as dotenvConfig } from 'dotenv';

/**
 * Loads the monorepo-root .env into process.env before any module reads it.
 * MUST be imported first in main.ts (before AppModule), because app.module.ts
 * validates env at import time. Walks up from this file to find the nearest .env,
 * so it works for both `nest start` (dist) and `node dist/main.js`.
 */
function findEnvFile(): string | null {
  let dir = __dirname;
  for (let i = 0; i < 6; i++) {
    const candidate = resolve(dir, '.env');
    if (existsSync(candidate)) return candidate;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

const envPath = findEnvFile();
if (envPath) {
  dotenvConfig({ path: envPath });
}
