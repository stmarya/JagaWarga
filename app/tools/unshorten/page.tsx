'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Icon } from '@/components/icon';

type RedirectHop = {
  url: string;
  status: number;
  location?: string;
};

type UnshortenResult = {
  originalUrl: string;
  finalUrl: string;
  finalHost: string;
  redirectCount: number;
  hops: RedirectHop[];
  isSuspicious: boolean;
  suspiciousReasons: string[];
};

export default function UnshortenPage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<UnshortenResult | null>(null);

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/tools/unshorten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Gagal memeriksa tautan singkat.');
      } else {
        setResult(data);
      }
    } catch {
      setError('Koneksi terputus. Pastikan perangkat Anda terhubung ke internet.');
    } finally {
      setLoading(false);
    }
  };

  const sampleShortUrls = [
    'bit.ly/undangan-digital-nikah',
    's.id/surat-tilang-etle',
    'tinyurl.com/paket-sicepat-kurir',
  ];

  return (
    <main className="compact-page tool-workspace">
      <Link className="back-link" href="/tools">
        ← Semua alat
      </Link>
      <header className="tool-hero">
        <span>
          <Icon name="link" size={30} />
        </span>
        <div>
          <p className="kicker">PEMERIKSA TAUTAN SINGKAT</p>
          <h1>Buka alamat asli di balik tautan singkat.</h1>
          <p>
            Ketahui alamat tujuan sebenarnya dari bit.ly, s.id, tinyurl, dan sejenisnya secara aman tanpa membuka browser atau mengunduh virus ke perangkat Anda.
          </p>
        </div>
      </header>

      <div className="tool-layout">
        <section className="tool-form-card">
          <div className="tool-card-heading">
            <h2>Masukkan Tautan Singkat</h2>
            <div className="input-helpers">
              {sampleShortUrls.map((sample) => (
                <button
                  key={sample}
                  type="button"
                  className="sample-button"
                  onClick={() => setUrl(sample)}
                >
                  {sample.split('/')[0]}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleCheck}>
            <label htmlFor="short-url-input">Tautan Pendek (URL)</label>
            <input
              id="short-url-input"
              type="text"
              className="ioc-input"
              placeholder="Contoh: bit.ly/3XYZ123 atau s.id/tilang"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={loading}
              required
            />
            <button type="submit" className="primary-action" disabled={loading || !url.trim()}>
              <Icon name="search" size={16} />
              {loading ? 'Menelusuri Pengalihan…' : 'Periksa Tujuan Asli'}
            </button>
          </form>

          {error && <p className="inline-alert" style={{ marginTop: '14px', color: '#c92d49' }}>{error}</p>}

          {result && (
            <div className="unshorten-result-card" style={{ marginTop: '20px' }}>
              <div
                className={`severity-panel ${result.isSuspicious ? 'severity-panel-high' : 'severity-panel-low'}`}
                style={{ width: '100%', minHeight: 'auto', marginBottom: '16px' }}
              >
                <span className="severity-panel-kicker">HASIL PENELUSURAN PENGALIHAN</span>
                <strong>{result.isSuspicious ? '⚠️ Tujuan Mencurigakan' : '✓ Alamat Terverifikasi'}</strong>
                <p style={{ margin: '6px 0 0', fontSize: '0.8rem', opacity: 0.9 }}>
                  {result.isSuspicious
                    ? 'Tautan ini diarahkan ke alamat yang memiliki tanda-tanda penipuan atau file berbahaya.'
                    : 'Pengalihan berjalan normal menuju domain yang terdeteksi.'}
                </p>
              </div>

              {result.suspiciousReasons.length > 0 && (
                <div className="threat-section" style={{ marginTop: '0', marginBottom: '16px' }}>
                  <div className="section-heading-simple">
                    <h2 style={{ fontSize: '1rem', color: '#c92d49' }}>Peringatan Keamanan</h2>
                  </div>
                  <ul style={{ margin: '0', paddingLeft: '20px', color: '#871a2e', fontSize: '0.85rem' }}>
                    {result.suspiciousReasons.map((reason, idx) => (
                      <li key={idx} style={{ margin: '4px 0' }}>{reason}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="hash-result">
                <span>TUJUAN AKHIR ASLI:</span>
                <code style={{ fontSize: '0.92rem', fontWeight: 700, color: '#131722' }}>{result.finalUrl}</code>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
                  <Link
                    className="primary-action"
                    href={`/?ioc=${encodeURIComponent(result.finalUrl)}#scanner`}
                  >
                    <Icon name="shield" size={16} /> Pindai di JagaWarga
                  </Link>
                  <button
                    type="button"
                    className="secondary-action"
                    onClick={() => {
                      if (navigator.clipboard) {
                        navigator.clipboard.writeText(result.finalUrl);
                        alert('Alamat tujuan berhasil disalin!');
                      }
                    }}
                  >
                    <Icon name="clipboard" size={16} /> Salin Alamat
                  </button>
                </div>
              </div>

              {result.hops.length > 1 && (
                <div style={{ marginTop: '16px', background: '#f5f6f8', padding: '14px', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#596170' }}>
                    JEJAK PENGALIHAN ({result.redirectCount} lompatan):
                  </span>
                  <ol style={{ margin: '8px 0 0', paddingLeft: '20px', fontSize: '0.78rem' }}>
                    {result.hops.map((hop, i) => (
                      <li key={i} style={{ margin: '4px 0', wordBreak: 'break-all' }}>
                        <code>{hop.url}</code> <span style={{ color: '#7c8390' }}>({hop.status})</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )}
        </section>

        <aside className="tool-guide">
          <h2>Mengapa Tautan Singkat Berbahaya?</h2>
          <ul>
            <li><strong>Menyembunyikan Nama Domain Sebenarnya</strong>: Penipu menyamarkan domain phishing tiruan (misal <code>bri-mo-update.xyz</code>) dengan tautan singkat.</li>
            <li><strong>Menghindari Pemindaian WhatsApp</strong>: Link pendek terkadang lolos dari filter spam otomatis aplikasi chat.</li>
            <li><strong>Pengalihan Ganda</strong>: Sering kali tautan diputar beberapa kali untuk menyulitkan pelacakan.</li>
          </ul>

          <div className="guide-note">
            <Icon name="alert" size={20} />
            <p>
              Jangan pernah memasukkan nomor rekening, PIN, atau mengunduh aplikasi setelah membuka tautan singkat dari nomor asing.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
