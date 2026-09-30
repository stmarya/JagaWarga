import { NextResponse } from 'next/server';
import { lookup } from 'node:dns/promises';
import { isPublicIp } from '@/lib/security/network';

export const runtime = 'nodejs';

type RedirectHop = {
  url: string;
  status: number;
  location?: string;
};

async function checkHostIsPublic(hostname: string): Promise<boolean> {
  try {
    const addresses = await lookup(hostname, { all: true });
    if (!addresses.length) return false;
    return addresses.every((a) => isPublicIp(a.address));
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let target = String(body?.url ?? '').trim();

    if (!target) {
      return NextResponse.json({ error: 'URL_REQUIRED', message: 'Tautan harus diisi.' }, { status: 400 });
    }

    if (!/^https?:\/\//i.test(target)) {
      target = `https://${target}`;
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(target);
    } catch {
      return NextResponse.json({ error: 'INVALID_URL', message: 'Format tautan tidak valid.' }, { status: 400 });
    }

    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return NextResponse.json({ error: 'PROTOCOL_UNSUPPORTED', message: 'Hanya protokol HTTP dan HTTPS yang didukung.' }, { status: 400 });
    }

    // SSRF validation
    const isPublic = await checkHostIsPublic(parsedUrl.hostname);
    if (!isPublic) {
      return NextResponse.json({ error: 'IP_NOT_ALLOWED', message: 'Alamat IP tujuan berada di jaringan internal/pribadi.' }, { status: 400 });
    }

    const hops: RedirectHop[] = [];
    let currentUrl = target;
    const maxRedirects = 6;
    let redirectCount = 0;

    while (redirectCount < maxRedirects) {
      redirectCount++;
      const currentParsed = new URL(currentUrl);

      // Verify host is public on every hop
      const hostPublic = await checkHostIsPublic(currentParsed.hostname);
      if (!hostPublic) {
        hops.push({ url: currentUrl, status: 403, location: 'BLOCKED_PRIVATE_IP' });
        break;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      try {
        const res = await fetch(currentUrl, {
          method: 'GET',
          redirect: 'manual',
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 JagaWarga-Unshortener/1.0',
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
        });
        clearTimeout(timeoutId);

        const status = res.status;
        const locationHeader = res.headers.get('location');

        hops.push({
          url: currentUrl,
          status,
          location: locationHeader || undefined,
        });

        if (status >= 300 && status < 400 && locationHeader) {
          // Resolve relative or absolute redirect URL
          const resolved = new URL(locationHeader, currentUrl).href;
          currentUrl = resolved;
        } else {
          // Final destination reached
          break;
        }
      } catch (fetchErr) {
        clearTimeout(timeoutId);
        hops.push({
          url: currentUrl,
          status: 0,
          location: fetchErr instanceof Error ? fetchErr.message : 'FAILED_FETCH',
        });
        break;
      }
    }

    const finalUrl = hops[hops.length - 1]?.url || target;
    const finalHost = new URL(finalUrl).hostname;

    // Check for suspicious heuristics
    const suspiciousIndicators: string[] = [];
    const lowerFinal = finalUrl.toLowerCase();
    const suspiciousTlds = ['.xyz', '.top', '.click', '.cam', '.cfd', '.quest', '.zip', '.mov', '.sbs', '.rest'];
    if (suspiciousTlds.some((tld) => finalHost.endsWith(tld))) {
      suspiciousIndicators.push(`Domain menggunakan ekstensi berisiko tinggi (${suspiciousTlds.find((tld) => finalHost.endsWith(tld))})`);
    }

    if (lowerFinal.includes('.apk')) {
      suspiciousIndicators.push('Tautan mengarah langsung ke pengunduhan file Android (.apk)');
    }

    const bankingKeywords = ['bca', 'bri', 'mandiri', 'bni', 'dana', 'ovo', 'gopay', 'klikbca', 'brimo', 'livin'];
    const matchesBank = bankingKeywords.filter((k) => lowerFinal.includes(k));
    const officialDomains = ['bca.co.id', 'bri.co.id', 'bankmandiri.co.id', 'bni.co.id', 'dana.id', 'ovo.id', 'gojek.com'];
    if (matchesBank.length > 0 && !officialDomains.some((d) => finalHost.endsWith(d))) {
      suspiciousIndicators.push(`Meniru kata kunci perbankan/finansial ("${matchesBank.join(', ')}") tetapi bukan domain resmi`);
    }

    return NextResponse.json({
      originalUrl: target,
      finalUrl,
      finalHost,
      redirectCount: hops.length - 1,
      hops,
      isSuspicious: suspiciousIndicators.length > 0,
      suspiciousReasons: suspiciousIndicators,
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: err instanceof Error ? err.message : 'Gagal memeriksa tautan' },
      { status: 500 },
    );
  }
}
