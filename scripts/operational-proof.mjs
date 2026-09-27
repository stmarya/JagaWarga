import { spawnSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

function run(command, args, env = {}) {
  return spawnSync(command, args, {
    cwd: process.cwd(),
    env: { ...process.env, ...env },
    encoding: 'utf8',
  });
}

const syntaxTargets = [
  'deploy/self-hosted/deploy.sh',
  'deploy/self-hosted/rollback.sh',
];
const syntax = syntaxTargets.map((path) => ({
  path,
  passed: run('bash', ['-n', path]).status === 0,
}));

const mutableRollback = run('bash', ['deploy/self-hosted/rollback.sh'], {
  ROLLBACK_IMAGE_REF: 'ghcr.io/stmarya/jagawarga:latest',
  DRY_RUN: 'true',
});
const immutableReference = `ghcr.io/stmarya/jagawarga@sha256:${'a'.repeat(64)}`;
const immutableRollback = run('bash', ['deploy/self-hosted/rollback.sh'], {
  ROLLBACK_IMAGE_REF: immutableReference,
  DRY_RUN: 'true',
});
const launchGate = run(process.execPath, ['scripts/launch-gate.mjs']);
const distributedFailureTests = run(process.execPath, [
  'node_modules/vitest/vitest.mjs',
  'run',
  'lib/runtime/distributed.test.ts',
  'lib/runtime/redis.test.ts',
]);

const report = {
  decision: 'PASSED',
  generatedAt: new Date().toISOString(),
  checks: {
    shellSyntax: syntax,
    mutableRollbackRejected: mutableRollback.status !== 0,
    immutableRollbackValidated: immutableRollback.status === 0
      && JSON.parse(immutableRollback.stdout).digest === `sha256:${'a'.repeat(64)}`,
    launchGateFailsClosedWithoutEvidence: launchGate.status !== 0,
    redisFailureAndRecoveryTestsPassed: distributedFailureTests.status === 0,
    persistenceBackupNotRequired: true,
    persistenceReason: 'The active release stores no durable server-side user data; Redis contains disposable TTL-bound coordination state.',
  },
};
const failures = [
  ...syntax.filter((item) => !item.passed).map((item) => item.path),
  ...Object.entries(report.checks)
    .filter(([, value]) => typeof value === 'boolean' && value === false)
    .map(([name]) => name),
];
if (failures.length) {
  report.decision = 'FAILED';
  throw new Error(`Operational proof failed: ${failures.join(', ')}`);
}
await mkdir(resolve('artifacts'), { recursive: true });
await writeFile(resolve('artifacts/operational-proof-latest.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));