import { randomBytes } from 'node:crypto';
import { open, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = dirname(fileURLToPath(import.meta.url));
const path = resolve(directory, '.env.production');

try {
  await readFile(path);
  console.log(`${path} already exists; leaving it unchanged.`);
} catch {
  const content = [
    '# JagaWarga Cloud Production Deployment',
    '# Production domain: https://jagawarga.cloud',
    'PUBLIC_HOST=jagawarga.cloud',
    'CADDY_DOMAINS=jagawarga.cloud, www.jagawarga.cloud',
    'ACME_EMAIL=admin@jagawarga.cloud',
    'IMAGE_REF=jagawarga:0.13.0-rc.4',
    'APP_IMAGE_DIGEST=sha256:build',
    'APP_VERSION=0.13.0-rc.4',
    `ADMIN_METRICS_TOKEN=${randomBytes(32).toString('base64url')}`,
    'FEATURE_PREMIUM_PROVIDERS=false',
    'VIRUSTOTAL_API_KEYS=',
    'VIRUSTOTAL_API_KEY=',
    'GROQ_API_KEYS=',
    'GROQ_API_KEY=',
    'GROQ_MODEL=openai/gpt-oss-120b',
    'DISABLE_CLOUDFLARE_DNS=false',
    'DISABLE_GOOGLE_DNS=false',
    '',
  ].join('\n');
  const file = await open(path, 'wx', 0o600);
  await file.writeFile(content);
  await file.close();
  console.log(`Created ${path} with mode 0600. Replace all REPLACE_* values.`);
}