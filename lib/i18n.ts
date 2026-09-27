export const messages = {
  id: { checkBeforeClick: 'Cek sebelum klik', insufficientData: 'Belum ada cukup data' },
  en: { checkBeforeClick: 'Check before you click', insufficientData: 'Not enough data yet' },
} as const;
export type Locale = keyof typeof messages;
export function resolveLocale(value?: string | null): Locale {
  return value?.toLowerCase().startsWith('en') ? 'en' : 'id';
}