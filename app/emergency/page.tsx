'use client';
import { useRef, useState } from 'react';
import { emergencyCases } from '@/lib/presentation/emergency';
export default function Emergency() {
  const [selected, setSelected] = useState<(typeof emergencyCases)[number] | null>(null);
  const [checked, setChecked] = useState<number[]>([]);
  const heading = useRef<HTMLHeadingElement>(null);
  const choices = useRef<HTMLDivElement>(null);
  function choose(item: (typeof emergencyCases)[number]) {
    setSelected(item); setChecked([]);
    requestAnimationFrame(() => { heading.current?.focus({ preventScroll: true }); heading.current?.scrollIntoView({ block: 'start', behavior: 'instant' }); });
  }
  return <main className="compact-page batch-page emergency-v2">
    <header className="batch-heading"><p className="batch-eyebrow">PERTOLONGAN PERTAMA DIGITAL</p><h1>Amankan yang paling mendesak.</h1><p>Anda tidak perlu menyelesaikan semuanya sekaligus. Pilih kejadian, lalu lakukan tindakan pertama.</p></header>
    <aside className="batch-alert emergency-money"><strong>Uang sudah terkirim?</strong><p>Hubungi bank/e-wallet dari kanal resmi sekarang. Jangan menunggu hasil scanner.</p><button className="batch-secondary" onClick={() => choose(emergencyCases[2])}>Buka langkah transaksi</button></aside>
    <div className="emergency-v2-layout">
      <section aria-labelledby="emergency-choices-title"><h2 id="emergency-choices-title">Apa yang terjadi?</h2><div ref={choices} className="emergency-v2-choices">{emergencyCases.map((item) => <button key={item.id} type="button" aria-pressed={selected?.id === item.id} aria-controls="emergency-plan" onClick={() => choose(item)}><strong>{item.title}</strong><span>{item.prompt}</span></button>)}</div><p className="emergency-hint">Lebih dari satu kondisi dapat terjadi. Tangani uang/akses akun lebih dulu, lalu kembali untuk kondisi lain.</p></section>
      <section id="emergency-plan" className="batch-card emergency-plan" aria-labelledby="emergency-plan-title">
        {!selected ? <><h2 id="emergency-plan-title">Pilih kondisi Anda</h2><p>Langkah yang sesuai akan muncul di sini. JagaWarga tidak memblokir rekening atau memulihkan akun secara langsung.</p></> : <>
          <p className="batch-eyebrow">LAKUKAN SEKARANG</p><h2 ref={heading} tabIndex={-1} id="emergency-plan-title">{selected.title}</h2>
          <p className="emergency-first">{selected.now}</p>
          {selected.financial && <div className="batch-actions"><a className="batch-primary" href="https://iasc.ojk.go.id/" target="_blank" rel="noopener noreferrer">Lapor ke IASC OJK ↗</a></div>}
          <h3>Setelah tindakan pertama</h3><p>Tandai sebagai pengingat. Checklist hanya di memori halaman; berpindah kondisi atau memuat ulang akan menghapus tanda.</p>
          <ol className="emergency-checklist">{selected.steps.map((step, index) => <li key={step}><label><input type="checkbox" checked={checked.includes(index)} onChange={(event) => setChecked((items) => event.target.checked ? [...items, index] : items.filter((i) => i !== index))} /><span>{step}</span></label></li>)}</ol>
          <p role="status">{checked.length} dari {selected.steps.length} langkah lanjutan ditandai. Ini bukan konfirmasi bahwa insiden selesai.</p>
          <h3>Bukti yang perlu disiapkan</h3><p>{selected.evidence}</p><p>Jangan unggah bukti pribadi ke chat atau riwayat publik JagaWarga.</p>
          <button className="batch-secondary" onClick={() => { const first = choices.current?.querySelector('button'); first?.focus(); choices.current?.scrollIntoView({ block: 'start', behavior: 'instant' }); }}>Pilih kondisi lain</button>
        </>}
      </section>
    </div>
    <aside className="batch-alert"><strong>Waspadai penipuan pemulihan.</strong><p>Jangan membayar pihak yang menghubungi lebih dulu atau memberikan akses jarak jauh, sandi, PIN, OTP, dan kode pemulihan.</p></aside>
    <section className="batch-card"><h2>Kanal resmi dan batas bantuan</h2><p>JagaWarga memberi panduan awal, bukan layanan darurat, bank, kepolisian, atau jaminan pemulihan. Tautan berikut membuka layanan eksternal di tab baru.</p><ul className="emergency-source-list"><li><a href="https://iasc.ojk.go.id/" target="_blank" rel="noopener noreferrer">IASC OJK — penipuan transaksi ↗</a><p>Jalur finansial; siapkan bukti dan simpan nomor laporan. Tidak menggantikan Laporan Polisi dan tidak menjamin pengembalian dana.</p></li><li><a href="https://support.google.com/accounts/answer/6294825?hl=id" target="_blank" rel="noopener noreferrer">Google — mengamankan akun yang disusupi ↗</a></li><li><a href="https://support.google.com/accounts/answer/9924802?hl=id&amp;co=GENIE.Platform%3DAndroid" target="_blank" rel="noopener noreferrer">Google — menghapus aplikasi berbahaya di Android ↗</a></li></ul><p>Langkah pemulihan berbeda menurut layanan dan perangkat. Untuk akun lain, gunakan pusat bantuan resminya, bukan tautan dari pesan yang mencurigakan.</p></section>
  </main>;
}
