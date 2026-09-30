# Release Candidate 0.13.0-rc.4

## Decision

- Repository-controlled engineering decision: **INTERNAL-GO**
- Public production decision: **NO-GO**
- Staging evidence: pending by owner decision
- Internal role approvals: approved by `stmarya` for engineering, security, product, and operations
- External launch gates: pending (6 evidence gates remain fail-closed)

## Highlights & Changelog (RC.4)

1. **Peningkatan Sensitivitas & Normalisasi IoC/Hash**:
   - Pembersihan otomatis (*auto-stripping*) terhadap awalan label hash seperti `SHA256:`, `sha-256:`, `md5:`, `sha1:`, `hash:`, tanda kurung `[...]`, dan tanda kutip `"..."` pada seluruh saluran input.
   - Mengatasi masalah false negative pada sampel MalwareBazaar/threat feeds yang disalin beserta label teksnya.
2. **Dukungan De-fanged IoC**:
   - Pengenalan otomatis terhadap format defensif seperti `malware[.]com`, `hxxps://`, dan `103[.]20[.]188[.]1` dengan preservasi notasi alamat IPv6 bertanda kurung siku (`http://[::1]`).
3. **Ekstraksi Keluarga Ancaman & Nama Berkas Asli pada `/result`**:
   - Menampilkan label klasifikasi ancaman (`popular_threat_classification.suggested_threat_label`) dan nama berkas terdeteksi (`meaningful_name`) langsung di kartu temuan hasil pemeriksaan.
4. **Pintasan Cepat Input Hash pada Tab Berkas**:
   - Penambahan tombol aksi cepat *"Tempel teks hash"* pada tab Berkas / APK di `/periksa` dan sinkronisasi rute `/tools/file-hash`.
5. **Kualitas Pengujian**:
   - 112 unit tests & contract tests seluruhnya lulus.

## Promotion Requirements

1. Commit seluruh source tree RC.4 dan buat tag `v0.13.0-rc.4`.
2. Verifikasi acceptance lokal dan proof artefak.
3. Pertahankan persetujuan internal di `release/internal-approvals.json`.
4. Publik produksi tetap berstatus `NO-GO` hingga 6 external gates terpenuhi.
