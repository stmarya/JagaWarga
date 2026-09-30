# Release Candidate 0.13.0-rc.3

## Decision

- Repository-controlled engineering decision: **INTERNAL-GO**
- Public production decision: **NO-GO**
- Staging evidence: pending by owner decision
- Internal role approvals: approved by `stmarya` for engineering, security, product, and operations
- External launch gates: pending (6 evidence gates remain fail-closed)

## Highlights & Changelog (RC.3)

1. **Pemisahan Landing Page & Dedicated Scanner Route**:
   - `/` difokuskan sebagai Landing Page bersih, edukatif, dan ramah pengguna dengan panduan orientasi situasi.
   - `/periksa` dan alias `/scan` sebagai rute mandiri Pusat Cek Digital dengan 4 tab intake lengkap (Tautan/IoC, Teks Pesan, File Hash APK lokal, Kode QR).
2. **AI Asisten Berbasis Groq (Llama 3.3 70B)**:
   - Asisten keamanan interaktif dengan kesadaran konteks (*context-awareness* realtime terhadap halaman aktif dan hasil temuan lookup).
   - Antarmuka floating responsive dengan toggle mode icon.
3. **Ekspor Hasil PDF**:
   - Kemampuan unduh laporan bukti teknis ke dalam format dokumen PDF pada halaman `/details`.
4. **Penyempurnaan Modul Edukasi & Alat Bantu**:
   - Evaluasi dan pengayaan materi penipuan digital di Indonesia pada `/education`.
   - Perluasan fitur pembongkar tautan singkat (*unshortener*), decoder QR, dan validasi header email pada `/tools`.
5. **Pembaruan Kebijakan Privasi & Whitelist Domain**:
   - Restrukturisasi transparansi data pada `/privacy` sesuai prinsip minimalisasi data.
   - Penyesuaian reputasi domain tepercaya (*verified vendors*) untuk menghindari false positive pada domain besar (seperti `google.com`).
6. **Dokumentasi Lengkap Proyek**:
   - Penambahan `docs/PROJECT-OVERVIEW.md` dan pembaruan `README.md`.

## Promotion Requirements

1. Commit seluruh source tree RC.3 dan buat tag `v0.13.0-rc.3`.
2. Verifikasi acceptance lokal dan proof artefak.
3. Pertahankan persetujuan internal di `release/internal-approvals.json`.
4. Publik produksi tetap berstatus `NO-GO` hingga 6 external gates terpenuhi.
