# Phase Readiness

Status saat ini: **belum siap melewati gate Fase 0–1**. Repository foundation dan safe no-provider lookup sudah berjalan, tetapi public beta tidak boleh dimulai sebelum seluruh blocker ditutup.

## Fase 0 gate

- [ ] 15–20 wawancara pengguna selesai.
- [ ] Top 5 JTBD dan use case tervalidasi.
- [ ] Provider license/ToS dan cache/redistribution rights dikonfirmasi.
- [ ] Threat model dan privacy impact assessment disetujui.
- [ ] Golden test dataset tersedia.
- [ ] Low-fidelity prototype diuji.
- [ ] ≥80% partisipan memahami verdict dan tindakan.
- [ ] Scope dan acceptance criteria dibekukan.

## Fase 1 gate

- [x] Input canonicalization dan redaction baseline teruji.
- [ ] SSRF-safe lookup gateway lulus adversarial tests.
- [ ] Minimal dua provider adapters memiliki contract tests dan kill switch.
- [ ] Cache, queue, quota, timeout, dan partial-result states teruji.
- [ ] Lookup success ≥95% pada golden dataset.
- [ ] Tidak ada critical/high unresolved security finding.
- [ ] Tidak ada PII/token pada logs dan analytics.
- [ ] Accessibility dan usability targets tercapai.
- [ ] 10 micro-lessons dan 3 challenges direview.
- [ ] Closed pilot serta incident drill selesai.

## Keputusan tetap

- Indonesia-first, responsive web/PWA.
- Anonymous quick check; account opsional.
- Pilot non-komersial/gratis.
- Metadata dan existing lookup only.
- File hash-only; tidak ada file upload.
- No-data tidak pernah diubah menjadi status aman.
