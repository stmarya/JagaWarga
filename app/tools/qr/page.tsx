'use client';
import Link from 'next/link';
import { ChangeEvent, useState } from 'react';

type BarcodeDetectorType = new (options: { formats: string[] }) => { detect(source: ImageBitmap): Promise<Array<{ rawValue: string }>> };

export default function QrTool() {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  async function select(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const Detector = (window as unknown as { BarcodeDetector?: BarcodeDetectorType }).BarcodeDetector;
    if (!Detector) { setError('Browser ini belum mendukung pembacaan QR lokal.'); return; }
    const codes = await new Detector({ formats: ['qr_code'] }).detect(await createImageBitmap(file));
    setValue(codes[0]?.rawValue ?? '');
    if (!codes.length) setError('QR tidak ditemukan.');
  }
  return <main className="page"><Link href="/tools">← Semua alat</Link><p className="eyebrow">QR AMAN</p><h1>Lihat tujuan tanpa membukanya.</h1><section className="panel"><label htmlFor="qr">Pilih gambar QR</label><input id="qr" type="file" accept="image/*" onChange={select} /><p>Gambar diproses di browser. Target tidak dibuka otomatis.</p>{value && <textarea readOnly value={value} aria-label="Isi QR" />}{error && <p role="alert">{error}</p>}</section></main>;
}