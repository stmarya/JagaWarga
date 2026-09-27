import { randomBytes } from 'node:crypto';
import { open, readFile } from 'node:fs/promises';

const path = '.env.local-deploy';

try {
  await readFile(path);
  console.log(`${path} already exists; leaving it unchanged.`);
} catch {
  const content = [
    '# Generated locally. Never commit this file.',
    'APP_PORT=3000',
    `ADMIN_METRICS_TOKEN=${randomBytes(32).toString('base64url')}`,
    `POSTGRES_PASSWORD=${randomBytes(32).toString('base64url')}`,
    'FEATURE_PREMIUM_PROVIDERS=false',
    'VIRUSTOTAL_API_KEY=',
    '',
  ].join('\n');
  const file = await open(path, 'wx', 0o600);
  await file.writeFile(content);
  await file.close();
  console.log(`Created ${path} with mode 0600.`);
}