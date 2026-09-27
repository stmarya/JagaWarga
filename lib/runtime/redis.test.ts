import { afterEach, describe, expect, it } from 'vitest';
import { runtimeStateHealth, runtimeTopology } from './redis';

const originalTopology = process.env.RUNTIME_TOPOLOGY;
const originalRedisUrl = process.env.REDIS_URL;

afterEach(() => {
  if (originalTopology === undefined) delete process.env.RUNTIME_TOPOLOGY;
  else process.env.RUNTIME_TOPOLOGY = originalTopology;
  if (originalRedisUrl === undefined) delete process.env.REDIS_URL;
  else process.env.REDIS_URL = originalRedisUrl;
});

describe('runtime topology', () => {
  it('uses memory for the explicit single topology', async () => {
    process.env.RUNTIME_TOPOLOGY = 'single';
    delete process.env.REDIS_URL;
    expect(runtimeTopology()).toBe('single');
    await expect(runtimeStateHealth()).resolves.toEqual({
      topology: 'single',
      status: 'ok',
      backend: 'memory',
    });
  });

  it('requires Redis for distributed topology', () => {
    process.env.RUNTIME_TOPOLOGY = 'distributed';
    delete process.env.REDIS_URL;
    expect(() => runtimeTopology()).toThrow('REDIS_URL_REQUIRED');
  });

  it('rejects an unknown topology', () => {
    process.env.RUNTIME_TOPOLOGY = 'clustered';
    expect(() => runtimeTopology()).toThrow('RUNTIME_TOPOLOGY_INVALID');
  });
});