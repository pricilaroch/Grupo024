import { FastifyInstance } from 'fastify';
import { AuthController } from '../controllers/AuthController';

export function buildAuthRoutes(controller: AuthController) {
  return async function authRoutes(fastify: FastifyInstance): Promise<void> {
    fastify.post('/login', (request, reply) =>
      controller.login(request, reply)
    );
  };
}
