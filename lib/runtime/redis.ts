import { createClient, type RedisClientType } from 'redis';

let clientPromise: Promise<RedisClientType> | undefined;

export function runtimeTopology(env: NodeJS.ProcessEnv = process.env) {
  const topology = env.RUNTIME_TOPOLOGY?.trim() || 'single';
  if (topology !== 'single' && topology !== 'distributed') {
    throw new Error('RUNTIME_TOPOLOGY_INVALID');
  }
  if (topology === 'distributed' && !env.REDIS_URL?.trim()) {
    throw new Error('REDIS_URL_REQUIRED');
  }
  return topology;
}

export async function runtimeRedis(): Promise<RedisClientType | null> {
  if (runtimeTopology() === 'single') return null;
  if (!clientPromise) {
    const client = createClient({
      url: process.env.REDIS_URL,
      socket: {
        connectTimeout: 2_000,
        reconnectStrategy: (retries) => Math.min(100 * 2 ** retries, 2_000),
      },
    });
    client.on('error', (error) => {
      console.error(JSON.stringify({
        level: 'error',
        event: 'redis_error',
        at: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'unknown',
      }));
    });
    clientPromise = client.connect().then(() => client as RedisClientType).catch((error) => {
      clientPromise = undefined;
      throw error;
    });
  }
  return clientPromise;
}

export async function runtimeStateHealth() {
  const topology = runtimeTopology();
  if (topology === 'single') return { topology, status: 'ok' as const, backend: 'memory' as const };
  try {
    const redis = await runtimeRedis();
    if (!redis || await redis.ping() !== 'PONG') throw new Error('REDIS_PING_FAILED');
    return { topology, status: 'ok' as const, backend: 'redis' as const };
  } catch (error) {
    return {
      topology,
      status: 'failed' as const,
      backend: 'redis' as const,
      reason: error instanceof Error ? error.message : 'REDIS_UNAVAILABLE',
    };
  }
}