'use client';
import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { Icon } from '@/components/icon';

type Result = { risk: number; verdict: string; reasonCodes: string[]; authentication: Record<string, string>; requestId: string };
const sample = `From: "Layanan Akun" <security@example.com>
Reply-To: helpdesk@different.example
Authentication-Results: mx.example; spf=fail; dkim=fail; dmarc=fail
Received: from unknown.example (192.0.2.10) by mx.example`;

export default function EmailHeaderTool() {
  const [headers, setHeaders] = useState(''); const [result, setResult] = useState<Result | null>(null); const [error, setError] = useState('');
  async function submit(event: FormEvent) { event.preventDefault(); setError(''); const response = await fetch('/api/analyze/email-header', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ headers }) }); const data = await response.json(); if (response.ok) setResult(data); else { setResult(null); setError('Header belum dapat diperiksa. Pastikan Anda menyalin bagian header lengkap.'); } }
  return <main className="compact-page tool-workspace">
    <Link className="back-link" href="/tools">← Semua alat</Link>
    <header className="tool-hero"><span><Icon name="email" size={30} /></span><div><p className="kicker">PEMERIKSAAN EMAIL</p><h1>Apakah email ini benar-benar dari pengirimnya?</h1><p>Tempel header email. Kami memeriksa tanda tangan dan jalur pengiriman—isi email tidak disimpan.</p></div></header>
    <div className="tool-layout"><section className="tool-form-card"><div className="tool-card-heading"><h2>Tempel header email</h2><button className="sample-button" type="button" onClick={() => setHeaders(sample)}><Icon name="spark" /> Gunakan contoh</button></div><form onSubmit={submit}><label htmlFor="headers">Header biasanya berisi From, Reply-To, Received, SPF, DKIM, dan DMARC</label><textarea id="headers" value={headers} onChange={(e) => setHeaders(e.target.value)} maxLength={50_000} rows={12} placeholder="Tempel header lengkap di sini…" /><button disabled={!headers.trim()}>Periksa email <Icon name="arrow" /></button></form>{error && <p className="inline-alert" role="alert">{error}</p>}</section>
      <aside className="tool-guide"><h2>Cara mengambil header</h2><ol><li><strong>Gmail:</strong> buka email → menu tiga titik → Tampilkan asli.</li><li><strong>Outlook:</strong> buka detail pesan → View source.</li><li>Salin teks header, bukan isi pesan.</li></ol><div className="guide-note"><Icon name="privacy" /><p>Hapus alamat pribadi yang tidak diperlukan sebelum menempel.</p></div></aside></div>
    {result && <section className="tool-result"><div className="tool-result-score"><strong>{result.risk}</strong><span>/100</span></div><div><p className="kicker">HASIL PEMERIKSAAN</p><h2>{result.risk >= 70 ? 'Pengirim sangat mencurigakan' : result.risk >= 40 ? 'Perlu verifikasi ulang' : 'Belum ada kegagalan kuat'}</h2><div className="auth-grid">{Object.entries(result.authentication).map(([key, value]) => <article key={key}><span>{key.toUpperCase()}</span><strong>{value}</strong></article>)}</div></div></section>}
  </main>;
}