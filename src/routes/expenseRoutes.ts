import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { IExpenseController } from "../models/Expense";
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

export function buildExpenseRoutes(expenseController: IExpenseController) {
    return async function (fastify: FastifyInstance): Promise<void> {
        fastify.addHook('onRequest', authenticate);

        // CRUD
        fastify.post('/', expenseController.create.bind(expenseController));
        fastify.get('/', expenseController.getByUserId.bind(expenseController));
        fastify.patch('/:id', expenseController.update.bind(expenseController));
        fastify.delete('/:id', expenseController.delete.bind(expenseController));

        // Rota rápida para dar baixa (pendente → pago)
        fastify.patch('/:id/pay', expenseController.pay.bind(expenseController));

        // Resumo mensal para gráfico de fluxo de caixa
        fastify.get('/summary', expenseController.summary.bind(expenseController));
    };
}
