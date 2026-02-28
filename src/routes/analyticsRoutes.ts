import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { IAnalyticsController } from "../models/Analytics";
import { UnauthorizedError } from "../errors/AppError";

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

export function buildAnalyticsRoutes(analyticsController: IAnalyticsController) {
    return async function (fastify: FastifyInstance): Promise<void> {
        fastify.addHook('onRequest', authenticate);

        // GET /analytics/movements  — extrato unificado (entradas + saídas)
        fastify.get('/movements', analyticsController.movements.bind(analyticsController));

        // GET /analytics/balance    — saldo real + projetado
        fastify.get('/balance', analyticsController.balance.bind(analyticsController));

        // GET /analytics/goal?meta=1000 — meta mensal vs. realizado
        fastify.get('/goal', analyticsController.goalSummary.bind(analyticsController));
    };
}
