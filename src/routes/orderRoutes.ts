import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { IOrderController } from "../models/Order";
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

export function buildOrderRoutes(orderController: IOrderController) {
    return async function (fastify: FastifyInstance): Promise<void> {
        fastify.addHook('onRequest', authenticate);

        fastify.post('/', orderController.create.bind(orderController));
        fastify.get('/:id', orderController.getById.bind(orderController));
        fastify.get('/', orderController.getByUserId.bind(orderController));
        fastify.get('/status', orderController.getByUserIdAndStatus.bind(orderController));
        fastify.get('/:id/items', orderController.getItemsByOrderId.bind(orderController));
        fastify.patch('/:id', orderController.update.bind(orderController));
        fastify.patch('/:id/status', orderController.updateStatus.bind(orderController));
        fastify.delete('/:id', orderController.delete.bind(orderController));
    };
}
