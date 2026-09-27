import type { Metadata } from 'next';
import './globals.css';
import { ServiceWorkerRegister } from './sw-register';

export const metadata: Metadata = {
  title: 'JagaWarga — Cek sebelum klik',
  description: 'Security lookup dan awareness untuk pengguna awam.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body><ServiceWorkerRegister />{children}</body>
    </html>
  );
}
