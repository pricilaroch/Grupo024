import { FastifyInstance } from 'fastify';
import { UserController } from '../controllers/UserController';

export function buildUserRoutes(controller: UserController) {
  return async function userRoutes(fastify: FastifyInstance): Promise<void> {
    fastify.post('/users/register', (request, reply) =>
      controller.register(request, reply)
    );
  };
}
