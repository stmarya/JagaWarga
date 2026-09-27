'use client';

import { FormEvent, useMemo, useState } from 'react';
import { classifyInput } from '@/lib/input';

type LookupResult = {
  verdict: 'high-risk' | 'suspicious' | 'no-indication' | 'insufficient-data';
  confidence: 'low' | 'medium' | 'high';
  indicator: { type: string; displayValue: string };
  partial: boolean;
  cached: boolean;
  evidence: Array<{ provider: string; reasonCodes: string[] }>;
  policy: { existingLookupOnly: boolean; submissionOccurred: boolean };
};

export default function Home() {
  const [value, setValue] = useState('');
  const [notice, setNotice] = useState('');
  const [result, setResult] = useState<LookupResult | null>(null);
  const [loading, setLoading] = useState(false);
  const indicator = useMemo(() => classifyInput(value), [value]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setNotice('');
    setResult(null);
    setLoading(true);
    try {
      const response = await fetch('/api/lookups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ indicator: value }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'LOOKUP_FAILED');
      setResult(data);
    } catch {
      setNotice('Input tidak dapat diperiksa. Pastikan format benar dan bukan alamat jaringan internal.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <nav><span className="brand">🛡️ JagaWarga</span><a href="#prinsip">Cara kerja</a></nav>
      <section className="hero">
        <p className="eyebrow">SECURITY LOOKUP & AWARENESS</p>
        <h1>Ada link mencurigakan?<br />Cek sebelum klik.</h1>
        <p className="lead">Periksa URL, domain, IP, atau hash—lalu pahami risikonya dengan bahasa sederhana.</p>
        <form onSubmit={submit}>
          <label htmlFor="indicator">Masukkan objek yang ingin diperiksa</label>
          <div className="search">
            <input id="indicator" value={value} onChange={(event) => setValue(event.target.value)} placeholder="https://contoh.id atau alamat IP" autoComplete="off" />
            <button type="submit" disabled={!value.trim() || loading}>
              {loading ? 'Memeriksa…' : 'Periksa'}
            </button>
          </div>
          <small>Terdeteksi: <strong>{indicator.label}</strong>. Pilot hanya memakai metadata dan hasil yang sudah tersedia.</small>
        </form>
        {notice && <div className="notice" role="status">{notice}</div>}
        {result && (
          <section className="result" aria-live="polite">
            <p className="eyebrow">HASIL PEMERIKSAAN</p>
            <h2>{result.verdict === 'insufficient-data' ? 'Belum ada cukup data' : result.verdict}</h2>
            <p>Ini bukan berarti aman. Belum ada provider produksi yang dikonfigurasi pada tahap ini.</p>
            {result.partial && <p className="warning">Sebagian sumber tidak tersedia. Hasil tetap ditampilkan sebagai data parsial.</p>}
            <dl>
              <div><dt>Jenis</dt><dd>{result.indicator.type}</dd></div>
              <div><dt>Confidence</dt><dd>{result.confidence}</dd></div>
              <div><dt>Submission</dt><dd>{result.policy.submissionOccurred ? 'Terjadi' : 'Tidak dilakukan'}</dd></div>
            </dl>
            <details>
              <summary>Sumber pemeriksaan</summary>
              <ul>
                {result.evidence.map((item) => (
                  <li key={item.provider}><strong>{item.provider}</strong>: {item.reasonCodes.join(', ')}</li>
                ))}
              </ul>
              <p>{result.cached ? 'Hasil berasal dari cache sementara.' : 'Hasil diperiksa langsung pada metadata provider.'}</p>
            </details>
            <strong>Tindakan aman:</strong>
            <p>Jangan buka objek yang meragukan. Verifikasi pengirim melalui kanal lain yang sudah Anda kenal.</p>
          </section>
        )}
      </section>
      <section id="prinsip" className="cards">
        <article><span>1</span><h2>Cek</h2><p>Kami mengenali jenis input tanpa langsung mengirimkannya ke pihak ketiga.</p></article>
        <article><span>2</span><h2>Pahami</h2><p>Hasil menampilkan alasan, sumber, freshness, dan tingkat keyakinan.</p></article>
        <article><span>3</span><h2>Bertindak</h2><p>Dapatkan langkah aman berikutnya—bukan sekadar skor teknis.</p></article>
      </section>
      <footer>Belum ada indikasi berbahaya bukan berarti 100% aman.</footer>
    </main>
  );
}
