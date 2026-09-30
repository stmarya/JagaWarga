export type Lesson = {
  title: string;
  summary: string;
  safe: string;
  risky: string;
};

export type Topic = {
  slug: string;
  title: string;
  description: string;
  badge: string;
  lessons: Lesson[];
};

export const educationTopics: Topic[] = [
  {
    slug: 'safe-chat',
    title: 'Modus Berkas APK Berbahaya di WhatsApp',
    badge: 'Penangkal APK',
    description: 'Bongkar modus penipuan berkedok Surat Undangan Nikah, Tilang ETLE, dan Kurir Paket yang menyedot saldo m-Banking.',
    lessons: [
      {
        title: 'Penyamaran Berkas .APK',
        summary: 'Penipu mengirim berkas aplikasi Android berekstensi .apk dengan nama palsu seperti "Surat Undangan Pernikahan.apk", "Foto Paket J&T.apk", atau "Surat Tilang ETLE.apk" agar korban penasaran.',
        safe: 'Tolak memasang berkas chat dan hapus seketika. Surat tilang resmi dikirim via pos, dan resi kurir dicek di aplikasi resmi.',
        risky: 'Mengklik dan memasang berkas berekstensi .apk hanya karena foto profil pengirim meyakinkan.',
      },
      {
        title: 'Pencurian Izin SMS & Notifikasi',
        summary: 'Begitu terpasang, aplikasi meminta izin "Akses Notifikasi" dan "Membaca SMS". Ini dipakai untuk meneruskan kode OTP bank korban langsung ke Telegram penipu.',
        safe: 'Batalkan seketika jika aplikasi meminta izin membaca SMS, notifikasi, atau aksesibilitas yang tidak masuk akal.',
        risky: 'Menekan "Izinkan / Allow" pada semua permintaan izin aplikasi tanpa membaca.',
      },
      {
        title: 'Pengirim Bernomor Asing',
        summary: 'Pesan penipuan sering kali dikirim oleh nomor ponsel acak yang memasang logo resmi ekspedisi atau instansi kepolisian.',
        safe: 'Verifikasi nomor melalui aplikasi identifikasi nomor atau cek situs resmi sebelum merespons.',
        risky: 'Mempercayai pesan hanya karena tampilan foto profil WhatsApp memasang logo instansi.',
      },
      {
        title: 'Tindakan 5 Menit Jika Terlanjur Pasang',
        summary: 'Kecepatan reaksi menentukan keselamatan saldo rekening Anda sebelum pelaku sempat mengeksekusi transfer.',
        safe: 'Langsung hidupkan Mode Pesawat (Airplane Mode), cabut kartu SIM, lalu hapus aplikasi dari menu Pengaturan HP.',
        risky: 'Membiarkan ponsel tetap terhubung ke internet sambil panik bertanya pada penipu.',
      },
      {
        title: 'Amankan Akun Perbankan & e-Wallet',
        summary: 'Setelah perangkat diamankan, segera ganti kredensial akses dari perangkat lain yang bersih.',
        safe: 'Hubungi Call Center resmi bank Anda untuk pemblokiran sementara dan ganti PIN dari perangkat lain.',
        risky: 'Membuka aplikasi mobile banking di ponsel yang masih terinfeksi malware.',
      },
    ],
  },
  {
    slug: 'phishing',
    title: 'Phishing & Rekayasa Sosial Perbankan',
    badge: 'Pemburu Phishing',
    description: 'Kenali taktik psikologis manipulasi nasabah: pengumuman kenaikan tarif admin bank palsu dan CS abal-abal.',
    lessons: [
      {
        title: 'Urgensi Kenaikan Tarif Palsu',
        summary: 'Modus populer: Penipu menyebar surat palsu "Perubahan Tarif Transaksi Menjadi Rp 150.000/Bulan" agar nasabah panik dan mengeklik formulir pembatalan.',
        safe: 'Abaikan dan periksa pengumuman resmi di situs atau aplikasi resmi perbankan Anda.',
        risky: 'Mengeklik tautan formulir keberatan yang meminta nomor kartu, PIN, atau kode OTP.',
      },
      {
        title: 'Akun CS WhatsApp Centang Hijau Palsu',
        summary: 'Banyak penipu memakai akun WhatsApp bisnis dengan tanda centang hijau tiruan yang hanya berupa emoji pada foto profil.',
        safe: 'Pastikan lencana centang hijau asli berada di samping nama kontak, bukan bagian dari gambar foto.',
        risky: 'Menghubungi nomor layanan pelanggan yang didapat dari kolom komentar media sosial atau Google Search.',
      },
      {
        title: 'Kerahasiaan Mutlak OTP & CVV',
        summary: 'Tiga digit CVV di belakang kartu debit/kredit dan kode SMS OTP adalah kunci brankas digital Anda.',
        safe: 'Tolak tegas siapa pun yang meminta kode OTP atau CVV. Karyawan bank asli tidak pernah meminta data ini.',
        risky: 'Membacakan angka OTP kepada penelepon yang mengaku dari tim verifikasi bank.',
      },
      {
        title: 'Tautan Login Mirip (Typosquatting)',
        summary: 'Pelaku membuat alamat web tiruan seperti "klik-bca-verifikasi.top" atau "login-bri-indonesia.xyz" yang meniru persis tampilan bank.',
        safe: 'Ketik alamat bank secara manual di address bar atau simpan di bookmark peramban terpercaya.',
        risky: 'Memasukkan kredensial login internet banking dari tautan yang dikirim melalui chat.',
      },
      {
        title: 'Laporkan Nomor Penipu',
        summary: 'Melaporkan kontak membantu melindungi ribuan warga lain dari jeratan modus yang sama.',
        safe: 'Gunakan fitur "Laporkan & Blokir" di WhatsApp dan kirim aduan ke kanal CekRekening.id.',
        risky: 'Membalas atau mendebat penipu yang justru membuktikan bahwa nomor Anda aktif.',
      },
    ],
  },
  {
    slug: 'transaction',
    title: 'Transaksi Digital, QRIS Quishing & Pinjol Ilegal',
    badge: 'Penjaga Transaksi',
    description: 'Waspada stiker QRIS palsu, penipuan transfer nyasar pinjol, dan jebakan komisi kerja freelance Telegram.',
    lessons: [
      {
        title: 'Verifikasi Nama Merchant QRIS',
        summary: 'Modus Quishing: Penipu menempel stiker QRIS palsu di kotak amal masjid, meja restoran, atau gerai pembayaran umum.',
        safe: 'Selalu cocokkan Nama Merchant dan NMID di layar ponsel dengan nama toko/pengelola sebelum menekan bayar.',
        risky: 'Langsung memasukkan PIN pembayaran tanpa melihat nama penerima yang muncul di layar.',
      },
      {
        title: 'Jebakan Transfer Nyasar Pinjol Ilegal',
        summary: 'Rekening tiba-tiba menerima dana misterius, lalu ada pihak debt collector yang menagih bunga pemerasan selangit.',
        safe: 'Jangan gunakan uang tersebut. Laporkan ke bank pengirim dan Satgas PASTI OJK bahwa Anda menerima salah transfer.',
        risky: 'Menuruti perintah penagih untuk mentransfer dana ke nomor rekening pribadi yang berbeda.',
      },
      {
        title: 'Modus Komisi Kerja Lepas Telegram',
        summary: 'Korban diundang ke grup Telegram untuk tugas like video YouTube atau review Google Maps dengan imbalan puluhan ribu.',
        safe: 'Tolak penawaran kerja yang meminta Anda menyetor (deposit) uang untuk membuka level komisi berikutnya.',
        risky: 'Mentransfer dana tabungan karena tergiur imbal hasil instan yang dijanjikan di grup.',
      },
      {
        title: 'Manipulasi Bukti Transfer (Resi Palsu)',
        summary: 'Penipu membuat struk bukti transfer m-Banking palsu dengan aplikasi editor untuk mengelabui pedagang online.',
        safe: 'Wajib periksa mutasi rekening masuk di aplikasi bank Anda sebelum menyerahkan barang dagangan.',
        risky: 'Mengirim barang hanya berpatokan pada tangkapan layar (screenshot) bukti transfer pembeli.',
      },
      {
        title: 'Salah Transfer Rekening Penipu',
        summary: 'Bila Anda tidak sengaja mentransfer uang ke penipu, setiap menit sangat berharga untuk penghentian aliran dana.',
        safe: 'Segera telepon call center bank dan kunjungi kantor cabang dengan membawa bukti chat serta nomor laporan polisi.',
        risky: 'Berharap penipu berbelas kasihan dan mengembalikan uang secara sukarela.',
      },
    ],
  },
  {
    slug: 'password',
    title: 'Kata Sandi & Passkey',
    badge: 'Penjaga Kredensial',
    description: 'Bangun kebiasaan autentikasi yang tahan pembobolan dan tahan serangan pencurian data.',
    lessons: [
      {
        title: 'Sandi Unik untuk Setiap Akun',
        summary: 'Sandi yang digunakan ulang membuat satu kebocoran data di situs e-commerce dapat membuka email dan mobile banking Anda.',
        safe: 'Gunakan sandi unik dan berbeda untuk setiap layanan penting.',
        risky: 'Menggunakan satu kata sandi yang sama di semua aplikasi dengan hanya mengganti satu angka di belakang.',
      },
      {
        title: 'Frasa Sandi Panjang (Passphrase)',
        summary: 'Kombinasi kata acak sepanjang 16-20 karakter jauh lebih tahan terhadap serangan brute-force dibanding sandi pendek rumit.',
        safe: 'Pakai gabungan 4 kata bahasa Indonesia acak, contoh: "KopiSoreHari#LariPagi99".',
        risky: 'Menggunakan nama anak, tanggal lahir, atau plat kendaraan.',
      },
      {
        title: 'Aplikasi Pengelola Sandi (Password Manager)',
        summary: 'Pengelola sandi mengenkripsi kredensial Anda dan mengisikannya otomatis hanya pada alamat situs yang sah.',
        safe: 'Gunakan password manager terpercaya (seperti Bitwarden, 1Password, atau bawaan iOS/Google).',
        risky: 'Menyimpan daftar sandi di catatan HP yang tidak terkunci atau di pesan WhatsApp.',
      },
      {
        title: 'Passkey: Masa Depan Tanpa Sandi',
        summary: 'Passkey menggunakan kriptografi kunci publik yang terikat pada sidik jari / FaceID perangkat dan kebal phishing.',
        safe: 'Aktifkan passkey pada akun Google, Apple, dan WhatsApp bila telah didukung.',
        risky: 'Menyetujui permintaan pembuatan atau aktivasi passkey yang tidak Anda mulai sendiri.',
      },
      {
        title: 'Kode Pemulihan Cadangan',
        summary: 'Kode cadangan offline (Backup Codes) adalah penyelamat saat nomor telepon Anda hilang atau tidak mendapat sinyal SMS.',
        safe: 'Cetak atau simpan kode pemulihan di tempat fisik yang aman di rumah.',
        risky: 'Mengunggah tangkapan layar kode cadangan ke status media sosial atau cloud publik.',
      },
    ],
  },
  {
    slug: 'mfa',
    title: 'MFA & Autentikasi Ganda',
    badge: 'Benteng MFA',
    description: 'Kunci pintu kedua akun Anda dari serangan pembajakan nomor HP dan persetujuan paksa.',
    lessons: [
      {
        title: 'Aplikasi Autentikator vs SMS',
        summary: 'SMS rentan terhadap penyadapan dan penggantian SIM ilegal (SIM Swap). Aplikasi autentikator menghasilkan kode lokal tanpa pulsa/sinyal.',
        safe: 'Gunakan Google Authenticator, Microsoft Authenticator, atau Aegis untuk akun email dan finansial.',
        risky: 'Mengandalkan SMS semata untuk seluruh akun penting tanpa pengamanan tambahan.',
      },
      {
        title: 'Serangan MFA Fatigue (Bom Notifikasi)',
        summary: 'Pelaku yang mengetahui sandi Anda sengaja memicu puluhan notifikasi persetujuan masuk agar Anda merasa terganggu dan menekan "Ya".',
        safe: 'Tolak notifikasi dan segera ganti kata sandi akun jika mendapati permintaan login berulang.',
        risky: 'Menekan "Setuju / Approve" hanya agar ponsel berhenti bergetar.',
      },
      {
        title: 'Pemeriksaan Sesi Login Aktif',
        summary: 'Bila pernah login di warnet, kantor, atau HP orang lain, sesi tersebut mungkin masih dapat diakses orang asing.',
        safe: 'Periksa menu "Perangkat Tertaut" di WhatsApp dan Google secara rutin, lalu tekan "Keluar dari semua sesi".',
        risky: 'Membiarkan daftar perangkat asing bertengger di riwayat login tanpa pernah diperiksa.',
      },
      {
        title: 'Peringatan Masuk Perangkat Baru',
        summary: 'Email notifikasi "Login baru terdeteksi dari perangkat tidak dikenal" adalah sinyal darurat pertama.',
        safe: 'Segera buka aplikasi resmi dan kunci akses akun bila Anda tidak mengenali aktivitas tersebut.',
        risky: 'Mengabaikan peringatan keamanan karena mengira itu hanya pesan otomatis biasa.',
      },
      {
        title: 'Nomor HP Terkait Akun Perbankan',
        summary: 'Nomor telepon yang terhubung ke perbankan harus dijaga ketat agar tidak hangus dan didaur ulang operator ke orang lain.',
        safe: 'Pastikan masa aktif nomor selalu diperpanjang dan segera perbarui data di bank jika nomor berganti.',
        risky: 'Membiarkan nomor lama yang mati tetap terhubung ke akun mobile banking.',
      },
    ],
  },
  {
    slug: 'privacy',
    title: 'Privasi, NIK & Perlindungan Data Pribadi',
    badge: 'Wali Privasi',
    description: 'Cegah KTP dan foto selfie Anda disalahgunakan untuk pinjaman online tanpa sepengetahuan Anda.',
    lessons: [
      {
        title: 'Watermark pada Foto KTP / Identitas',
        summary: 'Foto KTP polosan sering diperjualbelikan penipu untuk pengajuan pinjaman online ilegal atau pembukaan rekening penampung.',
        safe: 'Selalu beri tulisan watermark melintang di atas KTP (contoh: "VERIFIKASI INDIHOME 30-09-2026").',
        risky: 'Mengirimkan foto KTP dan selfie tanpa keterangan tujuan spesifik penggunaan.',
      },
      {
        title: 'Bahaya Tren Viral Bocor Data',
        summary: 'Tren media sosial seperti kuis "Siapa nama gadis ibu kandungmu?", "Plat motormu", atau foto tiket konser sering dipakai pelaku social engineering.',
        safe: 'Saring informasi pribadi sebelum diunggah. Jaga barcode tiket dan data keluarga tetap rahasia.',
        risky: 'Mengunggah boarding pass pesawat atau tiket konser yang memperlihatkan kode QR/Barcode.',
      },
      {
        title: 'Minimisasi Izin Kontak Ponsel',
        summary: 'Aplikasi berbahaya memanfaatkan izin daftar kontak HP untuk meneror keluarga korban saat melakukan pemerasan.',
        safe: 'Tolak izin akses Kontak dan Galeri jika tidak relevan dengan fungsi inti aplikasi.',
        risky: 'Memberikan izin akses buku kontak ke aplikasi senter, kalkulator, atau game kasual.',
      },
      {
        title: 'Pembersihan Jejak Digital Akun Lama',
        summary: 'Akun e-commerce atau forum lawas yang tidak terpakai sering kali menjadi sumber kebocoran data (data breach).',
        safe: 'Hapus akun atau kosongkan nomor kartu kredit tersimpan di situs yang sudah tidak lagi digunakan.',
        risky: 'Membiarkan puluhan akun tidak aktif dengan kata sandi yang sama.',
      },
      {
        title: 'Hak Perlindungan Data Pribadi (UU PDP)',
        summary: 'Di Indonesia, UU PDP memberi hak kepada warga untuk meminta penghapusan dan menolak pemrosesan data yang tidak sah.',
        safe: 'Ketahui hak Anda dan laporkan penyelenggara sistem elektronik yang membocorkan data tanpa izin.',
        risky: 'Pasrah saat data pribadi disebarkan tanpa persetujuan Anda.',
      },
    ],
  },
  {
    slug: 'incident-response',
    title: 'Tanggap Darurat Insiden Digital (Langkah 5 Menit)',
    badge: 'Koordinator Tanggap',
    description: 'Prosedur penyelamatan darurat saat uang, akun, atau ponsel Anda sudah menjadi korban kejahatan siber.',
    lessons: [
      {
        title: 'Langkah 1: Isolasi Koneksi Seketika',
        summary: 'Hentikan transmisi data agar malware tidak sempat menyedot kode verifikasi baru atau mengunci berkas.',
        safe: 'Aktifkan Mode Pesawat (Airplane Mode) dan matikan koneksi Wi-Fi dalam hitungan detik.',
        risky: 'Tetap menyalakan internet untuk mencari tutorial di ponsel yang sedang diretas.',
      },
      {
        title: 'Langkah 2: Hubungi Call Center Resmi Bank',
        summary: 'Waktu adalah faktor paling kritis untuk menahan dana sebelum ditarik tunai oleh sindikat penipu di ATM.',
        safe: 'Telepon hotline darurat bank Anda (BCA: 1500888, Mandiri: 14000, BRI: 1500017, BNI: 1500046) dan minta blokir rekening tujuan.',
        risky: 'Menunggu esok hari untuk datang ke kantor cabang bank karena jam kantor tutup.',
      },
      {
        title: 'Langkah 3: Dokumentasikan Seluruh Bukti',
        summary: 'Bukti percakapan dan mutasi transfer mutlak dibutuhkan untuk pembuatan Surat Tanda Penerimaan Laporan (STPL) kepolisian.',
        safe: 'Ambil tangkapan layar nomor HP pelaku, bukti transfer, nomor rekening, dan isi chat sebelum penipu menghapusnya.',
        risky: 'Menghapus obrolan chat karena kesal atau takut dimarahi keluarga.',
      },
      {
        title: 'Langkah 4: Lapor ke CekRekening.id & Patroli Siber',
        summary: 'Laporan resmi membekukan rekening penipu di seluruh ekosistem perbankan nasional.',
        safe: 'Kunjungi CekRekening.id (Kemenkominfo) dan PatroliSiber.id (Polri) untuk pengaduan tindak pidana.',
        risky: 'Membayar jasa "hacker pengembali uang" di media sosial yang sebenarnya adalah penipuan putaran kedua.',
      },
      {
        title: 'Langkah 5: Pemulihan Total Perangkat',
        summary: 'Jika ponsel terinfeksi berkas APK berbahaya, malware mungkin meninggalkan backdoor yang sulit dideteksi.',
        safe: 'Lakukan Cadangkan Data Penting (hanya foto/kontak) lalu lakukan Reset ke Setelan Pabrik (Factory Reset).',
        risky: 'Hanya menghapus ikon aplikasi di layar utama tanpa memeriksa aplikasi sistem.',
      },
    ],
  },
];

export function topicQuestions(topic: Topic) {
  return topic.lessons.flatMap((lesson) => [
    {
      prompt: `Untuk skenario “${lesson.title}”, tindakan manakah yang paling aman?`,
      options: [lesson.safe, lesson.risky],
      answer: 0,
      explanation: lesson.summary,
    },
    {
      prompt: `Kebiasaan manakah yang sangat berbahaya dan harus dihindari pada “${lesson.title}”?`,
      options: [lesson.safe, lesson.risky],
      answer: 1,
      explanation: `Hindari: ${lesson.risky}`,
    },
  ]);
}