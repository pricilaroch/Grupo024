import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { IExpenseController } from '../models/Expense';
import { createExpenseSchema, updateExpenseSchema } from '../schemas/expense.schema';
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

const expenseResponseSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  valor: z.number(),
  categoria: z.string(),
  descricao: z.string().nullable().optional(),
  status: z.string(),
  data_emissao: z.string().nullable().optional(),
  data_vencimento: z.string().nullable().optional(),
  data_pagamento: z.string().nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

const expenseSummarySchema = z.array(z.object({
  mes: z.string(),
  total: z.number(),
}));

export function buildExpenseRoutes(expenseController: IExpenseController) {
  return async function (fastify: FastifyInstance): Promise<void> {
    const app = fastify.withTypeProvider<ZodTypeProvider>();
    app.addHook('onRequest', authenticate);

    // CRUD
    app.post('/', {
      schema: {
        tags: ['Expenses'],
        summary: 'Criar despesa',
        description: 'Registra uma nova despesa vinculada ao usuário autenticado.',
        security: [{ bearerAuth: [] }],
        body: createExpenseSchema,
        response: {
          201: expenseResponseSchema,
          ...errorResponses,
        },
      },
    }, expenseController.create.bind(expenseController));

    app.get('/', {
      schema: {
        tags: ['Expenses'],
        summary: 'Listar despesas do usuário',
        description: 'Retorna todas as despesas do usuário autenticado.',
        security: [{ bearerAuth: [] }],
        response: {
          200: z.array(expenseResponseSchema),
          ...errorResponses,
        },
      },
    }, expenseController.getByUserId.bind(expenseController));

    app.patch('/:id', {
      schema: {
        tags: ['Expenses'],
        summary: 'Atualizar despesa',
        description: 'Atualiza parcialmente os dados de uma despesa existente.',
        security: [{ bearerAuth: [] }],
        params: idParamSchema,
        body: updateExpenseSchema,
        response: {
          200: expenseResponseSchema,
          ...errorResponses,
        },
      },
    }, expenseController.update.bind(expenseController));

    app.delete('/:id', {
      schema: {
        tags: ['Expenses'],
        summary: 'Excluir despesa',
        description: 'Remove uma despesa do usuário autenticado.',
        security: [{ bearerAuth: [] }],
        params: idParamSchema,
        response: {
          200: messageResponseSchema,
          ...errorResponses,
        },
      },
    }, expenseController.delete.bind(expenseController));

    // Rota rápida para dar baixa (pendente → pago)
    app.patch('/:id/pay', {
      schema: {
        tags: ['Expenses'],
        summary: 'Dar baixa em despesa',
        description: 'Marca uma despesa pendente como paga (atualiza status e data_pagamento).',
        security: [{ bearerAuth: [] }],
        params: idParamSchema,
        response: {
          200: messageResponseSchema,
          ...errorResponses,
        },
      },
    }, expenseController.pay.bind(expenseController));

    // Resumo mensal para gráfico de fluxo de caixa
    app.get('/summary', {
      schema: {
        tags: ['Expenses'],
        summary: 'Resumo mensal de despesas',
        description: 'Retorna o total de despesas agrupado por mês, útil para gráficos de fluxo de caixa.',
        security: [{ bearerAuth: [] }],
        response: {
          200: expenseSummarySchema,
          ...errorResponses,
        },
      },
    }, expenseController.summary.bind(expenseController));
  };
}
