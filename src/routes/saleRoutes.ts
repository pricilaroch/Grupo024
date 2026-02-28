import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { ISaleController } from "../models/Sale";
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

export function buildSaleRoutes(saleController: ISaleController) {
    return async function (fastify: FastifyInstance): Promise<void> {
        fastify.addHook('onRequest', authenticate);

        fastify.post('/', saleController.create.bind(saleController));
        fastify.get('/', saleController.getByUserId.bind(saleController));
        fastify.get('/follow-up', saleController.followUp.bind(saleController));
        fastify.patch('/:id', saleController.update.bind(saleController));
        fastify.delete('/:id', saleController.delete.bind(saleController));
    };
}
