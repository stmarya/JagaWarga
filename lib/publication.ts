import { normalizeIndicator } from './analyst/indicators';

/** Never publish URL paths, queries or fragments: preview only the host. */
export function publicationIndicator(raw: string) {
  const input = normalizeIndicator(raw);
  if (input.type !== 'url') return input.value;
  return normalizeIndicator(new URL(input.value).hostname.replace(/^\[|\]$/g, '')).value;
}
