/**
 * Gera o arquivo docs/openapi.json a partir das rotas registradas no Fastify.
 * Uso: npx ts-node scripts/generate-openapi.ts
 */
import path from 'path';
import fs from 'fs';
import { buildServer } from '../src/server';

(async () => {
  const fastify = await buildServer();
  await fastify.ready();

  const spec = fastify.swagger();
  const outPath = path.join(__dirname, '..', 'docs', 'openapi.json');

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(spec, null, 2), 'utf-8');

  console.log(`✔ OpenAPI spec gerado em ${outPath}`);
  await fastify.close();
  process.exit(0);
})();
