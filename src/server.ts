import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { userRoutes } from './routes/userRoutes';
import { adminRoutes } from './routes/adminRoutes';
import { getDatabase } from './database/database';

async function main(): Promise<void> {
  const fastify = Fastify({ logger: true });

  // Servir arquivos estáticos da pasta public/
  await fastify.register(fastifyStatic, {
    root: path.join(__dirname, '..', 'public'),
    prefix: '/',
  });

  // Registrar rotas da API
  await fastify.register(userRoutes);
  await fastify.register(adminRoutes);

  // Inicializar o banco de dados (cria tabelas se não existirem)
  await getDatabase();

  // Iniciar o servidor
  const port = Number(process.env.PORT) || 3000;
  await fastify.listen({ port, host: '0.0.0.0' });
  console.log(`Servidor rodando em http://localhost:${port}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
