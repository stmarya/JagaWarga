import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const baseURL = process.env.BASE_URL || 'http://127.0.0.1:3000';
let requireReputation = process.env.REQUIRE_REPUTATION_PROVIDER === 'true';
try {
  const text = readFileSync('.env.local-deploy', 'utf8');
  const values = Object.fromEntries(text.split(/\r?\n/).filter((line) => line && !line.startsWith('#') && line.includes('=')).map((line) => {
    const index = line.indexOf('=');
    return [line.slice(0, index), line.slice(index + 1)];
  }));
  requireReputation ||= values.FEATURE_PREMIUM_PROVIDERS?.toLowerCase() === 'true';
  if (requireReputation && !values.VIRUSTOTAL_API_KEY?.trim()) {
    throw new Error('FEATURE_PREMIUM_PROVIDERS=true tetapi VIRUSTOTAL_API_KEY kosong di .env.local-deploy');
  }
  if (requireReputation && /[\r\n,]/.test(values.VIRUSTOTAL_API_KEY)) {
    throw new Error('VIRUSTOTAL_API_KEY harus berisi tepat satu key, bukan daftar yang dipisahkan koma');
  }
} catch (error) {
  if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
    // Native non-Docker verification can run without the local Compose env file.
  } else {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
const result = spawnSync(process.execPath, ['scripts/preflight.mjs'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    BASE_URL: baseURL,
    ALLOW_HTTP_PREFLIGHT: baseURL.startsWith('http://127.0.0.1') || baseURL.startsWith('http://localhost') ? 'true' : process.env.ALLOW_HTTP_PREFLIGHT,
    NODE_ENV: 'production',
    REQUIRE_REPUTATION_PROVIDER: requireReputation ? 'true' : 'false',
  },
});
process.exit(result.status ?? 1);