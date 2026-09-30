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
    share_target: {
      action: '/?share-target=1',
      method: 'GET',
      enctype: 'application/x-www-form-urlencoded',
      params: {
        title: 'title',
        text: 'text',
        url: 'url',
      },
    },
    icons: [
      { src: '/icons/jagawarga-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/jagawarga-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/jagawarga-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  } as MetadataRoute.Manifest & {
    share_target: {
      action: string;
      method: 'GET';
      enctype: string;
      params: { title: string; text: string; url: string };
    };
  };
}