import { FastifyInstance } from 'fastify';
import { UserController } from '../controllers/UserController';

export async function userRoutes(fastify: FastifyInstance): Promise<void> {
  const controller = new UserController();

  fastify.post('/users/register', (request, reply) =>
    controller.register(request as any, reply)
  );
}
