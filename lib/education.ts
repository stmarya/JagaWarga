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
    title: 'Jangan Pasang Aplikasi dari Chat',
    badge: 'Penangkal APK',
    description: 'Kenali pesan palsu yang mengajak Anda memasang aplikasi dan cara mengamankan akun setelahnya.',
    lessons: [
      {
        title: 'Aplikasi dari Chat Bisa Berbahaya',
        summary: 'Penipu mengirim berkas aplikasi Android berekstensi .apk dengan nama palsu seperti "Surat Undangan Pernikahan.apk", "Foto Paket J&T.apk", atau "Surat Tilang ETLE.apk" agar korban penasaran.',
        safe: 'Jangan pasang aplikasi dari chat. Periksa informasi tilang atau paket melalui aplikasi dan situs resmi.',
        risky: 'Mengklik dan memasang berkas berekstensi .apk hanya karena foto profil pengirim meyakinkan.',
      },
      {
        title: 'Waspadai Izin yang Tidak Wajar',
        summary: 'Begitu terpasang, aplikasi meminta izin "Akses Notifikasi" dan "Membaca SMS". Ini dipakai untuk meneruskan kode OTP bank korban langsung ke Telegram penipu.',
        safe: 'Batalkan seketika jika aplikasi meminta izin membaca SMS, notifikasi, atau aksesibilitas yang tidak masuk akal.',
        risky: 'Menekan "Izinkan" pada semua permintaan izin aplikasi tanpa membaca.',
      },
      {
        title: 'Jangan Percaya Foto Profil Saja',
        summary: 'Pesan penipuan sering kali dikirim oleh nomor ponsel acak yang memasang logo resmi ekspedisi atau instansi kepolisian.',
        safe: 'Verifikasi nomor melalui aplikasi identifikasi nomor atau cek situs resmi sebelum merespons.',
        risky: 'Mempercayai pesan hanya karena tampilan foto profil WhatsApp memasang logo instansi.',
      },
      {
        title: 'Jika Terlanjur Memasang Aplikasi',
        summary: 'Kecepatan reaksi menentukan keselamatan saldo rekening Anda sebelum pelaku sempat mengeksekusi transfer.',
        safe: 'Aktifkan Mode Pesawat, putuskan Wi-Fi, lalu amankan akun dari perangkat lain yang bersih.',
        risky: 'Membiarkan ponsel tetap terhubung ke internet sambil panik bertanya pada penipu.',
      },
      {
        title: 'Amankan Akun Bank dan Dompet Digital',
        summary: 'Setelah perangkat diamankan, segera ganti kredensial akses dari perangkat lain yang bersih.',
        safe: 'Hubungi bank dari nomor resmi di aplikasi atau situsnya, lalu ganti PIN dari perangkat lain yang bersih.',
        risky: 'Membuka aplikasi aplikasi bank di ponsel yang masih terinfeksi malware.',
      },
    ],
  },
  {
    slug: 'phishing',
    title: 'Kenali Bank atau CS Palsu',
    badge: 'Pemburu Phishing',
    description: 'Kenali pesan yang menekan Anda agar mengisi data, mengirim OTP, atau membuka tautan.',
    lessons: [
      {
        title: 'Pesan Tarif yang Membuat Panik',
        summary: 'Modus populer: Penipu menyebar surat palsu "Perubahan Tarif Transaksi Menjadi Rp 150.000/Bulan" agar nasabah panik dan mengeklik formulir pembatalan.',
        safe: 'Abaikan dan periksa pengumuman resmi di situs atau aplikasi resmi perbankan Anda.',
        risky: 'Mengeklik tautan formulir keberatan yang meminta nomor kartu, PIN, atau kode OTP.',
      },
      {
        title: 'Pastikan Anda Menghubungi CS Resmi',
        summary: 'Banyak penipu memakai akun WhatsApp bisnis dengan tanda centang hijau tiruan yang hanya berupa emoji pada foto profil.',
        safe: 'Cari nomor CS dari aplikasi atau situs resmi. Jangan hanya mengandalkan foto profil atau gambar lencana.',
        risky: 'Menghubungi nomor layanan pelanggan yang didapat dari kolom komentar media sosial atau hasil pencarian umum.',
      },
      {
        title: 'Jangan Berikan OTP atau Kode Kartu',
        summary: 'Tiga digit CVV di belakang kartu debit/kredit dan kode SMS OTP adalah kunci brankas digital Anda.',
        safe: 'Tolak tegas siapa pun yang meminta kode OTP atau CVV. Karyawan bank asli tidak pernah meminta data ini.',
        risky: 'Membacakan angka OTP kepada penelepon yang mengaku dari tim verifikasi bank.',
      },
      {
        title: 'Waspadai Alamat Situs yang Mirip',
        summary: 'Pelaku membuat alamat web tiruan seperti "klik-bca-verifikasi.top" atau "login-bri-indonesia.xyz" yang meniru persis tampilan bank.',
        safe: 'Ketik alamat bank secara manual di address bar atau simpan di bookmark peramban terpercaya.',
        risky: 'Memasukkan kredensial login internet banking dari tautan yang dikirim melalui chat.',
      },
      {
        title: 'Laporkan dan Blokir Kontak',
        summary: 'Melaporkan kontak membantu melindungi ribuan warga lain dari jeratan modus yang sama.',
        safe: 'Gunakan fitur "Laporkan & Blokir" dan pilih kanal pelaporan resmi yang masih berlaku.',
        risky: 'Membalas atau mendebat penipu yang justru membuktikan bahwa nomor Anda aktif.',
      },
    ],
  },
  {
    slug: 'transaction',
    title: 'Periksa Penerima Sebelum Membayar',
    badge: 'Penjaga Transaksi',
    description: 'Kenali QR palsu, transfer mencurigakan, dan tawaran kerja yang meminta uang.',
    lessons: [
      {
        title: 'Periksa Nama Penerima QRIS',
        summary: 'Penipuan QR: Penipu menempel stiker QRIS palsu di kotak amal masjid, meja restoran, atau gerai pembayaran umum.',
        safe: 'Selalu cocokkan nama penerima di layar ponsel dengan nama toko/pengelola sebelum menekan bayar.',
        risky: 'Langsung memasukkan PIN pembayaran tanpa melihat nama penerima yang muncul di layar.',
      },
      {
        title: 'Jika Menerima Transfer Tak Dikenal',
        summary: 'Rekening tiba-tiba menerima dana misterius, lalu ada pihak debt collector yang menagih bunga pemerasan selangit.',
        safe: 'Jangan gunakan uang tersebut. Hubungi bank dan kanal resmi pengaduan untuk meminta arahan.',
        risky: 'Menuruti perintah penagih untuk mentransfer dana ke nomor rekening pribadi yang berbeda.',
      },
      {
        title: 'Tawaran Kerja yang Meminta Deposit',
        summary: 'Korban diundang ke grup chat untuk tugas like video YouTube atau review Google Maps dengan imbalan puluhan ribu.',
        safe: 'Tolak penawaran kerja yang meminta Anda menyetor (deposit) uang untuk membuka level komisi berikutnya.',
        risky: 'Mentransfer dana tabungan karena tergiur imbal hasil instan yang dijanjikan di grup.',
      },
      {
        title: 'Jangan Percaya Screenshot Transfer',
        summary: 'Penipu membuat struk bukti transfer aplikasi bank palsu dengan aplikasi editor untuk mengelabui pedagang online.',
        safe: 'Wajib periksa mutasi rekening masuk di aplikasi bank Anda sebelum menyerahkan barang dagangan.',
        risky: 'Mengirim barang hanya berpatokan pada tangkapan layar (screenshot) bukti transfer pembeli.',
      },
      {
        title: 'Jika Terlanjur Mentransfer Uang',
        summary: 'Bila Anda tidak sengaja mentransfer uang ke penipu, setiap menit sangat berharga untuk penghentian aliran dana.',
        safe: 'Hubungi bank melalui kanal resmi dan siapkan bukti chat, transaksi, serta nomor laporan bila sudah memilikinya.',
        risky: 'Berharap penipu berbelas kasihan dan mengembalikan uang secara sukarela.',
      },
    ],
  },
  {
    slug: 'password',
    title: 'Buat Akun Lebih Sulit Dibobol',
    badge: 'Penjaga Kredensial',
    description: 'Pelajari cara membuat sandi unik, menyimpan sandi, dan memakai passkey.',
    lessons: [
      {
        title: 'Gunakan Sandi Berbeda',
        summary: 'Sandi yang digunakan ulang membuat satu kebocoran data di situs e-commerce dapat membuka email dan aplikasi bank Anda.',
        safe: 'Gunakan sandi unik dan berbeda untuk setiap layanan penting.',
        risky: 'Menggunakan satu kata sandi yang sama di semua aplikasi dengan hanya mengganti satu angka di belakang.',
      },
      {
        title: 'Buat Sandi yang Panjang',
        summary: 'Kombinasi kata acak sepanjang 16-20 karakter jauh lebih tahan terhadap serangan tebakan otomatis dibanding sandi pendek rumit.',
        safe: 'Gunakan pengelola sandi untuk membuat frasa yang panjang dan acak. Jangan menyalin contoh dari materi ini.',
        risky: 'Menggunakan nama anak, tanggal lahir, atau plat kendaraan.',
      },
      {
        title: 'Gunakan Pengelola Sandi',
        summary: 'Pengelola sandi mengenkripsi kredensial Anda dan mengisikannya otomatis hanya pada alamat situs yang sah.',
        safe: 'Gunakan pengelola sandi terpercaya (seperti Bitwarden, 1Password, atau bawaan iOS/Google).',
        risky: 'Menyimpan daftar sandi di catatan HP yang tidak terkunci atau di pesan WhatsApp.',
      },
      {
        title: 'Coba Passkey',
        summary: 'Passkey memakai kriptografi kunci publik yang terhubung ke pengaman perangkat dan dirancang lebih tahan terhadap phishing.',
        safe: 'Aktifkan passkey pada akun Google, Apple, dan WhatsApp bila telah didukung.',
        risky: 'Menyetujui permintaan pembuatan atau aktivasi passkey yang tidak Anda mulai sendiri.',
      },
      {
        title: 'Simpan Kode Pemulihan',
        summary: 'Kode cadangan offline (kode pemulihan) adalah penyelamat saat nomor telepon Anda hilang atau tidak mendapat sinyal SMS.',
        safe: 'Cetak atau simpan kode pemulihan di tempat fisik yang aman di rumah.',
        risky: 'Mengunggah tangkapan layar kode cadangan ke status media sosial atau cloud publik.',
      },
    ],
  },
  {
    slug: 'mfa',
    title: 'Tambahkan Pintu Kedua untuk Akun',
    badge: 'Benteng MFA',
    description: 'Pelajari cara menolak login asing dan menambah pengaman akun.',
    lessons: [
      {
        title: 'Pilih Pengaman Selain SMS',
        summary: 'SMS rentan terhadap penyadapan dan penggantian SIM ilegal (penggantian kartu SIM). Aplikasi autentikator menghasilkan kode lokal tanpa pulsa/sinyal.',
        safe: 'Gunakan Google Authenticator, Microsoft Authenticator, atau Aegis untuk akun email dan finansial.',
        risky: 'Mengandalkan SMS semata untuk seluruh akun penting tanpa pengamanan tambahan.',
      },
      {
        title: 'Jangan Setujui Login Asing',
        summary: 'Pelaku yang mengetahui sandi Anda sengaja memicu puluhan notifikasi persetujuan masuk agar Anda merasa terganggu dan menekan "Ya".',
        safe: 'Tolak notifikasi dan segera ganti kata sandi akun jika mendapati permintaan login berulang.',
        risky: 'Menekan "Setuju / Approve" hanya agar ponsel berhenti bergetar.',
      },
      {
        title: 'Periksa Perangkat yang Masih Login',
        summary: 'Bila pernah login di warnet, kantor, atau HP orang lain, sesi tersebut mungkin masih dapat diakses orang asing.',
        safe: 'Periksa menu "Perangkat Tertaut" di WhatsApp dan Google secara rutin, lalu tekan "Keluar dari semua sesi".',
        risky: 'Membiarkan daftar perangkat asing bertengger di riwayat login tanpa pernah diperiksa.',
      },
      {
        title: 'Tanggapi Peringatan Login',
        summary: 'Email notifikasi "Login baru terdeteksi dari perangkat tidak dikenal" adalah sinyal darurat pertama.',
        safe: 'Segera buka aplikasi resmi dan kunci akses akun bila Anda tidak mengenali aktivitas tersebut.',
        risky: 'Mengabaikan peringatan keamanan karena mengira itu hanya pesan otomatis biasa.',
      },
      {
        title: 'Jaga Nomor yang Terhubung ke Bank',
        summary: 'Nomor telepon yang terhubung ke perbankan harus dijaga ketat agar tidak hangus dan didaur ulang operator ke orang lain.',
        safe: 'Pastikan masa aktif nomor selalu diperpanjang dan segera perbarui data di bank jika nomor berganti.',
        risky: 'Membiarkan nomor lama yang mati tetap terhubung ke akun aplikasi bank.',
      },
    ],
  },
  {
    slug: 'privacy',
    title: 'Bagikan Data Pribadi Hanya Saat Perlu',
    badge: 'Wali Privasi',
    description: 'Lindungi KTP, nomor telepon, foto, dan informasi keluarga dari penyalahgunaan.',
    lessons: [
      {
        title: 'Beri Tanda pada Foto Identitas',
        summary: 'Foto KTP polosan sering diperjualbelikan penipu untuk pengajuan pinjaman online ilegal atau pembukaan rekening penampung.',
        safe: 'Selalu beri tulisan watermark melintang di atas KTP (contoh: "VERIFIKASI INDIHOME 30-09-2026").',
        risky: 'Mengirimkan foto KTP dan selfie tanpa keterangan tujuan spesifik penggunaan.',
      },
      {
        title: 'Pikirkan Sebelum Membagikan Data',
        summary: 'Tren media sosial seperti kuis "Siapa nama gadis ibu kandungmu?", "Plat motormu", atau foto tiket konser sering dipakai pelaku manipulasi sosial.',
        safe: 'Saring informasi pribadi sebelum diunggah. Jaga barcode tiket dan data keluarga tetap rahasia.',
        risky: 'Mengunggah boarding pass pesawat atau tiket konser yang memperlihatkan kode QR/Barcode.',
      },
      {
        title: 'Berikan Izin Hanya Jika Perlu',
        summary: 'Aplikasi berbahaya memanfaatkan izin daftar kontak HP untuk meneror keluarga korban saat melakukan pemerasan.',
        safe: 'Tolak izin akses Kontak dan Galeri jika tidak relevan dengan fungsi inti aplikasi.',
        risky: 'Memberikan izin akses buku kontak ke aplikasi senter, kalkulator, atau game kasual.',
      },
      {
        title: 'Bersihkan Akun Lama',
        summary: 'Akun e-commerce atau forum lawas yang tidak terpakai sering kali menjadi sumber kebocoran data (kebocoran data).',
        safe: 'Hapus akun atau kosongkan nomor kartu kredit tersimpan di situs yang sudah tidak lagi digunakan.',
        risky: 'Membiarkan puluhan akun tidak aktif dengan kata sandi yang sama.',
      },
      {
        title: 'Kenali Hak atas Data Pribadi',
        summary: 'UU PDP memberi beberapa hak atas data pribadi, termasuk meminta penghapusan dalam kondisi tertentu. Prosedur dan pengecualiannya tetap perlu diperiksa.',
        safe: 'Baca kanal resmi pemerintah atau penyelenggara untuk mengetahui cara meminta akses, perbaikan, atau penghapusan data.',
        risky: 'Pasrah saat data pribadi disebarkan tanpa persetujuan Anda.',
      },
    ],
  },
  {
    slug: 'incident-response',
    title: 'Apa yang Dilakukan Saat Terjadi Insiden',
    badge: 'Koordinator Tanggap',
    description: 'Ikuti langkah awal untuk mengamankan akun, perangkat, dan bukti.',
    lessons: [
      {
        title: '1. Putuskan Koneksi',
        summary: 'Hentikan transmisi data agar malware tidak sempat menyedot kode verifikasi baru atau mengunci berkas.',
        safe: 'Aktifkan Mode Pesawat (Mode Pesawat) dan matikan koneksi Wi-Fi dalam hitungan detik.',
        risky: 'Tetap menyalakan internet untuk mencari tutorial di ponsel yang sedang diretas.',
      },
      {
        title: '2. Hubungi Bank dari Kanal Resmi',
        summary: 'Waktu penting untuk memberi kesempatan kepada bank menelusuri dan mencoba menahan aliran dana.',
        safe: 'Hubungi bank melalui nomor resmi yang tercantum di aplikasi atau situsnya. Minta arahan untuk mengamankan transaksi.',
        risky: 'Menunggu esok hari untuk datang ke kantor cabang bank karena jam kantor tutup.',
      },
      {
        title: '3. Simpan Bukti',
        summary: 'Bukti percakapan dan mutasi transfer mutlak dibutuhkan untuk pembuatan Surat Tanda Penerimaan Laporan (STPL) kepolisian.',
        safe: 'Ambil tangkapan layar nomor HP pelaku, bukti transfer, nomor rekening, dan isi chat sebelum penipu menghapusnya.',
        risky: 'Menghapus obrolan chat karena kesal atau takut dimarahi keluarga.',
      },
      {
        title: '4. Laporkan melalui Kanal Resmi',
        summary: 'Laporan cepat dapat membantu pihak bank dan berwenang menelusuri serta mencoba menahan aliran dana. Dana tidak selalu dapat kembali.',
        safe: 'Gunakan kanal pelaporan resmi yang sedang berlaku, lalu simpan nomor laporan dan bukti pengaduan.',
        risky: 'Membayar jasa "hacker pengembali uang" di media sosial yang sebenarnya adalah penipuan putaran kedua.',
      },
      {
        title: '5. Pulihkan Perangkat',
        summary: 'Jika ponsel terinfeksi berkas APK berbahaya, malware mungkin meninggalkan backdoor yang sulit dideteksi.',
        safe: 'Lakukan Cadangkan Data Penting (hanya foto/kontak) lalu lakukan Reset ke Setelan Pabrik (setelan pabrik).',
        risky: 'Hanya menghapus ikon aplikasi di layar utama tanpa memeriksa aplikasi sistem.',
      },
    ],
  },
];

export function topicQuestions(topic: Topic) {
  return topic.lessons.flatMap((lesson, index) => {
    const safeFirst = index % 2 === 0;
    const safeOptions = safeFirst ? [lesson.safe, lesson.risky] : [lesson.risky, lesson.safe];
    const riskyOptions = safeFirst ? [lesson.risky, lesson.safe] : [lesson.safe, lesson.risky];
    return [
      {
        prompt: `Untuk skenario “${lesson.title}”, tindakan manakah yang paling aman?`,
        options: safeOptions,
        answer: safeFirst ? 0 : 1,
        explanation: lesson.summary,
      },
      {
        prompt: `Kebiasaan manakah yang harus dihindari pada “${lesson.title}”?`,
        options: riskyOptions,
        answer: safeFirst ? 0 : 1,
        explanation: `Hindari: ${lesson.risky}`,
      },
    ];
  });
}
