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
    '# Generated locally. Never commit this file.',
    'PUBLIC_HOST=REPLACE_WITH_DNS_NAME',
    'ACME_EMAIL=REPLACE_WITH_OPERATOR_EMAIL',
    'IMAGE_REF=ghcr.io/stmarya/jagawarga@sha256:REPLACE_WITH_IMMUTABLE_DIGEST',
    'APP_IMAGE_DIGEST=sha256:REPLACE_WITH_IMMUTABLE_DIGEST',
    'APP_VERSION=0.13.0-rc.1',
    `ADMIN_METRICS_TOKEN=${randomBytes(32).toString('base64url')}`,
    'FEATURE_PREMIUM_PROVIDERS=false',
    'VIRUSTOTAL_API_KEY=',
    'DISABLE_CLOUDFLARE_DNS=false',
    'DISABLE_GOOGLE_DNS=false',
    '',
  ].join('\n');
  const file = await open(path, 'wx', 0o600);
  await file.writeFile(content);
  await file.close();
  console.log(`Created ${path} with mode 0600. Replace all REPLACE_* values.`);
}