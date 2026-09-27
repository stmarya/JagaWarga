export type RuntimeConfig = {
  nodeEnv: 'development' | 'test' | 'production';
  appVersion: string;
  existingLookupOnly: true;
};

export function runtimeConfig(env: NodeJS.ProcessEnv = process.env): RuntimeConfig {
  const nodeEnv = env.NODE_ENV ?? 'development';
  if (!['development', 'test', 'production'].includes(nodeEnv)) throw new Error('ENV_NODE_ENV_INVALID');
  const appVersion = env.APP_VERSION?.trim() || '0.12.1';
  if (!/^[0-9A-Za-z._-]{1,32}$/.test(appVersion)) throw new Error('ENV_APP_VERSION_INVALID');
  return { nodeEnv: nodeEnv as RuntimeConfig['nodeEnv'], appVersion, existingLookupOnly: true };
}