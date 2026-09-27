# Launch evidence

The production workflow is intentionally fail-closed. It requires six independent approvals:

1. usability;
2. legal and privacy;
3. provider Terms;
4. external penetration test;
5. production infrastructure;
6. operator incident drill.

Copy each `*.example.json` file to the same name without `.example`, then replace every placeholder with evidence from an authorized reviewer. Local evidence files are ignored by Git. In GitHub Actions, store the complete JSON object in the protected production environment secret `LAUNCH_ATTESTATIONS_JSON`.

An attestation is accepted only when:

- `status` is exactly `approved`;
- `approvedBy` identifies the authorized reviewer;
- `approvedAt` is an ISO-8601 UTC timestamp;
- `evidenceUrl` is a valid HTTPS URL.

Run `npm run launch:gate`. Never approve your own external review or fabricate evidence.