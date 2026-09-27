import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';

export function requestId(request: Request) {
  const supplied = request.headers.get('x-request-id');
  return supplied && /^[a-zA-Z0-9._-]{1,64}$/.test(supplied) ? supplied : randomUUID();
}

export async function jsonBody<T extends object>(request: Request, maxBytes: number): Promise<T> {
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
    throw new Error('CONTENT_TYPE_REQUIRED');
  }
  const declared = Number(request.headers.get('content-length') ?? 0);
  if (declared > maxBytes) throw new Error('PAYLOAD_TOO_LARGE');
  const raw = await request.text();
  if (Buffer.byteLength(raw) > maxBytes) throw new Error('PAYLOAD_TOO_LARGE');
  try {
    const value = JSON.parse(raw);
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error();
    return value as T;
  } catch {
    throw new Error('INVALID_JSON');
  }
}

export function apiError(code: string, status: number, id: string) {
  return NextResponse.json({ error: code, requestId: id }, {
    status,
    headers: { 'Cache-Control': 'no-store', 'X-Request-ID': id },
  });
}

export function errorStatus(code: string) {
  if (code === 'PAYLOAD_TOO_LARGE') return 413;
  if (code === 'CONTENT_TYPE_REQUIRED') return 415;
  if (code.startsWith('PROVIDER_')) return 502;
  return 400;
}