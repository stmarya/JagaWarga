export type RuntimeConfig = {
  nodeEnv: 'development' | 'test' | 'production';
  appVersion: string;
  imageDigest: string | null;
  existingLookupOnly: true;
};

export function runtimeConfig(env: NodeJS.ProcessEnv = process.env): RuntimeConfig {
  const nodeEnv = env.NODE_ENV?.trim() || 'development';
  if (!['development', 'test', 'production'].includes(nodeEnv)) throw new Error('ENV_NODE_ENV_INVALID');
  const appVersion = env.APP_VERSION?.trim() || '0.13.0-rc.3';
  if (!/^[0-9A-Za-z._-]{1,32}$/.test(appVersion)) throw new Error('ENV_APP_VERSION_INVALID');
  const imageDigest = env.APP_IMAGE_DIGEST?.trim() || null;
  if (imageDigest && !/^sha256:[a-f0-9]{64}$/.test(imageDigest)) throw new Error('ENV_IMAGE_DIGEST_INVALID');
  return { nodeEnv: nodeEnv as RuntimeConfig['nodeEnv'], appVersion, imageDigest, existingLookupOnly: true };
}