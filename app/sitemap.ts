import type { MetadataRoute } from 'next';
const paths = ['', '/tools', '/dashboard', '/status', '/ops', '/launch-readiness', '/privacy', '/methodology', '/transparency', '/emergency', '/support'];
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.APP_URL ?? 'https://jagawarga.example';
  return paths.map((path) => ({ url: `${base}${path}`, lastModified: new Date(), changeFrequency: 'weekly' }));
}