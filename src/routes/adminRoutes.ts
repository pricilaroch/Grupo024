import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { AdminController } from '../controllers/AdminController';
import { updateStatusSchema } from '../schemas/user.schema';
import { errorResponses, idParamSchema, messageResponseSchema } from '../schemas/common.schema';
import { UnauthorizedError } from '../errors/AppError';

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
    const app = fastify.withTypeProvider<ZodTypeProvider>();
    app.addHook('onRequest', authenticate);

    app.get('/admin/users/pending', {
      schema: {
        tags: ['Admin'],
        summary: 'Listar usuários pendentes',
        description: 'Retorna todos os usuários com status "pendente" aguardando aprovação.',
        security: [{ bearerAuth: [] }],
        response: {
          200: z.array(z.object({
            id: z.number(),
            nome: z.string(),
            cpf: z.string(),
            email: z.string(),
            telefone: z.string(),
            nome_fantasia: z.string(),
            categoria_producao: z.string(),
            status: z.string(),
            created_at: z.string().optional(),
          })),
          ...errorResponses,
        },
      },
    }, (request, reply) => controller.listPending(request, reply));

    app.patch('/admin/users/:id/status', {
      schema: {
        tags: ['Admin'],
        summary: 'Aprovar ou reprovar usuário',
        description: 'Atualiza o status de um usuário pendente para "aprovado" ou "reprovado".',
        security: [{ bearerAuth: [] }],
        params: idParamSchema,
        body: updateStatusSchema,
        response: {
          200: messageResponseSchema,
          ...errorResponses,
        },
      },
    }, (request, reply) =>
      controller.updateStatus(request as FastifyRequest<{ Params: { id: string } }>, reply)
    );
  };
}
