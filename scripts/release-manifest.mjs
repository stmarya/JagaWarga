import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const files = ['package-lock.json', 'Dockerfile', 'public/openapi.json', 'public/policy.json', 'extension/manifest.json'];
const sha256 = (content) => createHash('sha256').update(content).digest('hex');
const commit = (() => {
  try { return execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(); }
  catch { return process.env.GITHUB_SHA ?? 'unknown'; }
})();
const manifest = {
  schemaVersion: 1,
  version: pkg.version,
  commit,
  generatedAt: new Date().toISOString(),
  privacyBoundary: { fileUpload: false, urlSubmission: false, rawContentPersistence: false },
  artifacts: Object.fromEntries(files.map((file) => [file, { sha256: sha256(readFileSync(file)) }])),
};
writeFileSync('release-manifest.json', JSON.stringify(manifest, null, 2) + '\n');
console.log(`Release manifest generated for ${pkg.version} (${commit.slice(0, 12)}).`);