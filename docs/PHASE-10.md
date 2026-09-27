# Phase 10 — Local acceptance and operator handoff

## Outcome

The v0.9.0 native production build is ready for loopback-only local acceptance. Public production remains NO-GO.

## Automated acceptance

Run:

```bash
npm run acceptance:local
```

The command:

1. builds the production application;
2. starts it on `127.0.0.1:3100`;
3. verifies security headers, liveness, readiness, policy, version, and protected metrics;
4. runs the mobile semantic UI smoke test;
5. runs a 500-request bounded load smoke;
6. writes `artifacts/local-acceptance-latest.json`;
7. terminates the temporary server.

## Completion boundary

Local acceptance can be marked Done after the report says `LOCAL-READY`. This does not complete public external launch gates. Usability, legal/privacy, provider Terms, external penetration testing, production infrastructure, and operator incident drill require attributable external evidence.

## Operator handoff

For a Docker-capable local VPS or workstation, follow [`LOCAL-DEPLOYMENT.md`](LOCAL-DEPLOYMENT.md). Run the acceptance command again after any dependency, runtime, policy, provider, or infrastructure change.