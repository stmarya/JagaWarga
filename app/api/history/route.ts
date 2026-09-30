import { NextResponse } from 'next/server';
import { addCommunityComment, getCommunityHistory, saveCommunityHistory } from '@/lib/community-history';
import { clientKey, rateLimit } from '@/lib/runtime/rate-limit';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get('id') ?? undefined;
  const data = id ? await getCommunityHistory(id) : await getCommunityHistory();
  if (id && !data) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: Request) {
  const limit = await rateLimit(`history:${clientKey(request)}`, 30);
  if (!limit.allowed) return NextResponse.json({ error: 'RATE_LIMITED' }, { status: 429 });
  const body = await request.json().catch(() => null);
  const result = body?.result;
  if (!result?.indicator?.displayValue || typeof result.checkedAt !== 'string') {
    return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 });
  }
  const item = await saveCommunityHistory({
    indicator: {
      type: String(result.indicator.type).slice(0, 32),
      displayValue: String(result.indicator.displayValue).slice(0, 2_048),
    },
    verdict: String(result.verdict).slice(0, 32),
    risk: Number(result.risk) || 0,
    confidence: String(result.confidence).slice(0, 32),
    checkedAt: result.checkedAt,
    result,
  });
  return NextResponse.json(item, { status: 201, headers: { 'Cache-Control': 'no-store' } });
}

export async function PATCH(request: Request) {
  const limit = await rateLimit(`comment:${clientKey(request)}`, 20);
  if (!limit.allowed) return NextResponse.json({ error: 'RATE_LIMITED' }, { status: 429 });
  const body = await request.json().catch(() => null);
  if (typeof body?.id !== 'string' || typeof body?.message !== 'string' || !body.message.trim()) {
    return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 });
  }
  const item = await addCommunityComment(body.id, body.message);
  if (!item) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  return NextResponse.json(item, { headers: { 'Cache-Control': 'no-store' } });
}