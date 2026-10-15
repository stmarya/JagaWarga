import { NextResponse } from 'next/server';
import { apiError, errorStatus, jsonBody, requestId } from '@/lib/api/request';
import { COMMUNITY_TTL_SECONDS, deleteCommunityHistory, getCommunityHistory, saveCommunityHistory } from '@/lib/community-history';
import { clientKey, rateLimit } from '@/lib/runtime/rate-limit';
import { featureFlags } from '@/lib/runtime/features';
import { performLookup } from '@/lib/lookup';
import { publicationIndicator } from '@/lib/publication';
import { readSnapshot } from '@/lib/analyst/snapshot';

export const runtime = 'nodejs';
const headers = () => ({ 'Cache-Control': 'no-store', 'X-Community-Enabled': String(featureFlags().communityReporting), 'X-Community-Retention-Seconds': String(COMMUNITY_TTL_SECONDS) });
export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get('id') ?? undefined;
  if (!featureFlags().communityReporting) return id
    ? apiError('NOT_FOUND', 404, requestId(request)) : NextResponse.json([], { headers: headers() });
  try {
    const data = id ? await getCommunityHistory(id) : await getCommunityHistory();
    if (id && !data) return apiError('NOT_FOUND', 404, requestId(request));
    return NextResponse.json(data, { headers: headers() });
  } catch { return apiError('HISTORY_UNAVAILABLE', 503, requestId(request)); }
}
export async function POST(request: Request) {
  const id = requestId(request);
  if (!featureFlags().communityReporting) return apiError('COMMUNITY_DISABLED', 403, id);
  try {
    if (!(await rateLimit(`history:${clientKey(request)}`, 5)).allowed) return apiError('RATE_LIMITED', 429, id);
    const body = await jsonBody<{ indicator?: unknown; consent?: unknown }>(request, 4096);
    if (body.consent !== true) return apiError('CONSENT_REQUIRED', 400, id);
    if (typeof body.indicator !== 'string') return apiError('INVALID_INPUT', 400, id);
    let indicator: string;
    try { indicator = publicationIndicator(body.indicator); }
    catch { return apiError('INVALID_PUBLIC_INDICATOR', 400, id); }
    // Do not trust a client-supplied score, timestamp, or evidence payload.
    const result = readSnapshot({ ...(await performLookup(indicator)), requestId: id });
    const saved = await saveCommunityHistory(result);
    return NextResponse.json(saved, { status: 201, headers: headers() });
  } catch (error) {
    const code = error instanceof Error ? error.message : 'HISTORY_UNAVAILABLE';
    const known = ['PAYLOAD_TOO_LARGE', 'CONTENT_TYPE_REQUIRED', 'INVALID_JSON'];
    return apiError(known.includes(code) ? code : 'PUBLICATION_FAILED', known.includes(code) ? errorStatus(code) : 503, id);
  }
}
export async function DELETE(request: Request) {
  const id = requestId(request);
  try {
    if (!(await rateLimit(`history-delete:${clientKey(request)}`, 20)).allowed) return apiError('RATE_LIMITED', 429, id);
    const body = await jsonBody<{ id?: unknown; deletionToken?: unknown }>(request, 1024);
    if (typeof body.id !== 'string' || typeof body.deletionToken !== 'string') return apiError('INVALID_INPUT', 400, id);
    // Deletion remains available if publication is subsequently disabled.
    if (!await deleteCommunityHistory(body.id, body.deletionToken)) return apiError('NOT_FOUND_OR_NOT_AUTHORIZED', 404, id);
    return NextResponse.json({ deleted: true }, { headers: headers() });
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    const known = ['PAYLOAD_TOO_LARGE', 'CONTENT_TYPE_REQUIRED', 'INVALID_JSON'];
    return apiError(known.includes(code) ? code : 'DELETION_FAILED', known.includes(code) ? errorStatus(code) : 503, id);
  }
}
// Free-text public comments remain deferred, rather than persisting raw content.
export async function PATCH(request: Request) { return apiError('COMMENTING_DISABLED', 403, requestId(request)); }
