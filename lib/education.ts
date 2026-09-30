export type Lesson = {
  title: string;
  summary: string;
  safe: string;
  risky: string;
};

export type Topic = {
  slug: string;
  icon: string;
  title: string;
  description: string;
  badge: string;
  lessons: Lesson[];
};

export const educationTopics: Topic[] = [
  {
    slug: 'phishing', icon: '🎣', title: 'Phishing & Rekayasa Sosial', badge: 'Pemburu Phishing',
    description: 'Kenali manipulasi yang memancing klik, data, atau uang.',
    lessons: [
      { title: 'Tanda pesan palsu', summary: 'Urgensi, ancaman, hadiah, dan sapaan generik sering dipakai untuk menekan korban.', safe: 'Berhenti dan periksa konteks sebelum bertindak.', risky: 'Mengikuti instruksi karena takut akun diblokir.' },
      { title: 'Tautan menyamar', summary: 'Teks tautan dapat berbeda dari alamat tujuan sebenarnya.', safe: 'Periksa domain lengkap dan ejaannya.', risky: 'Menilai tautan hanya dari logo atau warna.' },
      { title: 'Impersonasi', summary: 'Pelaku meniru atasan, bank, kurir, teman, atau petugas pemerintah.', safe: 'Konfirmasi lewat nomor atau kanal resmi yang dicari sendiri.', risky: 'Membalas melalui kontak yang diberikan pesan.' },
      { title: 'Permintaan rahasia', summary: 'Pihak resmi tidak meminta kata sandi, PIN, atau OTP melalui chat.', safe: 'Tolak dan laporkan permintaan OTP.', risky: 'Memberi kode karena penelepon tahu nama kita.' },
      { title: 'Respons insiden', summary: 'Tindakan cepat membatasi dampak setelah terlanjur klik.', safe: 'Putuskan sesi, ganti sandi, aktifkan MFA, dan lapor.', risky: 'Diam karena malu atau takut.' },
    ],
  },
  {
    slug: 'password', icon: '🔐', title: 'Kata Sandi & Passkey', badge: 'Penjaga Kredensial',
    description: 'Bangun kebiasaan autentikasi yang tahan pembobolan.',
    lessons: [
      { title: 'Unik untuk setiap akun', summary: 'Sandi yang digunakan ulang membuat satu kebocoran membuka banyak akun.', safe: 'Gunakan sandi unik untuk setiap layanan.', risky: 'Mengganti satu angka pada sandi yang sama.' },
      { title: 'Panjang lebih penting', summary: 'Frasa sandi panjang lebih sulit ditebak daripada sandi pendek yang rumit.', safe: 'Gunakan frasa panjang dan acak.', risky: 'Mengandalkan nama dan tanggal lahir.' },
      { title: 'Password manager', summary: 'Pengelola sandi membuat dan menyimpan kredensial unik secara terenkripsi.', safe: 'Gunakan password manager tepercaya.', risky: 'Menyimpan sandi di chat atau catatan publik.' },
      { title: 'Passkey', summary: 'Passkey tahan phishing karena terikat pada situs dan perangkat.', safe: 'Pilih passkey bila tersedia.', risky: 'Menyetujui login passkey yang tidak dimulai sendiri.' },
      { title: 'Pemulihan akun', summary: 'Email dan kode pemulihan adalah kunci utama akun.', safe: 'Amankan email pemulihan dan simpan kode cadangan offline.', risky: 'Membagikan kode pemulihan kepada petugas palsu.' },
    ],
  },
  {
    slug: 'mfa', icon: '🛡️', title: 'MFA & Keamanan Akun', badge: 'Benteng MFA',
    description: 'Tambahkan lapisan pertahanan dan kenali serangan persetujuan.',
    lessons: [
      { title: 'Jenis MFA', summary: 'Aplikasi autentikator dan security key umumnya lebih kuat daripada SMS.', safe: 'Pilih security key atau authenticator.', risky: 'Menonaktifkan MFA demi kenyamanan.' },
      { title: 'MFA fatigue', summary: 'Notifikasi berulang dapat menjadi upaya membuat korban menekan setuju.', safe: 'Tolak notifikasi login yang tidak dikenal.', risky: 'Menyetujui agar notifikasi berhenti.' },
      { title: 'Kode sekali pakai', summary: 'OTP tetap rahasia dan hanya dimasukkan pada aplikasi resmi.', safe: 'Masukkan OTP hanya pada proses yang dimulai sendiri.', risky: 'Membacakan OTP kepada penelepon.' },
      { title: 'Sesi aktif', summary: 'Sesi lama pada perangkat lain dapat mempertahankan akses penyerang.', safe: 'Tinjau dan keluarkan sesi asing.', risky: 'Mengabaikan daftar perangkat aktif.' },
      { title: 'Peringatan login', summary: 'Notifikasi login memberi kesempatan merespons lebih awal.', safe: 'Aktifkan alert dan periksa lokasi/perangkat.', risky: 'Menganggap semua alert sebagai spam.' },
    ],
  },
  {
    slug: 'device', icon: '💻', title: 'Keamanan Perangkat', badge: 'Perisai Perangkat',
    description: 'Lindungi laptop dan ponsel dari akses, malware, dan kehilangan.',
    lessons: [
      { title: 'Pembaruan', summary: 'Patch menutup celah yang diketahui dan sering dieksploitasi.', safe: 'Aktifkan pembaruan otomatis.', risky: 'Menunda patch keamanan tanpa alasan.' },
      { title: 'Kunci layar', summary: 'PIN kuat dan biometrik membatasi akses fisik.', safe: 'Gunakan auto-lock singkat dan PIN kuat.', risky: 'Membiarkan perangkat terbuka di tempat umum.' },
      { title: 'Aplikasi resmi', summary: 'Aplikasi dari sumber tidak resmi dapat disisipi malware.', safe: 'Unduh dari toko atau situs resmi.', risky: 'Memasang APK dari tautan chat.' },
      { title: 'Izin aplikasi', summary: 'Izin kamera, kontak, lokasi, dan mikrofon harus sesuai fungsi.', safe: 'Cabut izin yang tidak diperlukan.', risky: 'Menyetujui semua izin secara otomatis.' },
      { title: 'Hilang atau dicuri', summary: 'Enkripsi dan remote wipe mengurangi dampak kehilangan.', safe: 'Aktifkan pelacakan, enkripsi, dan hapus jarak jauh.', risky: 'Menunggu berhari-hari sebelum mengamankan akun.' },
    ],
  },
  {
    slug: 'network', icon: '📶', title: 'Wi-Fi & Jaringan Aman', badge: 'Navigator Jaringan',
    description: 'Gunakan jaringan publik tanpa membuka data sensitif.',
    lessons: [
      { title: 'Wi-Fi palsu', summary: 'Nama hotspot dapat ditiru untuk menjebak pengguna.', safe: 'Konfirmasi nama jaringan kepada pengelola.', risky: 'Memilih hotspot terkuat dengan nama mirip.' },
      { title: 'HTTPS', summary: 'HTTPS melindungi koneksi, tetapi bukan jaminan situs dapat dipercaya.', safe: 'Periksa HTTPS sekaligus domain.', risky: 'Menganggap ikon gembok berarti pasti aman.' },
      { title: 'Aktivitas sensitif', summary: 'Transaksi penting lebih aman lewat jaringan yang dikendalikan.', safe: 'Gunakan data seluler untuk transaksi sensitif.', risky: 'Internet banking di Wi-Fi publik terbuka.' },
      { title: 'Berbagi koneksi', summary: 'Hotspot pribadi perlu sandi kuat dan harus dimatikan setelah digunakan.', safe: 'Gunakan sandi unik dan batasi perangkat.', risky: 'Membiarkan hotspot tanpa sandi.' },
      { title: 'Router rumah', summary: 'Router adalah gerbang semua perangkat di rumah.', safe: 'Ganti sandi admin dan perbarui firmware.', risky: 'Memakai kredensial admin bawaan.' },
    ],
  },
  {
    slug: 'privacy', icon: '🕵️', title: 'Privasi & Data Pribadi', badge: 'Wali Privasi',
    description: 'Kurangi data yang terekspos dan pahami jejak digital.',
    lessons: [
      { title: 'Data sensitif', summary: 'NIK, alamat, biometrik, kesehatan, dan finansial membutuhkan perlindungan ekstra.', safe: 'Bagikan hanya data yang benar-benar diperlukan.', risky: 'Mengirim foto identitas tanpa watermark dan tujuan.' },
      { title: 'Jejak digital', summary: 'Unggahan dapat disalin meski sudah dihapus.', safe: 'Pikirkan audiens dan dampak jangka panjang.', risky: 'Mengunggah tiket yang menampilkan barcode.' },
      { title: 'Pengaturan privasi', summary: 'Default aplikasi sering lebih terbuka daripada kebutuhan pengguna.', safe: 'Tinjau audiens, lokasi, dan pencarian akun.', risky: 'Membiarkan profil publik tanpa pemeriksaan.' },
      { title: 'Minimisasi data', summary: 'Data yang tidak dikumpulkan tidak dapat bocor dari penyimpanan kita.', safe: 'Hapus data lama dan batasi formulir.', risky: 'Mengumpulkan semua data untuk berjaga-jaga.' },
      { title: 'Persetujuan', summary: 'Persetujuan harus jelas, spesifik, dan dapat ditarik.', safe: 'Baca tujuan sebelum memberi izin.', risky: 'Menyetujui akses permanen tanpa kebutuhan.' },
    ],
  },
  {
    slug: 'malware', icon: '🦠', title: 'Malware & File Berbahaya', badge: 'Penganalisis File',
    description: 'Periksa file, ekstensi, makro, dan sumber unduhan.',
    lessons: [
      { title: 'Ekstensi file', summary: 'Ikon dapat dipalsukan; ekstensi menunjukkan tipe sebenarnya.', safe: 'Tampilkan ekstensi dan periksa nama ganda.', risky: 'Membuka invoice.pdf.exe karena ikonnya PDF.' },
      { title: 'Dokumen bermakro', summary: 'Makro dapat menjalankan kode berbahaya.', safe: 'Biarkan makro nonaktif kecuali sumber terverifikasi.', risky: 'Menekan Enable Content untuk melihat dokumen.' },
      { title: 'Arsip dan sandi', summary: 'Arsip bersandi sering dipakai untuk menghindari pemindaian email.', safe: 'Konfirmasi kiriman arsip tak terduga.', risky: 'Membuka arsip hanya karena ada sandinya.' },
      { title: 'Pemindaian hash', summary: 'Hash dapat dicek tanpa mengunggah isi file.', safe: 'Bandingkan hash dengan sumber reputasi.', risky: 'Menganggap hasil nol deteksi sebagai jaminan.' },
      { title: 'Jika terinfeksi', summary: 'Isolasi mencegah malware menyebar ke jaringan dan akun lain.', safe: 'Putuskan jaringan dan minta bantuan resmi.', risky: 'Tetap memakai perangkat untuk login penting.' },
    ],
  },
  {
    slug: 'transaction', icon: '💳', title: 'Transaksi & Penipuan Digital', badge: 'Penjaga Transaksi',
    description: 'Cegah transfer palsu, QR berbahaya, dan manipulasi pembayaran.',
    lessons: [
      { title: 'Verifikasi penerima', summary: 'Nama, nomor, dan tujuan transaksi harus diperiksa sebelum konfirmasi.', safe: 'Cocokkan penerima dan nominal.', risky: 'Transfer karena bukti chat terlihat meyakinkan.' },
      { title: 'QR pembayaran', summary: 'Stiker QR dapat ditimpa atau diarahkan ke penerima lain.', safe: 'Periksa nama merchant sebelum membayar.', risky: 'Memindai QR tanpa melihat penerima.' },
      { title: 'Bukti transfer palsu', summary: 'Gambar bukti mudah diedit dan bukan bukti dana masuk.', safe: 'Periksa mutasi pada aplikasi resmi.', risky: 'Mengirim barang berdasarkan screenshot.' },
      { title: 'Remote access', summary: 'Aplikasi kendali jarak jauh memberi pelaku akses ke layar dan transaksi.', safe: 'Tolak instalasi aplikasi remote dari penelepon.', risky: 'Berbagi layar saat membuka aplikasi bank.' },
      { title: 'Salah transfer', summary: 'Penipu dapat meminta pengembalian ke rekening berbeda.', safe: 'Koordinasikan melalui bank resmi.', risky: 'Mengirim ulang ke rekening yang disebut penelepon.' },
    ],
  },
  {
    slug: 'work', icon: '🏢', title: 'Keamanan Kerja & Kolaborasi', badge: 'Rekan Kerja Aman',
    description: 'Lindungi data tim di email, cloud, rapat, dan perangkat kerja.',
    lessons: [
      { title: 'Klasifikasi data', summary: 'Label membantu menentukan siapa yang boleh melihat dan membagikan data.', safe: 'Ikuti label publik, internal, rahasia.', risky: 'Mengirim data rahasia melalui kanal publik.' },
      { title: 'Berbagi cloud', summary: 'Tautan “siapa pun” dapat menyebar di luar tujuan awal.', safe: 'Bagikan ke akun tertentu dan beri masa berlaku.', risky: 'Menggunakan public link untuk dokumen sensitif.' },
      { title: 'BEC', summary: 'Business Email Compromise meniru pimpinan atau vendor untuk mengubah pembayaran.', safe: 'Verifikasi perubahan rekening lewat kanal kedua.', risky: 'Menaati email mendesak tanpa konfirmasi.' },
      { title: 'Rapat daring', summary: 'Tautan dan rekaman rapat dapat memuat informasi sensitif.', safe: 'Gunakan ruang tunggu dan batasi rekaman.', risky: 'Membagikan tautan rapat di media sosial.' },
      { title: 'Pelaporan', summary: 'Pelaporan cepat membantu tim memblokir ancaman bagi pengguna lain.', safe: 'Laporkan segera dengan bukti yang aman.', risky: 'Menghapus pesan lalu tidak memberi tahu siapa pun.' },
    ],
  },
  {
    slug: 'ai-misinformation', icon: '🤖', title: 'AI, Deepfake & Misinformasi', badge: 'Verifikator Digital',
    description: 'Verifikasi konten sintetis, klaim viral, dan identitas digital.',
    lessons: [
      { title: 'Deepfake suara', summary: 'Suara orang dikenal dapat ditiru untuk meminta uang atau rahasia.', safe: 'Gunakan pertanyaan atau kode keluarga.', risky: 'Transfer hanya karena suara terdengar sama.' },
      { title: 'Gambar sintetis', summary: 'Gambar AI dapat terlihat realistis dan dipakai sebagai bukti palsu.', safe: 'Cari sumber asli dan konteks publikasi.', risky: 'Percaya karena gambar tampak profesional.' },
      { title: 'Klaim viral', summary: 'Popularitas dan banyaknya share bukan bukti kebenaran.', safe: 'Bandingkan dengan beberapa sumber tepercaya.', risky: 'Meneruskan pesan agar orang lain waspada.' },
      { title: 'Akun tiruan', summary: 'Foto, nama, dan gaya bahasa dapat disalin.', safe: 'Periksa riwayat akun dan kanal resmi.', risky: 'Percaya hanya karena foto profil benar.' },
      { title: 'Data ke AI', summary: 'Input ke layanan AI dapat tersimpan atau dipakai sesuai kebijakan layanan.', safe: 'Anonimkan data dan ikuti kebijakan organisasi.', risky: 'Menempelkan rahasia atau data pelanggan ke AI publik.' },
    ],
  },
];

export function topicQuestions(topic: Topic) {
  return topic.lessons.flatMap((lesson) => [
    {
      prompt: `Untuk materi “${lesson.title}”, tindakan mana yang paling aman?`,
      options: [lesson.safe, lesson.risky],
      answer: 0,
      explanation: lesson.summary,
    },
    {
      prompt: `Perilaku mana yang perlu dihindari pada “${lesson.title}”?`,
      options: [lesson.safe, lesson.risky],
      answer: 1,
      explanation: `Hindari: ${lesson.risky}`,
    },
  ]);
}