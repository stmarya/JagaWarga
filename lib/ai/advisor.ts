import { officialSources, retrieveEducation } from './knowledge';
import type { AiContext, AiLink, AiReply } from './types';
import { severityFor } from '../security/severity-policy';

export function detectIntent(prompt: string, context: AiContext): AiReply['intent'] {
  const lower = prompt.toLowerCase();
  const emergency = /(terlanjur|sudah|telah|baru saja).{0,35}(transfer|klik|pasang|instal|kirim|beri)|kena tipu|saldo.*hilang|akun.*diambil/.test(lower);
  const negated = /(belum|tidak|jangan).{0,20}(transfer|klik|pasang|instal|kirim)/.test(lower);
  if (emergency && !negated) return 'emergency';
  if (context.lastResult && (context.pathname.includes('/result') || context.pathname.includes('/details') || /(hasil|indikator|risiko|aman|domain|tautan|ip|hash|berkas|ini)/.test(lower))) return 'result';
  if (context.pathname.includes('/education') || /(belajar|edukasi|jelaskan|apa itu|contoh)/.test(lower)) return 'education';
  if (context.pathname.includes('/tools') || /(alat|header|hash|qr|tautan pendek|analisis pesan)/.test(lower)) return 'tool';
  return 'general';
}

function linksFor(intent: AiReply['intent'], context: AiContext): AiLink[] {
  if (intent === 'emergency') return [
    { label: 'Buka panduan darurat', href: '/emergency' },
    { label: 'Laporkan ke IASC', href: 'https://iasc.ojk.go.id/' },
    { label: 'Laporkan ke Patroli Siber', href: 'https://patrolisiber.id/' },
  ];
  if (intent === 'result') return [
    { label: 'Lihat detail teknis', href: '/details' },
    { label: 'Periksa indikator lain', href: '/#scanner' },
  ];
  if (intent === 'education') return [{ label: 'Buka materi edukasi', href: '/education' }];
  if (intent === 'tool') return [{ label: 'Pilih alat bantu', href: '/tools' }];
  return context.lastResult
    ? [{ label: 'Lihat hasil terakhir', href: '/result' }, { label: 'Buka alat bantu', href: '/tools' }]
    : [{ label: 'Mulai pemeriksaan', href: '/#scanner' }, { label: 'Buka alat bantu', href: '/tools' }];
}

export function buildLocalReply(prompt: string, context: AiContext): AiReply {
  const intent = detectIntent(prompt, context);
  const last = context.lastResult;
  const sources = officialSources(intent);
  const links = linksFor(intent, context);

  if (intent === 'result' && last) {
    const severity = severityFor(last);
    const reasons = [...new Set([...last.reasonCodes, ...last.evidence.flatMap((item) => item.reasonCodes)])];
    const reasonText: Record<string, string> = {
      CREDENTIAL_REQUEST: 'Ada permintaan kata sandi, PIN, OTP, atau kode rahasia.',
      MONEY_REQUEST: 'Ada dorongan untuk mengirim uang atau melakukan transaksi.',
      IMPERSONATION: 'Pengirim menunjukkan pola penyamaran sebagai pihak tepercaya.',
      SHORT_LINK: 'Alamat tujuan disembunyikan di balik tautan pendek.',
      URGENCY: 'Pesan mencoba membuat Anda bertindak tergesa-gesa.',
      VT_MULTIPLE_MALICIOUS_DETECTIONS: 'Lebih dari satu mesin keamanan menemukan sinyal berbahaya.',
      VT_SINGLE_MALICIOUS_DETECTION: 'Salah satu mesin keamanan menemukan sinyal berbahaya.',
      VT_SUSPICIOUS_DETECTION: 'Sumber reputasi menandai indikator sebagai mencurigakan.',
      DNS_RESOLVES: 'Domain aktif, tetapi kondisi ini tidak membuktikan bahwa domain aman.',
      PROVIDER_ERROR: 'Sebagian sumber pemeriksaan tidak berhasil merespons.',
    };
    const why = reasons.map((code) => reasonText[code]).filter((item): item is string => Boolean(item)).slice(0, 5);
    if (!why.length) why.push(last.partial ? 'Sebagian sumber belum memberikan data lengkap.' : 'Belum ada sinyal teknis kuat pada data yang tersedia.');
    return {
      intent,
      status: severity.label,
      tone: severity.tone === 'danger' ? 'danger' : severity.tone === 'safe' ? 'safe' : severity.tone === 'neutral' ? 'neutral' : 'warning',
      summary: `${last.indicator?.displayValue || 'Indikator ini'} mendapat skor risiko ${last.risk}. ${severity.summary}`,
      why,
      actions: last.actions.length ? last.actions.slice(0, 6) : [
        severity.level === 'critical' ? 'Hentikan interaksi dan jangan membuka tautan atau berkasnya.' : 'Verifikasi pengirim melalui kontak resmi yang Anda cari sendiri.',
        'Simpan alamat, waktu kejadian, dan tangkapan layar sebagai bukti.',
        last.partial ? 'Ulangi pemeriksaan nanti karena hasil belum lengkap.' : 'Periksa detail teknis sebelum mengambil keputusan penting.',
      ],
      avoid: ['Jangan memberikan OTP, PIN, kata sandi, atau data kartu.', 'Jangan menyimpulkan “aman” hanya karena satu pemeriksaan tidak menemukan ancaman.'],
      escalation: last.risk >= 40 ? ['Laporkan akun atau konten kepada platform terkait.', 'Jika sudah mengalami kerugian, buka panduan darurat dan hubungi lembaga resmi.'] : [],
      sources,
      links,
      followUp: 'Apakah Anda sudah membuka tautan, memasang berkas, atau memberikan data rahasia?',
    };
  }

  const lower = prompt.toLowerCase();
  const asksAboutLinkSafety = intent === 'general'
    && /(link|tautan|url|domain)/.test(lower)
    && /(aman|bahaya|mencurig|klik|streaming|buka)/.test(lower);
  if (asksAboutLinkSafety) {
    return {
      intent,
      status: 'Perlu diperiksa',
      tone: 'warning',
      summary: 'Link ini belum bisa dinyatakan aman hanya dari namanya. Periksa dulu sebelum dibuka.',
      why: ['Nama domain saja tidak cukup untuk memastikan tujuan dan isi halaman.'],
      actions: ['Tempel link ke Pemeriksa JagaWarga sebelum membukanya.'],
      avoid: ['Jangan login atau memasukkan data pribadi di halaman tersebut.'],
      escalation: [],
      sources: [],
      links: [{ label: 'Periksa tautan', href: '/#scanner' }],
    };
  }

  const threat = detectThreat(prompt);
  if (intent === 'general' && threat) {
    return {
      intent,
      status: 'Perlu waspada',
      tone: 'warning',
      summary: 'Ada beberapa tanda yang perlu diwaspadai. Jangan membuka tautan, membalas, atau memberikan data sebelum pengirimnya terverifikasi.',
      why: threat.signals,
      actions: [
        'Berhenti sejenak. Jangan klik tautan atau mengikuti instruksi di pesan.',
        'Verifikasi pengirim melalui aplikasi, nomor, atau situs resmi yang Anda cari sendiri.',
        'Jika sudah berinteraksi, simpan bukti dan buka panduan darurat.',
      ],
      avoid: ['Jangan memberikan OTP, PIN, kata sandi, nomor kartu, atau kode pemulihan.'],
      escalation: [],
      sources,
      links: linksFor('general', context),
      threat,
    };
  }

  if (intent === 'emergency') {
    return {
      intent,
      status: 'Tindakan darurat',
      tone: 'danger',
      summary: 'Kita fokus pada langkah yang paling mendesak. Jangan berkomunikasi lagi dengan pelaku dan jangan membayar biaya pemulihan apa pun.',
      why: ['Rekening, akun, atau perangkat mungkin masih dapat disalahgunakan.', 'Bukti dan kecepatan pelaporan membantu bank serta penegak hukum menelusuri kejadian.'],
      actions: [
        'Jika menyangkut uang, segera hubungi bank melalui nomor yang tercetak di kartu atau aplikasi resmi dan minta pemblokiran transaksi.',
        'Jika memasang APK, aktifkan mode pesawat dan jangan membuka aplikasi perbankan dari perangkat tersebut.',
        'Dari perangkat lain yang aman, ganti kata sandi akun utama dan keluarkan semua sesi.',
        'Simpan bukti transfer, nomor rekening, akun pelaku, waktu, dan percakapan.',
      ],
      avoid: ['Jangan menghapus percakapan atau bukti.', 'Jangan mempercayai jasa pengembalian dana atau “hacker” di media sosial.', 'Jangan membagikan OTP, PIN, atau kode pemulihan kepada siapa pun.'],
      escalation: ['Laporkan transaksi ke IASC OJK.', 'Laporkan kejahatan ke Patroli Siber Polri.', 'Laporkan rekening penerima melalui Cek Rekening Komdigi.'],
      sources,
      links,
      followUp: 'Yang sudah terjadi yang mana: transfer uang, memasang APK, memberikan OTP, atau kehilangan akses akun?',
    };
  }

  if (intent === 'education') {
    const topics = retrieveEducation(prompt);
    return {
      intent,
      status: 'Belajar dengan contoh',
      tone: 'safe',
      summary: topics[0]?.description || 'Kita bisa membahas keamanan digital dengan contoh sederhana dan langkah yang dapat langsung dipraktikkan.',
      why: topics.map((topic) => `${topic.title}: ${topic.lessons[0]?.summary || topic.description}`).slice(0, 3),
      actions: topics.flatMap((topic) => topic.lessons.map((lesson) => lesson.safe)).slice(0, 4),
      avoid: ['Jangan mempraktikkan contoh menggunakan akun, kata sandi, atau data pribadi asli.'],
      escalation: [],
      sources: [],
      links,
      followUp: 'Anda ingin penjelasan singkat, contoh kasus, atau latihan?',
    };
  }

  if (intent === 'tool') {
    return {
      intent,
      status: 'Pilih alat yang tepat',
      tone: 'neutral',
      summary: 'Gunakan alat berdasarkan bukti yang Anda miliki. Pemrosesan pesan, header email, hash berkas, dan QR memiliki tujuan yang berbeda.',
      why: ['Pesan membantu membaca pola manipulasi.', 'Header email membantu memeriksa asal pengirim.', 'Hash dan pembaca QR dapat digunakan tanpa membuka isi berbahaya.'],
      actions: ['Gunakan Analisis Pesan untuk SMS atau chat.', 'Gunakan Pemeriksa Email untuk header mentah.', 'Gunakan Hash Berkas atau Pembaca QR untuk pemeriksaan lokal.'],
      avoid: ['Hapus data pribadi yang tidak diperlukan sebelum menempelkan teks.'],
      escalation: [],
      sources: [],
      links,
      followUp: 'Bukti yang Anda punya berupa tautan, pesan, email, berkas, atau kode QR?',
    };
  }

  return {
    intent,
    status: 'Siap membantu',
    tone: 'neutral',
    summary: 'Ceritakan tautan, pesan, email, atau berkas yang membuat Anda ragu.',
    why: [],
    actions: [],
    avoid: [],
    escalation: [],
    sources: [],
    links,
    
  };
}
export function detectThreat(prompt: string): AiReply['threat'] {
  const lower = prompt.toLowerCase();
  if (/(jelaskan|apa itu|contoh|belajar|materi|latihan).{0,30}(phishing|rekayasa sosial|social engineering)/.test(lower)) return undefined;

  const situational = /(saya menerima|saya dapat|saya mendapat|dikirim|pesan ini|chat ini|email ini|ada yang|dia meminta|diminta|disuruh|mengaku|menawarkan)/.test(lower);
  const phishingSignals = [
    { match: /(https?:\/\/|www\.|bit\.ly|tinyurl|tautan|link|qr|kode qr)/, text: 'Ada tautan atau alamat yang perlu diverifikasi.' },
    { match: /(klik|login|masuk|verifikasi|konfirmasi|undangan|hadiah|apk|aplikasi)/, text: 'Ada ajakan membuka, masuk, atau mengunduh sesuatu.' },
  ].filter((item) => item.match.test(lower)).map((item) => item.text);
  const socialSignals = [
    { match: /(otp|pin|kode verifikasi|password|kata sandi|nomor kartu|cvv|token)/, text: 'Ada permintaan data rahasia atau kode keamanan.' },
    { match: /(transfer|kirim uang|saldo|rekening|bank|admin|polisi|cs|petugas)/, text: 'Ada klaim identitas atau permintaan terkait uang.' },
    { match: /(segera|mendesak|darurat|panik|ancam|rahasia|jangan beri tahu|batas waktu)/, text: 'Ada tekanan agar Anda segera bertindak.' },
  ].filter((item) => item.match.test(lower)).map((item) => item.text);

  const hasPhishing = phishingSignals.length > 0 && (situational || phishingSignals.length > 1);
  const hasSocial = socialSignals.length > 0 && (situational || socialSignals.length > 1);
  if (!hasPhishing && !hasSocial) return undefined;
  const kind = hasPhishing && hasSocial ? 'mixed' : hasPhishing ? 'phishing' : 'social_engineering';
  const signals = [...phishingSignals, ...socialSignals].slice(0, 4);
  return {
    kind,
    label: kind === 'mixed' ? 'Potensi phishing dan rekayasa sosial' : kind === 'phishing' ? 'Potensi phishing' : 'Potensi rekayasa sosial',
    confidence: signals.length >= 3 || kind === 'mixed' ? 'high' : 'medium',
    signals,
  };
}
