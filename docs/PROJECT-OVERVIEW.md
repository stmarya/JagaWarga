# Ringkasan & Deskripsi Proyek: JagaWarga

**JagaWarga** adalah platform *digital security lookup*, panduan pertolongan pertama insiden keamanan siber (*first-aid digital incident guide*), dan literasi keamanan digital terpadu yang dirancang khusus untuk masyarakat Indonesia dengan prinsip **Cek → Pahami → Bertindak → Belajar**.

---

## 1. Visi, Misi, dan Latar Belakang

* **Visi**: Menciptakan ruang digital yang aman dan memberdayakan warga agar tidak mudah menjadi korban kejahatan siber (penipuan online, social engineering, phishing, dan malware APK).
* **Misi**: Menjembatani jurang teknis antara *cybersecurity intelligence* yang rumit dengan pemahaman masyarakat awam melalui bahasa sederhana, kesimpulan yang jelas (*explainable verdict*), dan tindakan mitigasi nyata tanpa menimbulkan kepanikan.
* **Latar Belakang**: Maraknya kasus penipuan digital di Indonesia (modus kurir paket APK, surat tilang palsu, perbankan, undangan pernikahan) sering kali menargetkan masyarakat yang minim literasi teknis. Sebagian besar alat keamanan yang ada berorientasi untuk profesional TI, menggunakan bahasa Inggris dengan metrik teknis yang sulit dipahami orang awam. JagaWarga hadir sebagai sahabat digital warga yang mengutamakan privasi dan kemudahan akses.

---

## 2. Peta Fitur & Modul Utama

```
                     ┌────────────────────────┐
                     │ JagaWarga (Pusat Cek)  │
                     └──────────┬─────────────┘
          ┌─────────────────────┼─────────────────────┐
          │                     │                     │
┌─────────▼────────┐  ┌─────────▼────────┐  ┌─────────▼────────┐
│  Pusat Cek IoC   │  │  Panduan Darurat │  │  Edukasi & Tools │
│  (/periksa)      │  │  (/emergency)    │  │  (/education,    │
│  Link, Teks, QR, │  │  Pertolongan     │  │   /tools)        │
│  Hash APK lokal  │  │  Pertama Insiden │  │  Simulasi & Kuis │
└─────────┬────────┘  └──────────────────┘  └──────────────────┘
          │
┌─────────▼────────┐
│  AI Asisten Groq │
│  Realtime-Aware  │
└──────────────────┘
```

### 🔍 1. Pusat Cek Digital (`/periksa`)
Pintu gerbang mandiri untuk memeriksa sinyal digital mencurigakan:
- **Tautan & IoC**: Mendeteksi reputasi URL, domain, IP publik, dan hash file melalui integrasi *gateway* (VirusTotal existing-lookup, Google DNS, Cloudflare DNS).
- **Teks Pesan**: Menganalisis teks SMS, WhatsApp, atau email untuk mendeteksi manipulasi psikologis (*urgency*, ancaman pemblokiran, iming-iming hadiah, permintaan OTP/transfer).
- **Berkas / APK**: Menghitung *hash* SHA-256 berkas langsung di peramban pengguna (*client-side*). **Isi berkas tidak pernah diunggah ke server**, menjaga privasi maksimal.
- **Kode QR**: Membaca tujuan URL dari gambar atau kamera langsung tanpa membuka tautan secara otomatis.

### 🚨 2. Pertolongan Pertama Digital (`/emergency`)
Halaman aksi cepat untuk warga yang **"sudah terlanjur"**:
- Terlanjur klik tautan asing.
- Terlanjur mengisi username/password atau kode OTP.
- Terlanjur mentransfer uang ke pihak penipu.
- Terlanjur memasang aplikasi / file APK mencurigakan.
- Akun media sosial atau perpesanan diambil alih.
- Menyediakan *checklist* langkah darurat berurutan dan tautan cepat ke kanal pelaporan resmi: **Patrolisiber Polri**, **IASC OJK**, dan **Aduan Konten Komdigi**.

### 🤖 3. Asisten AI Interaktif (`/api/ai/chat`)
- Ditenagai oleh model LLM **Groq (Llama 3.3 70B Versatile)**.
- **Sadar Konteks (*Context-Aware*)**: AI otomatis mengetahui halaman apa yang sedang dibuka pengguna, apa indikator yang baru saja diperiksa, dan apa temuan risikonya sehingga dapat memberikan konsultasi yang sangat relevan, ramah, dan menenangkan.

### 📚 4. Literasi & Gamifikasi (`/education`)
- Modul *micro-learning* interaktif yang membedah modus-modus penipuan digital terkini di Indonesia.
- Dilengkapi kuis simulasi keputusan, perolehan XP, dan badge pencapaian lokal untuk membangun kebiasaan siber yang sehat.

### 🛠️ 5. Alat Bantu Khusus (`/tools`)
- **Unshorten URL**: Membuka kedok tautan pendek (`bit.ly`, `s.id`, `t.co`) secara aman tanpa mengeksekusi cookie pelacak.
- **Email Header Analyzer**: Memeriksa autentikasi SPF, DKIM, dan DMARC untuk membongkar email palsu (*spoofing*).
- **File Hasher & QR Decoder**.

---

## 3. Filosofi Desain & Keamanan

1. **Privacy by Design & Data Minimization**:
   - Tidak ada pengunggahan file mentah pengguna ke server.
   - Prinsip *Existing-Lookup Only* (tidak mempublikasikan atau men-submit link baru warga ke layanan intelijen eksternal demi menghindari kebocoran data sensitif).
   - Riwayat pencarian disimpan secara lokal (*opt-in local storage*) pada perangkat masing-masing warga.
2. **Explainable Verdicts (Bukan Sekadar Skor Angka)**:
   - Menghindari jargon rumit; menyajikan 4 level status yang gamblang:
     - 🔴 **Bahaya Tinggi** (*High Risk*)
     - 🟡 **Perlu Waspada / Mencurigakan** (*Suspicious*)
     - 🟢 **Belum Ada Indikasi Ancaman** (*No Threat Found*)
     - ⚪ **Data Belum Cukup** (*Insufficient Data*)
3. **Ketahanan Tingkat Operasional (*Production Readiness*)**:
   - Memiliki sistem kendali ketat: *Strict CSP*, *Rate Limiting*, *Circuit Breakers*, *Response Capping*, isolasi Redis distributed cache, serta pengujian otomatis (*109 unit tests passing*).

---

## 4. Arsitektur & Tumpukan Teknologi (Tech Stack)

| Komponen | Teknologi | Keterangan |
| :--- | :--- | :--- |
| **Frontend Framework** | **Next.js 16 (Turbopack, App Router)** | Server & Client Components, performa instan |
| **Bahasa Pemrograman** | **TypeScript 5.x** | *Strict type checking*, handal dan minim bug |
| **Desain & Gaya** | **Vanilla CSS Modern & Design System** | Token terkurasi, *responsive zero-overflow*, dark slate aesthetic |
| **Kecerdasan Buatan** | **Groq SDK (Llama 3.3 70B)** | Respon instan berlatensi rendah untuk AI asisten |
| **Cache & Distributed State** | **Redis 7 (Alpine)** | Rate limiter, circuit breaker state, evidence caching |
| **Security Intelligence** | **VirusTotal API, Google DNS, Cloudflare DNS** | Pinned metadata lookups & threat indicators |
| **Testing & Quality Assurance** | **Vitest** | 109 unit & contract tests |
| **Deployment & Ops** | **Docker Compose, Multi-stage Dockerfile** | Non-root `nextjs` user, lightweight Alpine Linux |
| **Aksesibilitas Mobile** | **Progressive Web App (PWA)** | Dapat diinstal ke *homescreen* HP, mendukung Web Share Target |

---

## 5. Target Pengguna & Dampak Sosial

* **Masyarakat Awam & Keluarga**: Memiliki pegangan ketika menerima pesan mencurigakan di WhatsApp/SMS sebelum terlanjur klik atau transfer.
* **Korban Kejahatan Digital**: Menemukan panduan langkah darurat yang runtut dan tidak membingungkan saat panik.
* **Komunitas & Pegiat Edukasi**: Bahan ajar literasi digital interaktif dengan studi kasus nyata di Indonesia.
