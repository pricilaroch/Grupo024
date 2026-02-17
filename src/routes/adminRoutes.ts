import { FastifyInstance } from 'fastify';
import { AdminController } from '../controllers/AdminController';

export async function adminRoutes(fastify: FastifyInstance): Promise<void> {
  const controller = new AdminController();

  fastify.get('/admin/users/pending', (request, reply) =>
    controller.listPending(request, reply)
  );

  fastify.patch('/admin/users/:id/status', (request, reply) =>
    controller.updateStatus(request as any, reply)
  );
}
