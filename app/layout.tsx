import type { Metadata } from 'next';
import './globals.css';
import './refine.css';
import './ui-tokens.css';
import { ServiceWorkerRegister } from './sw-register';
import { SiteFooter, SiteHeader } from './site-header';
import { ScrollToTop } from '@/components/page-navigation';
import { AiAssistant } from '@/components/ai-assistant';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL || 'https://jagawarga.cloud'),
  title: {
    default: 'JagaWarga — Periksa sebelum bertindak',
    template: '%s | JagaWarga',
  },
  description: 'Periksa tautan, pesan, berkas, dan kode QR yang mencurigakan. Pahami risikonya dengan bahasa sederhana lalu ambil langkah yang aman.',
  openGraph: {
    title: 'JagaWarga — Periksa Sebelum Bertindak',
    description: 'Security scanner & IoC lookup cepat untuk warga digital Indonesia. Cek tautan, file hash, IP, dan ancaman siber dengan aman.',
    url: 'https://jagawarga.cloud',
    siteName: 'JagaWarga',
    locale: 'id_ID',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JagaWarga — Periksa Sebelum Bertindak',
    description: 'Security scanner & IoC lookup cepat untuk warga digital Indonesia.',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>
        <a className="skip-link" href="#main-content">Lewati ke konten utama</a>
        <ServiceWorkerRegister />
        <SiteHeader />
        <div id="main-content">{children}</div>
        <ScrollToTop />
        <AiAssistant />
        <SiteFooter />
      </body>
    </html>
  );
}
