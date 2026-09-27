# Production Infrastructure Checklist

- [ ] Dedicated cloud account/project and least-privilege IAM.
- [ ] Managed secret store and rotation.
- [ ] DNS, TLS, HSTS, CDN/WAF, and DDoS controls.
- [ ] Immutable GHCR image digest and vulnerability scan.
- [ ] Read-only container, non-root user, dropped capabilities, network egress policy.
- [ ] Redis/PostgreSQL encryption, backups, restore test, and retention.
- [ ] Central logs with redaction, metrics, alerts, and on-call routing.
- [ ] Provider egress allowlist and kill switches verified.
- [ ] Staging and production separation.
- [ ] Rollback and incident drill completed.