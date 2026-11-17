import fs from 'fs';
import path from 'path';
import YAML from 'yaml';

/**
 * Loads `openapi.yaml` (repo root of backend/) into a plain object for
 * swagger-ui-express. Read fresh on every call rather than cached at
 * module-load time, so editing the spec and restarting `npm run dev`
 * reflects without a separate build step.
 */
export function loadOpenApiDocument(): Record<string, unknown> {
  const filePath = path.resolve(__dirname, '..', 'openapi.yaml');
  const file = fs.readFileSync(filePath, 'utf8');
  return YAML.parse(file);
}
