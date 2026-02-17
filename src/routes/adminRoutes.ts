import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { AdminController } from '../controllers/AdminController';
import { UnauthorizedError } from '../errors/AppError';

/**
 * Decorator de autenticação JWT.
 * Verifica o token e se o usuário tem status 'aprovado'.
 */
async function authenticate(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
  try {
    await request.jwtVerify();
  } catch {
    throw new UnauthorizedError('Token inválido ou expirado.');
  }

  const payload = request.user as { id: number; status: string; role: string };
  if (payload.role !== 'admin') {
    throw new UnauthorizedError('Acesso restrito a administradores.');
  }
}

export function buildAdminRoutes(controller: AdminController) {
  return async function adminRoutes(fastify: FastifyInstance): Promise<void> {
    // Aplica o decorator de autenticação em todas as rotas do prefix
    fastify.addHook('onRequest', authenticate);

    fastify.get('/admin/users/pending', (request, reply) =>
      controller.listPending(request, reply)
    );

    fastify.patch('/admin/users/:id/status', (request, reply) =>
      controller.updateStatus(request as FastifyRequest<{ Params: { id: string } }>, reply)
    );
  };
}
