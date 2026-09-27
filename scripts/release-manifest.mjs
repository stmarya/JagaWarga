import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const files = [
  'package-lock.json',
  'Dockerfile',
  'public/openapi.json',
  'public/policy.json',
  'release/feature-inventory.json',
  'release/internal-findings.json',
  'artifacts/local-acceptance-latest.json',
  'artifacts/performance-proof-latest.json',
  'artifacts/operational-proof-latest.json',
  'artifacts/reproducibility-proof-latest.json',
];
if (existsSync('release/internal-approvals.json')) files.push('release/internal-approvals.json');
if (existsSync('release/staging-verification.json')) files.push('release/staging-verification.json');
const sha256 = (content) => createHash('sha256').update(content).digest('hex');
const commit = (() => {
  try { return execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(); }
  catch { return process.env.GITHUB_SHA ?? 'unknown'; }
})();
const status = (() => {
  try { return execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }); }
  catch { return ''; }
})();
const proofs = {
  localAcceptance: JSON.parse(readFileSync('artifacts/local-acceptance-latest.json', 'utf8')).decision,
  performance: JSON.parse(readFileSync('artifacts/performance-proof-latest.json', 'utf8')).decision,
  operations: JSON.parse(readFileSync('artifacts/operational-proof-latest.json', 'utf8')).decision,
  reproducibility: JSON.parse(readFileSync('artifacts/reproducibility-proof-latest.json', 'utf8')).decision,
};
const manifest = {
  schemaVersion: 2,
  version: pkg.version,
  commit,
  sourceTree: {
    dirty: Boolean(status.trim()),
    workingTreeDiffSha256: status.trim() ? sha256(execFileSync('git', ['diff', '--binary', 'HEAD'], { encoding: 'buffer' })) : null,
  },
  generatedAt: new Date().toISOString(),
  decision: Object.values(proofs).every((value) => ['LOCAL-READY', 'PASSED'].includes(value)) ? 'INTERNAL-GO' : 'INTERNAL-NO-GO',
  publicProduction: 'NO-GO',
  proofs,
  stagingEvidence: existsSync('release/staging-verification.json') ? 'attached' : 'pending',
  internalApprovals: existsSync('release/internal-approvals.json') ? 'attached' : 'pending',
  privacyBoundary: { fileUpload: false, urlSubmission: false, rawContentPersistence: false },
  artifacts: Object.fromEntries(files.map((file) => [file, { sha256: sha256(readFileSync(file)) }])),
};
writeFileSync('release-manifest.json', JSON.stringify(manifest, null, 2) + '\n');
console.log(`Release manifest generated for ${pkg.version} (${commit.slice(0, 12)}).`);