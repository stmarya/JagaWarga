import type { Metadata } from 'next';
import './globals.css';
import './refine.css';
import { ServiceWorkerRegister } from './sw-register';
import { SiteFooter, SiteHeader } from './site-header';
import { ScrollToTop } from '@/components/page-navigation';
import { AiAssistant } from '@/components/ai-assistant';

export const metadata: Metadata = {
  title: 'JagaWarga — Cek sebelum klik',
  description: 'Security lookup dan awareness untuk pengguna awam.',
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
