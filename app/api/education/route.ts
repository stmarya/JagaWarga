import { NextResponse } from 'next/server';
import { getEducationTopic, listEducationTopics } from '@/lib/education-store';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get('slug');
  if (!slug) return NextResponse.json(await listEducationTopics(), { headers: { 'Cache-Control': 'public, max-age=300' } });
  const topic = await getEducationTopic(slug);
  if (!topic) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  return NextResponse.json(topic, { headers: { 'Cache-Control': 'public, max-age=300' } });
}