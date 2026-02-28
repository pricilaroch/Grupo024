import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { IClientController } from '../models/Client';
import { clientSchema, updateClientSchema } from '../schemas/client.schema';
import { errorResponses, idParamSchema, messageResponseSchema } from '../schemas/common.schema';
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

const clientResponseSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  nome: z.string(),
  telefone: z.string(),
  email: z.string().nullable().optional(),
  endereco: z.string(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export function buildClientRoutes(clientController: IClientController) {
  return async function (fastify: FastifyInstance): Promise<void> {
    const app = fastify.withTypeProvider<ZodTypeProvider>();
    app.addHook('onRequest', authenticate);

    app.post('/', {
      schema: {
        tags: ['Clients'],
        summary: 'Criar cliente',
        description: 'Cadastra um novo cliente vinculado ao usuário autenticado.',
        security: [{ bearerAuth: [] }],
        body: clientSchema,
        response: {
          201: clientResponseSchema,
          ...errorResponses,
        },
      },
    }, clientController.create.bind(clientController));

    app.get('/:id', {
      schema: {
        tags: ['Clients'],
        summary: 'Buscar cliente por ID',
        description: 'Retorna os detalhes de um cliente específico do usuário.',
        security: [{ bearerAuth: [] }],
        params: idParamSchema,
        response: {
          200: clientResponseSchema,
          ...errorResponses,
        },
      },
    }, clientController.getById.bind(clientController));

    app.get('/', {
      schema: {
        tags: ['Clients'],
        summary: 'Listar clientes do usuário',
        description: 'Retorna todos os clientes do usuário autenticado.',
        security: [{ bearerAuth: [] }],
        response: {
          200: z.array(clientResponseSchema),
          ...errorResponses,
        },
      },
    }, clientController.getByUserId.bind(clientController));

    app.patch('/:id', {
      schema: {
        tags: ['Clients'],
        summary: 'Atualizar cliente',
        description: 'Atualiza parcialmente os dados de um cliente existente.',
        security: [{ bearerAuth: [] }],
        params: idParamSchema,
        body: updateClientSchema,
        response: {
          200: clientResponseSchema,
          ...errorResponses,
        },
      },
    }, clientController.update.bind(clientController));

    app.delete('/:id', {
      schema: {
        tags: ['Clients'],
        summary: 'Excluir cliente',
        description: 'Remove um cliente do usuário autenticado.',
        security: [{ bearerAuth: [] }],
        params: idParamSchema,
        response: {
          200: messageResponseSchema,
          ...errorResponses,
        },
      },
    }, clientController.delete.bind(clientController));
  };
}
