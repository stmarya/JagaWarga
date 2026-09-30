'use client';

import { ChangeEvent, DragEvent, FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { classifySmartInput } from '@/lib/input';
import { addHistory, addXp } from '@/lib/client/storage';

type BarcodeDetectorType = new (options: { formats: string[] }) => {
  detect(source: ImageBitmap): Promise<Array<{ rawValue: string }>>;
};

const errors: Record<string, string> = {
  RATE_LIMITED: 'Terlalu banyak permintaan. Tunggu sebentar lalu coba kembali.',
  INDICATOR_UNSUPPORTED: 'Masukkan URL, domain, IP publik, hash, pesan, atau header email.',
  DOMAIN_INVALID: 'Format domain belum valid.',
  URL_PROTOCOL_UNSUPPORTED: 'Gunakan URL dengan http:// atau https://.',
  URL_CREDENTIALS_NOT_ALLOWED: 'Hapus username atau kata sandi dari URL.',
  IP_NON_PUBLIC: 'IP internal tidak dapat diperiksa.',
  INVALID_INPUT: 'Input belum valid.',
};

export default function Home() {
  const router = useRouter();
  const [value, setValue] = useState('');
  const [fileName, setFileName] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const indicator = useMemo(() => classifySmartInput(value), [value]);
  const canSubmit = Boolean(value.trim()) && indicator.endpoint !== null && !loading;

  async function ingestFile(file: File) {
    setFileName(file.name);
    setNotice('');
    if (file.type.startsWith('image/')) {
      const Detector = (window as unknown as { BarcodeDetector?: BarcodeDetectorType }).BarcodeDetector;
      if (Detector) {
        try {
          const codes = await new Detector({ formats: ['qr_code'] }).detect(await createImageBitmap(file));
          if (codes[0]?.rawValue) {
            setValue(codes[0].rawValue);
            setFileName(`QR · ${file.name}`);
            return;
          }
        } catch {
          // Gambar non-QR tetap aman diproses sebagai hash lokal.
        }
      }
    }
    const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
    setValue([...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join(''));
  }

  async function selectFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) await ingestFile(file);
  }

  async function dropFile(event: DragEvent<HTMLFormElement>) {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) await ingestFile(file);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setNotice('');
    try {
      const endpoint = indicator.endpoint === 'message'
        ? '/api/analyze/message'
        : indicator.endpoint === 'email-header'
          ? '/api/analyze/email-header'
          : '/api/lookups';
      const body = indicator.endpoint === 'message'
        ? { text: value }
        : indicator.endpoint === 'email-header'
          ? { headers: value }
          : { indicator: value };
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json().catch(() => ({ error: 'LOOKUP_FAILED' }));
      if (!response.ok) throw new Error(data.error ?? 'LOOKUP_FAILED');

      let historyId = '';
      if (endpoint === '/api/lookups') {
        const shared = await fetch('/api/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ result: data }),
        });
        if (shared.ok) historyId = (await shared.json()).id;
        addHistory({
          id: historyId || crypto.randomUUID(),
          type: data.indicator.type,
          displayValue: data.indicator.displayValue,
          verdict: data.verdict,
          checkedAt: data.checkedAt,
        });
        addXp(10);
      } else {
        addXp(15);
      }
      sessionStorage.setItem('jagawarga:last-result', JSON.stringify({ ...data, historyId, analysisKind: indicator.endpoint }));
      router.push(historyId ? `/result?id=${encodeURIComponent(historyId)}` : '/result');
    } catch (error) {
      const code = error instanceof Error ? error.message : 'LOOKUP_FAILED';
      setNotice(errors[code] ?? 'Pemeriksaan gagal. Coba kembali.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="scanner-page">
      <section className="scanner-intro">
        <p className="kicker">PUSAT CEK DIGITAL</p>
        <h1>Cek sebelum<br /><span>percaya.</span></h1>
        <p>Periksa tautan, domain, IP, hash, file, QR, pesan, atau header email. Hasil ringkas dulu, detail teknis bila Anda membutuhkannya.</p>
        <ul>
          <li>Tanpa submission otomatis</li>
          <li>File diubah menjadi hash di perangkat</li>
          <li>Hasil dapat dibandingkan dengan riwayat warga</li>
        </ul>
      </section>

      <section className="scanner-card" id="scanner">
        <div className="scanner-card-head">
          <span>CHECKPOINT / 01</span>
          <span className="system-ok">● SISTEM AKTIF</span>
        </div>
        <div className="scanner-card-body">
          <p className="step-label">LANGKAH 1 DARI 3 · MASUKKAN INDIKATOR</p>
          <h2>Apa yang ingin diperiksa?</h2>
          <p className="muted">Jenis input akan dikenali otomatis.</p>
          <form onSubmit={submit} onDrop={dropFile} onDragOver={(event) => event.preventDefault()}>
            <label htmlFor="indicator">URL, DOMAIN, IP, HASH, PESAN, ATAU HEADER EMAIL</label>
            <textarea
              id="indicator"
              value={value}
              onChange={(event) => { setValue(event.target.value); setFileName(''); }}
              placeholder="Tempel indikator di sini…"
              rows={5}
              autoComplete="off"
              spellCheck="false"
            />
            <div className="scanner-actions">
              <label className="file-action" htmlFor="indicator-file">{fileName ? 'Ganti file / QR' : 'Pilih file / QR'}</label>
              <input id="indicator-file" type="file" onChange={selectFile} hidden />
              <button type="submit" disabled={!canSubmit}>{loading ? 'Memeriksa…' : 'Periksa sekarang →'}</button>
            </div>
            <div className="input-status">
              <span>TERDETEKSI: <strong>{indicator.label}</strong>{fileName ? ` · ${fileName}` : ''}</span>
              <span>Privasi: existing lookup only</span>
            </div>
          </form>
          {notice && <div className="inline-alert" role="status">{notice}</div>}
        </div>
      </section>

      <section className="flow-strip" aria-label="Alur pemeriksaan">
        <div><strong>01</strong><span>Masukkan indikator</span></div>
        <div><strong>02</strong><span>Pahami hasil umum</span></div>
        <div><strong>03</strong><span>Buka detail VirusTotal</span></div>
      </section>
    </main>
  );
}