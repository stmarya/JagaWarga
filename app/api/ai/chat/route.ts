import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

type ChatContext = {
  pathname?: string;
  lastResult?: {
    indicator?: { type: string; displayValue: string };
    risk?: number;
    verdict?: string;
    checkedAt?: string;
    confidence?: string;
    reasons?: string[];
  } | null;
};

function generateFallbackResponse(userPrompt: string, context?: ChatContext): string {
  const lower = userPrompt.toLowerCase();
  const last = context?.lastResult;
  const path = context?.pathname || '/';

  // 1. User asking about the current lookup result
  if (last && (lower.includes('hasil') || lower.includes('indikator') || lower.includes('risiko') || lower.includes('aman') || lower.includes('ini'))) {
    const isDangerous = (last.risk ?? 0) >= 60 || last.verdict?.includes('high') || last.verdict?.includes('malicious');
    if (isDangerous) {
      return `⚠️ **Peringatan Bahaya untuk ${last.indicator?.displayValue || 'indikator ini'}**:
- **Skor Risiko**: ${last.risk ?? 0}/100 (${last.verdict || 'Berbahaya'})
- **Status**: Indikator ini terdeteksi mencurigakan oleh mesin intelijen keamanan.
- **Tindakan**:
  1. JANGAN klik tautan, unduh berkas, atau masukkan nomor telepon/kata sandi/PIN.
  2. Jangan bagikan ke grup keluarga atau media sosial.
  3. Jika terlanjur diklik, segera tutup browser dan periksa riwayat perizinan perangkat.`;
    }
    return `ℹ️ **Hasil Pemeriksaan untuk ${last.indicator?.displayValue || 'indikator ini'}**:
- **Skor Risiko**: ${last.risk ?? 0}/100 (${last.verdict || 'Risiko Rendah / Netral'})
- **Keyakinan**: ${last.confidence || 'Tinggi'}
- Walaupun skor saat ini tidak menunjukkan riwayat berbahaya yang aktif, tetap waspada jika pengirim meminta kode OTP, transfer uang dadakan, atau unduhan berkas APK di luar Google Play / App Store.`;
  }

  // 2. Emergency / Transferred money / Clicked APK
  if (lower.includes('transfer') || lower.includes('terlanjur') || lower.includes('tertipu') || lower.includes('kena tipu') || lower.includes('uang')) {
    return `🚨 **Langkah Darurat 5 Menit Pertama (Jika Terlanjur Transfer/Kena Tipu)**:
1. **Hubungi Bank Pengirim SEGERA**: Telepon call center resmi bank Anda (misal BCA 1500888, Mandiri 14000, BRI 1500017, BNI 1500046). Minta penahanan/pemblokiran transaksi ke rekening penipu.
2. **Kumpulkan Bukti Transaksi**: Screenshot bukti transfer, nomor rekening pelaku, nama pemilik rekening, serta riwayat chat lengkap.
3. **Laporkan ke Kanal Resmi Pemerintah**:
   - **CekRekening.id** (Kemenkominfo) untuk blokir rekening penipu di seluruh perbankan.
   - **Lapor.go.id** & **PatroliSiber.id** (Polri) untuk penerbitan laporan polisi formal.
4. Buka menu **Darurat** di JagaWarga untuk panduan langkah perbankan lebih detail.`;
  }

  if (lower.includes('apk') || lower.includes('undangan') || lower.includes('tilang') || lower.includes('paket') || lower.includes('install') || lower.includes('pasang')) {
    return `📱 **Langkah Penyelamatan Cepat (Jika Terlanjur Klik / Install Berkas APK)**:
1. **Putuskan Koneksi Seketika**: Nyalakan **Mode Pesawat (Airplane Mode)** dan matikan sambungan Wi-Fi agar malware tidak bisa mencuri SMS/OTP ke server penyerang.
2. **Cabut Kartu SIM**: Pindahkan sementara kartu SIM ke ponsel cadangan / feature phone sederhana.
3. **Hapus Aplikasi Berbahaya**: Buka *Pengaturan HP > Aplikasi > Kelola Aplikasi*, cari aplikasi mencurigakan yang baru saja terpasang, lalu copot pemasangan (Uninstall).
4. **Periksa Izin Akses SMS & Notifikasi**: Pastikan tidak ada aplikasi asing yang memiliki izin membaca SMS.
5. **Ganti Kata Sandi & PIN Mobile Banking**: Lakukan perubahan PIN bank dari perangkat lain yang aman.`;
  }

  // 3. Contextual to current page
  if (path.includes('/tools')) {
    return `🛠️ **Panduan Fitur Alat Keamanan (Tools)**:
- **Pemeriksa Tautan Singkat (Unshortener)**: Buka tautan bit.ly / s.id / tinyurl dengan aman tanpa langsung mengunjungi web aslinya.
- **Analisis Pesan**: Cek kalimat mencurigakan, urgensi palsu, dan pola penipuan di WhatsApp/SMS.
- **Pemeriksaan Email Header**: Pastikan SPF, DKIM, dan pengirim asli email benar dari domain resmi instansi.
- **Hash Berkas Lokal**: Hitung SHA-256 berkas APK/PDF tanpa mengunggah dokumen Anda ke server luar.
Ada alat yang ingin Anda gunakan sekarang?`;
  }

  if (path.includes('/education')) {
    return `🎓 **Rekomendasi Modul Edukasi JagaWarga**:
Kami merekomendasikan memulai dari topik:
1. **Phishing & Rekayasa Sosial**: Pelajari cara membedakan pesan resmi vs pesan penipu.
2. **Modus APK & Surat Tilang/Undangan**: Trik manipulasi yang paling marak di Indonesia saat ini.
3. **QRIS Quishing**: Waspada stiker QRIS palsu di tempat umum.
Setiap modul dilengkapi latihan interaktif dan sertifikat kelulusan digital!`;
  }

  // 4. General assistant greeting
  return `Halo! Saya **Asisten Siaga JagaWarga**, siap mendampingi Anda menjelajahi ruang digital dengan aman.

Anda bisa bertanya mengenai:
- Menjelaskan hasil pemeriksaan URL/domain/IP saat ini
- Ciri-ciri pesan WhatsApp/SMS penipuan (undangan pernikahan, kurir, tilang ETLE)
- Langkah pertolongan pertama jika terlanjur transfer atau klik APK
- Penggunaan alat bantu di JagaWarga

Ada yang mencurigakan yang ingin kita periksa bersama?`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const messages: ChatMessage[] = Array.isArray(body?.messages) ? body.messages : [];
    const context: ChatContext = body?.context ?? {};

    if (!messages.length) {
      return NextResponse.json({ error: 'EMPTY_MESSAGES' }, { status: 400 });
    }

    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')?.content ?? '';

    // Check for Groq API Key
    const groqKey = process.env.GROQ_API_KEY?.trim();
    const hasValidGroq = Boolean(groqKey && !groqKey.includes('...') && groqKey.startsWith('gsk_'));

    if (hasValidGroq) {
      // Build system prompt with live context
      const last = context.lastResult;
      const contextSnippet = [
        `Halaman pengguna saat ini: ${context.pathname || '/'}`,
        last ? `Hasil scan terakhir: Tipe ${last.indicator?.type || 'IOC'} = "${last.indicator?.displayValue || '-'}", Skor Risiko = ${last.risk ?? 0}/100, Vonis = "${last.verdict || '-'}"` : 'Pengguna belum melakukan scan di sesi ini.',
      ].join('\n');

      const systemPrompt = `Anda adalah "Asisten Siaga JagaWarga", pakar keamanan siber dan perlindungan penipuan digital untuk warga Indonesia.
Tugas Anda:
1. Melindungi warga dari kejahatan digital: phishing, malware/APK undangan palsu, rekayasa sosial, pinjol ilegal, penipuan transfer uang, quishing QRIS, dan pencurian OTP.
2. Menjelaskan istilah teknis secara jelas, ramah, dan mudah dipahami orang awam.
3. Memberikan panduan darurat taktis dan langsung (actionable steps) bila korban sudah terlanjur mentransfer uang atau mengklik APK.
4. Manfaatkan konteks live pengguna saat ini:
${contextSnippet}
5. Format jawaban menggunakan Markdown yang rapi (poin-poin, tebal untuk kata kunci penting). Jangan bertele-tele. Jaga kerahasiaan data pengguna.`;

      try {
        const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${groqKey}`,
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: systemPrompt },
              ...messages.slice(-8), // Keep last 8 turns for conversational context
            ],
            temperature: 0.3,
            max_tokens: 800,
          }),
        });

        if (groqResponse.ok) {
          const data = await groqResponse.json();
          const reply = data.choices?.[0]?.message?.content;
          if (reply) {
            return NextResponse.json({
              reply,
              model: 'groq/llama-3.3-70b-versatile',
              poweredBy: 'Groq Cloud',
            });
          }
        }
      } catch (err) {
        // Log silently and fall through to smart fallback
        console.warn('Groq API call encountered an error, falling back to local advisor:', err);
      }
    }

    // Fallback to local intelligent cybersecurity engine
    const reply = generateFallbackResponse(lastUserMessage, context);
    return NextResponse.json({
      reply,
      model: 'jagawarga/offline-advisor',
      poweredBy: 'JagaWarga Security Intelligence',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
