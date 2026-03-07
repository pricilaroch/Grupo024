import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { UserController } from '../controllers/UserController';
import { UnauthorizedError } from '../errors/AppError';

async function authenticate(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
  try {
    await request.jwtVerify();
  } catch {
    throw new UnauthorizedError('Token inválido ou expirado.');
  }
  const payload = request.user as { id: number; status: string; role: string };
  if (payload.status !== 'aprovado') {
    throw new UnauthorizedError('Acesso restrito a usuários aprovados.');
  }
}

export function buildUserRoutes(controller: UserController) {
  return async function userRoutes(fastify: FastifyInstance): Promise<void> {
    fastify.post('/register', (request, reply) =>
      controller.register(request, reply)
    );

    // GET /users/me — perfil completo (slug, meta_faturamento, etc.)
    fastify.get('/me', { preHandler: authenticate }, (request, reply) =>
      controller.getMe(request, reply)
    );

    // PATCH /users/me — atualiza perfil (nome_fantasia, categoria_producao, slug)
    fastify.patch('/me', { preHandler: authenticate }, (request, reply) =>
      controller.updateProfile(request, reply)
    );

    // PATCH /users/me/meta — atualiza meta de faturamento
    fastify.patch('/me/meta', { preHandler: authenticate }, (request, reply) =>
      controller.updateMeta(request, reply)
    );
  };
}
