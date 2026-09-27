type Usage = { count: number; day: string };
const usage = new Map<string, Usage>();

export function consumeBudget(provider: string, dailyLimit = 1_000) {
  const day = new Date().toISOString().slice(0, 10);
  const current = usage.get(provider);
  if (!current || current.day !== day) {
    usage.set(provider, { count: 1, day });
    return true;
  }
  if (current.count >= dailyLimit) return false;
  current.count += 1;
  return true;
}