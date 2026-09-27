import { spawnSync } from 'node:child_process';

const baseURL = process.env.BASE_URL || 'http://127.0.0.1:3000';
const result = spawnSync(process.execPath, ['scripts/preflight.mjs'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    BASE_URL: baseURL,
    ALLOW_HTTP_PREFLIGHT: baseURL.startsWith('http://127.0.0.1') || baseURL.startsWith('http://localhost') ? 'true' : process.env.ALLOW_HTTP_PREFLIGHT,
    NODE_ENV: 'production',
  },
});
process.exit(result.status ?? 1);