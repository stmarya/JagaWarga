import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = dirname(fileURLToPath(import.meta.url));
const path = resolve(directory, '.env.production');
const text = await readFile(path, 'utf8');
const values = Object.fromEntries(text.split(/\r?\n/).filter((line) => line && !line.startsWith('#')).map((line) => {
  const index = line.indexOf('=');
  return [line.slice(0, index), line.slice(index + 1)];
}));

const errors = [];
for (const key of ['PUBLIC_HOST', 'ACME_EMAIL', 'IMAGE_REF', 'APP_IMAGE_DIGEST', 'ADMIN_METRICS_TOKEN']) {
  if (!values[key]) errors.push(`${key} is required`);
}
if (text.includes('REPLACE_')) errors.push('Replace every REPLACE_* placeholder');
if (!/^[a-z0-9.-]+$/i.test(values.PUBLIC_HOST || '') || !(values.PUBLIC_HOST || '').includes('.')) {
  errors.push('PUBLIC_HOST must be a DNS hostname');
}
if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(values.ACME_EMAIL || '')) errors.push('ACME_EMAIL is invalid');
if (!/^ghcr\.io\/stmarya\/jagawarga@sha256:[a-f0-9]{64}$/.test(values.IMAGE_REF || '')) {
  errors.push('IMAGE_REF must be the immutable GHCR sha256 digest');
}
if (!/^sha256:[a-f0-9]{64}$/.test(values.APP_IMAGE_DIGEST || '')) {
  errors.push('APP_IMAGE_DIGEST must be a sha256 digest');
}
if (values.IMAGE_REF && values.APP_IMAGE_DIGEST && !values.IMAGE_REF.endsWith(`@${values.APP_IMAGE_DIGEST}`)) {
  errors.push('APP_IMAGE_DIGEST must match IMAGE_REF');
}
if ((values.ADMIN_METRICS_TOKEN || '').length < 32) errors.push('ADMIN_METRICS_TOKEN is too short');

if (errors.length) {
  console.error(JSON.stringify({ status: 'invalid', errors }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ status: 'valid', host: values.PUBLIC_HOST, image: values.IMAGE_REF }, null, 2));