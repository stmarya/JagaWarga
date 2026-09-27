import { existsSync, readFileSync } from 'node:fs';

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));
const pkg = readJson('package.json');
const inventory = readJson('release/feature-inventory.json');
const findings = readJson('release/internal-findings.json');
const acceptance = readJson('artifacts/local-acceptance-latest.json');
const performance = readJson('artifacts/performance-proof-latest.json');
const operations = readJson('artifacts/operational-proof-latest.json');
const launchStatus = readJson('public/launch-status.json');

const errors = [];
if (!/-rc\.\d+$/.test(pkg.version)) errors.push('Package version must be an RC version');
if (acceptance.version !== pkg.version || acceptance.decision !== 'LOCAL-READY') errors.push('Local acceptance evidence is missing, stale, or failed');
if (performance.decision !== 'PASSED') errors.push('Performance proof failed or missing');
if (operations.decision !== 'PASSED') errors.push('Operational proof failed or missing');
if (launchStatus.version !== pkg.version || launchStatus.publicProduction !== 'NO-GO') errors.push('Public launch status must match the RC and remain NO-GO');
const openHighFindings = findings.findings.filter((finding) => ['P0', 'P1'].includes(finding.severity) && finding.status !== 'closed');
if (openHighFindings.length) errors.push(`Open P0/P1 findings: ${openHighFindings.map((item) => item.id).join(', ')}`);
for (const feature of inventory.features) {
  if (!['implemented', 'deferred', 'experimental'].includes(feature.state)) errors.push(`${feature.id}: invalid state`);
  if (feature.state === 'implemented') {
    for (const field of ['testEvidence', 'documentation', 'metrics', 'rollback']) {
      if (!feature[field]) errors.push(`${feature.id}: implemented feature missing ${field}`);
    }
  } else if (feature.enabled || feature.publicPromise || !feature.failClosedEvidence) {
    errors.push(`${feature.id}: non-launch feature is not fail-closed`);
  }
}

let approvalsComplete = false;
if (existsSync('release/internal-approvals.json')) {
  const approvals = readJson('release/internal-approvals.json');
  approvalsComplete = ['engineering', 'security', 'product', 'operations'].every((role) => {
    const approval = approvals[role];
    return approval?.status === 'approved' && approval.approvedBy && !Number.isNaN(Date.parse(approval.approvedAt));
  });
}
const stagingComplete = existsSync('release/staging-verification.json')
  && readJson('release/staging-verification.json').status === 'verified';

const result = {
  decision: errors.length ? 'INTERNAL-NO-GO' : 'INTERNAL-GO',
  version: pkg.version,
  errors,
  noOpenP0P1: openHighFindings.length === 0,
  featureInventoryComplete: !errors.some((error) => error.includes(':')),
  approvals: approvalsComplete ? 'complete' : 'pending',
  stagingEvidence: stagingComplete ? 'complete' : 'pending',
  publicProduction: 'NO-GO'
};
console.log(JSON.stringify(result, null, 2));
if (errors.length) process.exit(1);
