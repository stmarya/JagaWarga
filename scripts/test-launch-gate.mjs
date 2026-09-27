import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const gates = [
  'usability',
  'legal-privacy',
  'provider-terms',
  'external-pentest',
  'production-infrastructure',
  'incident-drill',
];
const directory = await mkdtemp(join(tmpdir(), 'jagawarga-launch-gate-'));

try {
  const missing = spawnSync(process.execPath, ['scripts/launch-gate.mjs', directory], { encoding: 'utf8' });
  if (missing.status === 0 || !missing.stderr.includes('NO-GO')) {
    throw new Error('Launch gate did not fail closed when evidence was missing');
  }

  const approvedAt = new Date(Date.now() - 60_000).toISOString();
  await Promise.all(gates.map((gate) => writeFile(
    join(directory, `${gate}.json`),
    JSON.stringify({
      status: 'approved',
      approvedBy: `Authorized reviewer for ${gate}`,
      approvedAt,
      evidenceUrl: `https://github.com/stmarya/JagaWarga/issues/${gate.length}`,
    }),
  )));
  const complete = spawnSync(process.execPath, ['scripts/launch-gate.mjs', directory], { encoding: 'utf8' });
  if (complete.status !== 0 || !complete.stdout.includes('"decision": "GO"')) {
    throw new Error(`Launch gate rejected valid evidence: ${complete.stderr}`);
  }
  console.log('Launch gate tests passed: missing evidence fails closed; complete evidence passes.');
} finally {
  await rm(directory, { recursive: true, force: true });
}