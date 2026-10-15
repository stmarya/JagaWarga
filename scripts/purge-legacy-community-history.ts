import { runtimeRedis } from '../lib/runtime/redis';
// Run from the source checkout with an operator-approved Redis configuration.
const keys = ['jagawarga:community-history:v1', 'jagawarga:community-history:v1:order'];
async function main() {
  const redis = await runtimeRedis();
  if (!redis) { console.log('No distributed Redis backend configured. No remote data changed.'); return; }
  try {
    if (!process.argv.includes('--confirm')) {
      console.log(`Dry run: ${await redis.exists(keys)} legacy keys present. No raw indicators read. Use --confirm only after operator approval.`);
      return;
    }
    const removed = await redis.unlink(keys);
    console.log(`Unlinked ${removed} legacy history keys. v2 publications were not touched.`);
  } finally { await redis.quit(); }
}
main().catch(() => { console.error('Legacy cleanup failed; check operator Redis configuration.'); process.exit(1); });
