export class BoundedQueue {
  private active = 0;
  private readonly pending: Array<() => void> = [];
  constructor(private readonly concurrency = 4, private readonly maxPending = 100) {}

  snapshot() {
    return {
      active: this.active,
      pending: this.pending.length,
      concurrency: this.concurrency,
      maxPending: this.maxPending,
    };
  }

  async run<T>(work: () => Promise<T>): Promise<T> {
    if (this.active >= this.concurrency) {
      if (this.pending.length >= this.maxPending) throw new Error('QUEUE_FULL');
      await new Promise<void>((resolve) => this.pending.push(resolve));
    }
    this.active += 1;
    try {
      return await work();
    } finally {
      this.active -= 1;
      this.pending.shift()?.();
    }
  }
}