import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Periksa Sinyal Digital — JagaWarga',
  description: 'Periksa tautan, domain, IP, hash berkas, teks pesan, atau kode QR yang mencurigakan dengan privasi diutamakan.',
};

export default function ScannerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
