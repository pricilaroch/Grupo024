import { FastifyInstance } from 'fastify';
import { AuthController } from '../controllers/AuthController';

export async function authRoutes(fastify: FastifyInstance): Promise<void> {
  const controller = new AuthController();

  fastify.post('/login', (request, reply) =>
    controller.login(request as any, reply)
  );
}
