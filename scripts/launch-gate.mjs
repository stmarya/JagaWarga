import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export const REQUIRED_GATES = [
  'usability',
  'legal-privacy',
  'provider-terms',
  'external-pentest',
  'production-infrastructure',
  'incident-drill',
];

const ISO_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;

function validate(gate, value) {
  const errors = [];
  if (!value || typeof value !== 'object' || Array.isArray(value)) return [`${gate}: attestation missing`];
  if (value.status !== 'approved') errors.push(`${gate}: status must be approved`);
  if (typeof value.approvedBy !== 'string' || value.approvedBy.trim().length < 3) errors.push(`${gate}: approvedBy is required`);
  if (typeof value.approvedAt !== 'string' || !ISO_DATE.test(value.approvedAt) || Number.isNaN(Date.parse(value.approvedAt))) {
    errors.push(`${gate}: approvedAt must be an ISO-8601 UTC timestamp`);
  } else if (Date.parse(value.approvedAt) > Date.now() + 300_000) {
    errors.push(`${gate}: approvedAt cannot be in the future`);
  }
  try {
    const url = new URL(value.evidenceUrl);
    if (url.protocol !== 'https:') errors.push(`${gate}: evidenceUrl must use HTTPS`);
  } catch {
    errors.push(`${gate}: evidenceUrl must be a valid URL`);
  }
  return errors;
}

async function loadAttestations(directory) {
  if (process.env.LAUNCH_ATTESTATIONS_JSON) {
    return JSON.parse(process.env.LAUNCH_ATTESTATIONS_JSON);
  }
  const entries = await Promise.all(
    REQUIRED_GATES.map(async (gate) => {
      try {
        return [gate, JSON.parse(await readFile(resolve(directory, `${gate}.json`), 'utf8'))];
      } catch {
        return [gate, undefined];
      }
    }),
  );
  return Object.fromEntries(entries);
}

const directory = process.argv[2] || process.env.LAUNCH_EVIDENCE_DIR || 'launch-evidence';
const attestations = await loadAttestations(directory);
const errors = REQUIRED_GATES.flatMap((gate) => validate(gate, attestations[gate]));

if (errors.length) {
  console.error(JSON.stringify({ decision: 'NO-GO', errors }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  decision: 'GO',
  approvedGates: REQUIRED_GATES,
  checkedAt: new Date().toISOString(),
}, null, 2));