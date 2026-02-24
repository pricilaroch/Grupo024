import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { UnauthorizedError } from '../errors/AppError';
import { ProductController } from '../controllers/ProductController';

/**
 * Decorator de autenticação JWT.
 * Verifica o token e se o usuário tem status 'aprovado'.
 */

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

export function buildProductRoutes(controller: ProductController) {
    return async function productRoutes(fastify: FastifyInstance): Promise<void> {
        // Rotas protegidas
        fastify.post('/', { preHandler: authenticate }, (request, reply) =>
            controller.create(request, reply)
        );

        fastify.get('/:id', { preHandler: authenticate }, (request, reply) =>
            controller.getById(request as FastifyRequest<{ Params: { id: string } }>, reply)
        );

        fastify.get('/user', { preHandler: authenticate }, (request, reply) =>
            controller.getByUserId(request, reply)
        );

        fastify.patch('/:id', { preHandler: authenticate }, (request, reply) =>
            controller.update(request as FastifyRequest<{ Params: { id: string } }>, reply)
        );

        fastify.delete('/:id', { preHandler: authenticate }, (request, reply) =>
            controller.delete(request as FastifyRequest<{ Params: { id: string } }>, reply)
        );

        // Rota pública
        fastify.get('/', (request, reply) =>
            controller.getAll(request, reply)
        );
    }
}
