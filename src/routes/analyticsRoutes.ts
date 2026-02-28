import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { IAnalyticsController } from '../models/Analytics';
import { errorResponses } from '../schemas/common.schema';
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

const movementSchema = z.object({
  tipo: z.string(),
  descricao: z.string().nullable().optional(),
  valor: z.number(),
  data: z.string(),
  categoria: z.string().nullable().optional(),
});

const balanceSchema = z.object({
  saldo_real: z.number(),
  saldo_projetado: z.number(),
  total_entradas: z.number(),
  total_saidas: z.number(),
  entradas_pendentes: z.number(),
  saidas_pendentes: z.number(),
});

const goalSummarySchema = z.object({
  meta: z.number(),
  realizado: z.number(),
  percentual: z.number(),
  faltam: z.number(),
});

export function buildAnalyticsRoutes(analyticsController: IAnalyticsController) {
  return async function (fastify: FastifyInstance): Promise<void> {
    const app = fastify.withTypeProvider<ZodTypeProvider>();
    app.addHook('onRequest', authenticate);

    // GET /analytics/movements — extrato unificado (entradas + saídas)
    app.get('/movements', {
      schema: {
        tags: ['Analytics'],
        summary: 'Extrato de movimentações',
        description: 'Retorna o extrato unificado de entradas e saídas do usuário autenticado.',
        security: [{ bearerAuth: [] }],
        response: {
          200: z.array(movementSchema),
          ...errorResponses,
        },
      },
    }, analyticsController.movements.bind(analyticsController));

    // GET /analytics/balance — saldo real + projetado
    app.get('/balance', {
      schema: {
        tags: ['Analytics'],
        summary: 'Saldo financeiro',
        description: 'Retorna o saldo real, projetado, total de entradas/saídas e pendências.',
        security: [{ bearerAuth: [] }],
        response: {
          200: balanceSchema,
          ...errorResponses,
        },
      },
    }, analyticsController.balance.bind(analyticsController));

    // GET /analytics/goal?meta=1000 — meta mensal vs. realizado
    app.get('/goal', {
      schema: {
        tags: ['Analytics'],
        summary: 'Meta mensal vs. realizado',
        description: 'Compara a meta mensal informada via query param com o valor realizado.',
        security: [{ bearerAuth: [] }],
        querystring: z.object({
          meta: z.coerce.number().positive('A meta deve ser um número positivo.'),
        }),
        response: {
          200: goalSummarySchema,
          ...errorResponses,
        },
      },
    }, analyticsController.goalSummary.bind(analyticsController));
  };
}
