# Operator Incident Drill

Repository-level failure simulations run with:

```bash
npm run performance:proof
npm run operations:proof
```

These cover provider timeout degradation, queue saturation, rate limiting,
circuit opening/recovery, Redis distributed-state behavior, fail-closed launch
evidence, and immutable rollback validation. The named-operator infrastructure
drill remains an external launch gate.

## Scenario
A provider returns widespread incorrect results while a dependency advisory is published and the metrics endpoint receives unauthorized attempts.

## Expected actions
1. Declare severity and assign incident commander.
2. Disable the affected provider with its kill switch.
3. Verify readiness, policy, and no-submission boundaries.
4. Roll back to the previous immutable image if needed.
5. Preserve privacy-safe evidence and publish a status update.
6. Rotate credentials if exposure is suspected.
7. Produce timeline, root cause, remediation, and follow-up owners.

## Pass criteria
Detection, decision, kill switch, rollback, communication, and recovery evidence are timestamped. No raw user content enters the incident record.