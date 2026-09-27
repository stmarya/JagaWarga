import type { MetadataRoute } from 'next';
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'JagaWarga',
    short_name: 'JagaWarga',
    description: 'Cek sebelum klik — security lookup dan awareness.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f6f8f3',
    theme_color: '#14231d',
    lang: 'id',
    icons: [
      { src: '/icons/jagawarga-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/jagawarga-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/jagawarga-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}