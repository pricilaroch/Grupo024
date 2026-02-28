import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { IOrderController } from '../models/Order';
import { createOrderSchema, updateOrderSchema } from '../schemas/order.schema';
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

const orderItemResponseSchema = z.object({
  id: z.number(),
  order_id: z.number(),
  product_id: z.number(),
  quantidade: z.number(),
  preco_unitario: z.number(),
  subtotal: z.number(),
  produto_nome: z.string().optional(),
});

const orderResponseSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  client_id: z.number(),
  status: z.string(),
  forma_pagamento: z.string().nullable().optional(),
  status_pagamento: z.string(),
  tipo_entrega: z.string(),
  taxa_entrega: z.number(),
  desconto: z.number(),
  valor_total: z.number(),
  data_entrega: z.string().nullable().optional(),
  observacoes: z.string().nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  cliente_nome: z.string().optional(),
  items: z.array(orderItemResponseSchema).optional(),
});

export function buildOrderRoutes(orderController: IOrderController) {
  return async function (fastify: FastifyInstance): Promise<void> {
    const app = fastify.withTypeProvider<ZodTypeProvider>();
    app.addHook('onRequest', authenticate);

    app.post('/', {
      schema: {
        tags: ['Orders'],
        summary: 'Criar encomenda',
        description: 'Cria uma nova encomenda com itens vinculados ao usuário autenticado.',
        security: [{ bearerAuth: [] }],
        body: createOrderSchema,
        response: {
          201: orderResponseSchema,
          ...errorResponses,
        },
      },
    }, orderController.create.bind(orderController));

    app.get('/:id', {
      schema: {
        tags: ['Orders'],
        summary: 'Buscar encomenda por ID',
        description: 'Retorna os detalhes de uma encomenda específica, incluindo itens.',
        security: [{ bearerAuth: [] }],
        params: idParamSchema,
        response: {
          200: orderResponseSchema,
          ...errorResponses,
        },
      },
    }, orderController.getById.bind(orderController));

    app.get('/', {
      schema: {
        tags: ['Orders'],
        summary: 'Listar encomendas do usuário',
        description: 'Retorna todas as encomendas do usuário autenticado.',
        security: [{ bearerAuth: [] }],
        response: {
          200: z.array(orderResponseSchema),
          ...errorResponses,
        },
      },
    }, orderController.getByUserId.bind(orderController));

    app.get('/status', {
      schema: {
        tags: ['Orders'],
        summary: 'Filtrar encomendas por status',
        description: 'Retorna encomendas do usuário filtradas por status (query param ?status=).',
        security: [{ bearerAuth: [] }],
        querystring: z.object({
          status: z.string().optional(),
        }),
        response: {
          200: z.array(orderResponseSchema),
          ...errorResponses,
        },
      },
    }, orderController.getByUserIdAndStatus.bind(orderController));

    app.get('/:id/items', {
      schema: {
        tags: ['Orders'],
        summary: 'Listar itens de uma encomenda',
        description: 'Retorna todos os itens vinculados a uma encomenda específica.',
        security: [{ bearerAuth: [] }],
        params: idParamSchema,
        response: {
          200: z.array(orderItemResponseSchema),
          ...errorResponses,
        },
      },
    }, orderController.getItemsByOrderId.bind(orderController));

    app.patch('/:id', {
      schema: {
        tags: ['Orders'],
        summary: 'Atualizar encomenda',
        description: 'Atualiza parcialmente os dados de uma encomenda existente.',
        security: [{ bearerAuth: [] }],
        params: idParamSchema,
        body: updateOrderSchema,
        response: {
          200: orderResponseSchema,
          ...errorResponses,
        },
      },
    }, orderController.update.bind(orderController));

    app.patch('/:id/status', {
      schema: {
        tags: ['Orders'],
        summary: 'Atualizar status da encomenda',
        description: 'Atualiza apenas o status de uma encomenda (pendente, em_producao, pronto, entregue, cancelado).',
        security: [{ bearerAuth: [] }],
        params: idParamSchema,
        body: z.object({
          status: z.enum(['pendente', 'em_producao', 'pronto', 'entregue', 'cancelado']),
        }),
        response: {
          200: messageResponseSchema,
          ...errorResponses,
        },
      },
    }, orderController.updateStatus.bind(orderController));

    app.patch('/:id/payment', {
      schema: {
        tags: ['Orders'],
        summary: 'Atualizar status de pagamento',
        description: 'Atualiza o status de pagamento de uma encomenda (pendente, pago, parcial).',
        security: [{ bearerAuth: [] }],
        params: idParamSchema,
        body: z.object({
          status_pagamento: z.enum(['pendente', 'pago', 'parcial']),
        }),
        response: {
          200: messageResponseSchema,
          ...errorResponses,
        },
      },
    }, orderController.updatePaymentStatus.bind(orderController));

    app.delete('/:id', {
      schema: {
        tags: ['Orders'],
        summary: 'Excluir encomenda',
        description: 'Remove uma encomenda e seus itens do usuário autenticado.',
        security: [{ bearerAuth: [] }],
        params: idParamSchema,
        response: {
          200: messageResponseSchema,
          ...errorResponses,
        },
      },
    }, orderController.delete.bind(orderController));
  };
}
