# Incident Response

## Severity
- SEV-1: secret exposure, internal-network access, authentication bypass, or personal-data disclosure.
- SEV-2: widespread incorrect verdict, provider compromise, or abuse-control bypass.
- SEV-3: partial provider outage, quota exhaustion, or degraded performance.

## First 30 minutes
1. Assign incident commander and timestamp the incident.
2. Disable the affected provider/endpoint or roll back the release.
3. Revoke exposed credentials.
4. Preserve privacy-safe logs and commit/deployment identifiers.
5. Publish a status notice without exposing victim information.

## Recovery
- Verify secret scan, dependency audit, automated tests, build, smoke test, and security headers.
- Document root cause, affected window, corrective action, and follow-up owner.
- Never copy raw user indicators or message content into the incident document.