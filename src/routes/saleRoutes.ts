import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { ISaleController } from '../models/Sale';
import { createSaleSchema, updateSaleSchema } from '../schemas/sale.schema';
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

const saleResponseSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  client_id: z.number().nullable().optional(),
  valor_total: z.number(),
  valor_lucro: z.number().nullable().optional(),
  forma_pagamento: z.string(),
  data_venda: z.string().nullable().optional(),
  descricao: z.string().nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  cliente_nome: z.string().nullable().optional(),
});

const followUpSchema = z.array(z.object({
  client_id: z.number(),
  cliente_nome: z.string(),
  telefone: z.string(),
  ultima_compra: z.string(),
  dias_sem_compra: z.number(),
  total_compras: z.number(),
}));

export function buildSaleRoutes(saleController: ISaleController) {
  return async function (fastify: FastifyInstance): Promise<void> {
    const app = fastify.withTypeProvider<ZodTypeProvider>();
    app.addHook('onRequest', authenticate);

    app.post('/', {
      schema: {
        tags: ['Sales'],
        summary: 'Registrar venda',
        description: 'Registra uma nova venda manual vinculada ao usuário autenticado.',
        security: [{ bearerAuth: [] }],
        body: createSaleSchema,
        response: {
          201: saleResponseSchema,
          ...errorResponses,
        },
      },
    }, saleController.create.bind(saleController));

    app.get('/', {
      schema: {
        tags: ['Sales'],
        summary: 'Listar vendas do usuário',
        description: 'Retorna todas as vendas do usuário autenticado.',
        security: [{ bearerAuth: [] }],
        response: {
          200: z.array(saleResponseSchema),
          ...errorResponses,
        },
      },
    }, saleController.getByUserId.bind(saleController));

    app.get('/follow-up', {
      schema: {
        tags: ['Sales'],
        summary: 'Clientes para follow-up',
        description: 'Retorna clientes que não compraram recentemente e podem precisar de follow-up.',
        security: [{ bearerAuth: [] }],
        response: {
          200: followUpSchema,
          ...errorResponses,
        },
      },
    }, (saleController as any).followUp.bind(saleController));

    app.patch('/:id', {
      schema: {
        tags: ['Sales'],
        summary: 'Atualizar venda',
        description: 'Atualiza parcialmente os dados de uma venda existente.',
        security: [{ bearerAuth: [] }],
        params: idParamSchema,
        body: updateSaleSchema,
        response: {
          200: saleResponseSchema,
          ...errorResponses,
        },
      },
    }, saleController.update.bind(saleController));

    app.delete('/:id', {
      schema: {
        tags: ['Sales'],
        summary: 'Excluir venda',
        description: 'Remove uma venda do usuário autenticado.',
        security: [{ bearerAuth: [] }],
        params: idParamSchema,
        response: {
          200: messageResponseSchema,
          ...errorResponses,
        },
      },
    }, saleController.delete.bind(saleController));
  };
}
