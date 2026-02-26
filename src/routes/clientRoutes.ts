import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { IClientController } from "../models/Client";
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


export function buildClientRoutes(clientController: IClientController) {
    return async function (fastify: FastifyInstance): Promise<void> {
        fastify.addHook('onRequest', authenticate);

        fastify.post('/', clientController.create.bind(clientController));
        fastify.get('/:id', clientController.getById.bind(clientController));
        fastify.get('/', clientController.getByUserId.bind(clientController));
        fastify.put('/:id', clientController.update.bind(clientController));
        fastify.delete('/:id', clientController.delete.bind(clientController));
    }
}