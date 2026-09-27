import { readdir, readFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';

async function routes(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const found = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) found.push(...await routes(path));
    else if (entry.name === 'route.ts') {
      const route = '/' + relative('app', directory).split(sep).join('/');
      found.push(route);
    }
  }
  return found;
}

const spec = JSON.parse(await readFile('public/openapi.json', 'utf8'));
const pkg = JSON.parse(await readFile('package.json', 'utf8'));
if (spec.info.version !== pkg.version) throw new Error('OpenAPI version does not match package version');
const implemented = (await routes('app/api')).sort();
const documented = Object.keys(spec.paths).sort();
if (JSON.stringify(implemented) !== JSON.stringify(documented)) {
  throw new Error(`OpenAPI route mismatch: implemented=${implemented.join(',')} documented=${documented.join(',')}`);
}
for (const [path, methods] of Object.entries(spec.paths)) {
  for (const [method, operation] of Object.entries(methods)) {
    if (!operation.summary) throw new Error(`${method.toUpperCase()} ${path} has no summary`);
    for (const [status, response] of Object.entries(operation.responses ?? {})) {
      if (!response.description || !response.content?.['application/json']?.schema) {
        throw new Error(`${method.toUpperCase()} ${path} response ${status} lacks description or JSON schema`);
      }
    }
  }
}
const versionProperties = spec.paths['/api/version'].get.responses['200'].content['application/json'].schema.$ref;
if (versionProperties !== '#/components/schemas/Version') throw new Error('Version response must use the Version schema');
console.log(`OpenAPI contract covers ${implemented.length} API routes.`);
