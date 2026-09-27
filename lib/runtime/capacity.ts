export const CAPACITY_LIMITS = {
  lookupConcurrencyPerReplica: 4,
  lookupMaxPendingPerReplica: 100,
  lookupRequestsPerClientPerMinute: 30,
  providerRequestsPerDay: 1_000,
  providerTimeoutMs: 5_000,
  providerRetryAttempts: 2,
} as const;