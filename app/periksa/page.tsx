'use client';

import { ChangeEvent, DragEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { classifySmartInput } from '@/lib/input';
import { addHistory, addXp } from '@/lib/client/storage';
import { Icon } from '@/components/icon';

type BarcodeDetectorType = new (options: { formats: string[] }) => {
  detect(source: ImageBitmap): Promise<Array<{ rawValue: string }>>;
};

const errors: Record<string, string> = {
  RATE_LIMITED: 'Terlalu banyak permintaan. Tunggu sebentar lalu coba kembali.',
  INDICATOR_UNSUPPORTED: 'Masukkan tautan, alamat, sidik jari berkas, pesan, atau header email.',
  DOMAIN_INVALID: 'Format domain belum valid.',
  URL_PROTOCOL_UNSUPPORTED: 'Gunakan URL dengan http:// atau https://.',
  URL_CREDENTIALS_NOT_ALLOWED: 'Hapus username atau kata sandi dari URL.',
  IP_NON_PUBLIC: 'IP internal tidak dapat diperiksa.',
  INVALID_INPUT: 'Input belum valid.',
};

export default function ScannerPage() {
  const router = useRouter();
  const [value, setValue] = useState('');
  const [fileName, setFileName] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [inputMode, setInputMode] = useState<'link' | 'message' | 'file' | 'qr'>('link');
  const fileInput = useRef<HTMLInputElement>(null);
  const qrInput = useRef<HTMLInputElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);
  const indicator = useMemo(() => classifySmartInput(value), [value]);
  const canSubmit = Boolean(value.trim()) && indicator.endpoint !== null && !loading;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shared = params.get('ioc') ?? [params.get('url'), params.get('text'), params.get('title')].filter(Boolean).join('\n').trim();
    if (shared) {
      setValue(shared);
      const classified = classifySmartInput(shared);
      setInputMode(classified.endpoint === 'lookup' ? 'link' : 'message');
      window.setTimeout(() => document.getElementById('scanner')?.scrollIntoView({ behavior: 'smooth' }), 50);
    }
  }, []);

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
      setNotice('Gambar ini tidak terbaca sebagai kode QR. Jika ini tangkapan layar pesan penipuan, salin teks pesannya ke kolom pemeriksaan agar isi pesan dapat dianalisis. Saat ini berkas hanya diperiksa melalui hash.');
    }
    const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
    setValue([...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join(''));
  }

  async function pasteClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) {
        setNotice('Clipboard kosong. Salin tautan atau pesan terlebih dahulu.');
        return;
      }
      setValue(text);
      setFileName('');
      setNotice('Berhasil ditempel dari clipboard.');
      setInputMode(text.includes('http') ? 'link' : 'message');
    } catch {
      setNotice('Browser belum memberi izin membaca clipboard. Tekan lama pada kolom lalu pilih Tempel.');
    }
  }

  function chooseMode(mode: 'link' | 'message' | 'file' | 'qr') {
    setInputMode(mode);
    setFileName('');
    setNotice('');
    if (mode === 'link' || mode === 'message') window.setTimeout(() => document.getElementById('indicator')?.focus(), 0);
  }

  function useExample(kind: 'link' | 'message') {
    setFileName('');
    setNotice('Contoh dimuat. Tekan “Periksa sekarang” untuk mencoba alurnya.');
    if (kind === 'link') {
      setInputMode('link');
      setValue('https://login-security.example/verify-account');
    } else {
      setInputMode('message');
      setValue('PENTING! Akun Anda akan diblokir hari ini. Klik tautan berikut dan kirim kode OTP untuk verifikasi.');
    }
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
      const indicatorPayload = indicator.normalized ?? value;
      const body = indicator.endpoint === 'message'
        ? { text: value }
        : indicator.endpoint === 'email-header'
          ? { headers: value }
          : { indicator: indicatorPayload };
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
    <main className="scanner-page" aria-labelledby="scanner-title">
      <section className="scanner-intro">
        <p className="kicker">PUSAT CEK DIGITAL</p>
        <h1 id="scanner-title">Masukkan.<br /><span>Periksa.</span><br />Pahami.</h1>
        <p>Tempel sesuatu yang mencurigakan. Kami tampilkan keputusan singkat lebih dulu, lalu bukti teknis jika Anda membutuhkannya.</p>
        <ul>
          <li>Berkas asli tidak diunggah</li>
          <li>Berkas diperiksa sebagai sidik jari digital</li>
          <li>Hasil dapat dibandingkan dengan pemeriksaan warga lain</li>
        </ul>
      </section>

      <section className="scanner-card" id="scanner">
        <div className="scanner-card-head">
          <span>CHECKPOINT / 01</span>
          <span className="system-ok">● PRIVASI DIUTAMAKAN</span>
        </div>
        <div className="scanner-card-body">
          <p className="step-label">LANGKAH 1 DARI 3 · MASUKKAN INDIKATOR</p>
          <h2>Apa yang ingin diperiksa?</h2>
          <p className="muted">Pilih jenisnya atau langsung tempel. Kami akan mengenali jenisnya otomatis.</p>
          <div className="intake-tabs" role="tablist" aria-label="Jenis pemeriksaan">
            <button id="tab-link" type="button" role="tab" aria-controls="scanner-panel" aria-selected={inputMode === 'link'} onClick={() => chooseMode('link')}><Icon name="link" /> <span>Tautan atau alamat</span></button>
            <button id="tab-message" type="button" role="tab" aria-controls="scanner-panel" aria-selected={inputMode === 'message'} onClick={() => chooseMode('message')}><Icon name="message" /> <span>Pesan mencurigakan</span></button>
            <button id="tab-file" type="button" role="tab" aria-controls="scanner-panel" aria-selected={inputMode === 'file'} onClick={() => chooseMode('file')}><Icon name="file" /> <span>Berkas atau aplikasi</span></button>
            <button id="tab-qr" type="button" role="tab" aria-controls="scanner-panel" aria-selected={inputMode === 'qr'} onClick={() => chooseMode('qr')}><Icon name="qr" /> <span>Kode QR</span></button>
          </div>
          <form id="scanner-panel" role="tabpanel" tabIndex={0} aria-label="Area input pemeriksaan" onSubmit={submit} onDrop={dropFile} onDragOver={(event) => event.preventDefault()}>
            {(inputMode === 'link' || inputMode === 'message') && <>
              <label htmlFor="indicator">{inputMode === 'message' ? 'Tempel isi pesan yang ingin dianalisis' : 'Tempel tautan, domain, IP, atau sidik jari berkas'}</label>
              {inputMode === 'message' ? <textarea
                id="indicator"
                value={value}
                onChange={(event) => { setValue(event.target.value); setFileName(''); }}
                placeholder="Tempel isi SMS, WhatsApp, email, atau chat mencurigakan…"
                rows={6}
                autoComplete="off"
                spellCheck="false"
              /> : <input
                id="indicator"
                className="ioc-input"
                value={value}
                onChange={(event) => { setValue(event.target.value); setFileName(''); }}
                placeholder="https://contoh.id, domain, IP, atau sidik jari berkas"
                autoComplete="off"
                spellCheck="false"
              />}
              <div className="input-helpers">
                <button className="clipboard-action" type="button" onClick={pasteClipboard}><Icon name="clipboard" /> Tempel</button>
                <button type="button" onClick={() => useExample(inputMode)}><Icon name="spark" /> Coba contoh</button>
              </div>
            </>}

            {inputMode === 'file' && <div className="upload-choice">
              <Icon name="upload" size={32} />
              <strong>{fileName || 'Pilih berkas untuk dihitung hash-nya'}</strong>
              <p>APK, dokumen, arsip, dan berkas lain diproses lokal. Isi berkas tidak diunggah.</p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <button type="button" onClick={() => fileInput.current?.click()}><Icon name="file" /> {fileName ? 'Ganti berkas' : 'Pilih berkas'}</button>
                <button type="button" className="secondary-action" onClick={() => chooseMode('link')}><Icon name="hash" /> Tempel teks hash</button>
              </div>
              <input ref={fileInput} type="file" onChange={selectFile} hidden />
            </div>}

            {inputMode === 'qr' && <div className="upload-choice">
              <Icon name="qr" size={32} />
              <strong>{fileName || 'Pindai kode QR dengan aman'}</strong>
              <p>Pilih gambar yang sudah ada atau gunakan kamera perangkat. Tujuan QR tidak dibuka otomatis.</p>
              <div className="qr-actions">
                <button type="button" onClick={() => qrInput.current?.click()}><Icon name="file" /> Pilih gambar</button>
                <button type="button" className="secondary-action" onClick={() => cameraInput.current?.click()}><Icon name="camera" /> Gunakan kamera</button>
              </div>
              <input ref={qrInput} type="file" accept="image/*" onChange={selectFile} hidden />
              <input ref={cameraInput} type="file" accept="image/*" capture="environment" onChange={selectFile} hidden />
            </div>}

            <div className="scanner-actions">
              <span className="scanner-privacy"><Icon name="shield" /> Diproses dengan data minimal</span>
              <button type="submit" disabled={!canSubmit}>{loading ? 'Memeriksa…' : <>Periksa risikonya <Icon name="arrow" /></>}</button>
            </div>
            <div className="input-status" aria-live="polite">
              <span>TERDETEKSI: <strong>{indicator.label}</strong>{fileName ? ` · ${fileName}` : ''}</span>
              <span>Privasi: berkas asli tidak diunggah</span>
            </div>
          </form>
          {notice && <div className="inline-alert" role="status">{notice}</div>}
        </div>
      </section>

      <section className="flow-strip" aria-label="Alur pemeriksaan">
        <div><strong>01</strong><span>Masukkan indikator</span></div>
        <div><strong>02</strong><span>Pahami hasil umum</span></div>
        <div><strong>03</strong><span>Buka bukti teknis</span></div>
      </section>
    </main>
  );
}

