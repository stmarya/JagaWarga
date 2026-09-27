export class CircuitBreaker {
  private failures = 0;
  private openedAt = 0;
  constructor(private readonly threshold = 3, private readonly resetMs = 30_000) {}

  canRun() {
    if (!this.openedAt) return true;
    if (Date.now() - this.openedAt >= this.resetMs) {
      this.failures = 0;
      this.openedAt = 0;
      return true;
    }
    return false;
  }
  success() { this.failures = 0; this.openedAt = 0; }
  failure() {
    this.failures += 1;
    if (this.failures >= this.threshold) this.openedAt = Date.now();
  }
}