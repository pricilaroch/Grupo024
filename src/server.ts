import Fastify, { FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import fastifyStatic from '@fastify/static';
import fastifyJwt from '@fastify/jwt';
import path from 'path';
import { ZodError } from 'zod';

import { config } from './config';
import { AppError } from './errors/AppError';
import { getDatabase } from './database/database';

// Repositories
import { UserRepository } from './repositories/UserRepository';

// Services
import { UserService } from './services/UserService';

// Controllers
import { UserController } from './controllers/UserController';
import { AuthController } from './controllers/AuthController';
import { AdminController } from './controllers/AdminController';

// Route builders
import { buildUserRoutes } from './routes/userRoutes';
import { buildAuthRoutes } from './routes/authRoutes';
import { buildAdminRoutes } from './routes/adminRoutes';

async function main(): Promise<void> {
  const fastify = Fastify({ logger: true });

  // ─── Plugins ───────────────────────────────────────────
  await fastify.register(fastifyStatic, {
    root: path.join(__dirname, '..', 'public'),
    prefix: '/',
  });

  await fastify.register(fastifyJwt, {
    secret: config.jwtSecret,
  });

  // ─── Error Handler centralizado ────────────────────────
  fastify.setErrorHandler((error: FastifyError | Error, request: FastifyRequest, reply: FastifyReply) => {
    // Erros de validação Zod
    if (error instanceof ZodError) {
      const messages = error.issues.map((e: { message: string }) => e.message);
      reply.status(400).send({ error: messages.join('; ') });
      return;
    }

    // Erros de aplicação (AppError e subclasses)
    if (error instanceof AppError) {
      reply.status(error.statusCode).send({ error: error.message });
      return;
    }

    // Erros inesperados
    request.log.error(error);
    reply.status(500).send({ error: 'Erro interno do servidor.' });
  });

  // ─── Injeção de Dependências (DI manual) ───────────────
  const userRepository = new UserRepository();
  const userService = new UserService(userRepository);

  const userController = new UserController(userService);
  const authController = new AuthController(userService);
  const adminController = new AdminController(userService);

  // ─── Rotas ─────────────────────────────────────────────
  await fastify.register(buildUserRoutes(userController));
  await fastify.register(buildAuthRoutes(authController));
  await fastify.register(buildAdminRoutes(adminController));

  // ─── Banco de Dados (Migrations) ──────────────────────
  await getDatabase();

  // ─── Start ─────────────────────────────────────────────
  await fastify.listen({ port: config.port, host: '0.0.0.0' });
  console.log(`Servidor rodando em http://localhost:${config.port}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
