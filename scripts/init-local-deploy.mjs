import { randomBytes } from 'node:crypto';
import { chmod, open, readFile, writeFile } from 'node:fs/promises';

const path = '.env.local-deploy';

const defaults = () => ({
  APP_PORT: '3000',
  ADMIN_METRICS_TOKEN: randomBytes(32).toString('base64url'),
  FEATURE_PREMIUM_PROVIDERS: 'false',
  VIRUSTOTAL_API_KEYS: '',
  VIRUSTOTAL_API_KEY: '',
});

try {
  const current = await readFile(path, 'utf8');
  const variables = defaults();
  const present = new Set(
    current.split(/\r?\n/).filter((line) => line && !line.startsWith('#') && line.includes('=')).map((line) => line.slice(0, line.indexOf('='))),
  );
  const missing = Object.entries(variables).filter(([key]) => !present.has(key));
  if (!missing.length) {
    await chmod(path, 0o600);
    console.log(`${path} is complete; leaving values unchanged.`);
  } else {
    const separator = current.endsWith('\n') ? '' : '\n';
    await writeFile(path, `${current}${separator}${missing.map(([key, value]) => `${key}=${value}`).join('\n')}\n`, { mode: 0o600 });
    await chmod(path, 0o600);
    console.log(`Repaired ${path}; added missing variables: ${missing.map(([key]) => key).join(', ')}.`);
  }
} catch (error) {
  if (!error || typeof error !== 'object' || !('code' in error) || error.code !== 'ENOENT') throw error;
  const content = [
    '# Generated locally. Never commit this file.',
    ...Object.entries(defaults()).map(([key, value]) => `${key}=${value}`),
    '',
  ].join('\n');
  const file = await open(path, 'wx', 0o600);
  await file.writeFile(content);
  await file.close();
  console.log(`Created ${path} with mode 0600.`);
}