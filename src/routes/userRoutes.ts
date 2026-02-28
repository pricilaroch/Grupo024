import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { UserController } from '../controllers/UserController';
import { registerSchema } from '../schemas/user.schema';
import { errorResponses, messageResponseSchema } from '../schemas/common.schema';

export function buildUserRoutes(controller: UserController) {
  return async function userRoutes(fastify: FastifyInstance): Promise<void> {
    const app = fastify.withTypeProvider<ZodTypeProvider>();

    app.post('/users/register', {
      schema: {
        tags: ['Users'],
        summary: 'Registrar novo usuário',
        description: 'Cria uma conta de produtor pendente de aprovação pelo admin.',
        body: registerSchema,
        response: {
          201: messageResponseSchema,
          ...errorResponses,
        },
      },
    }, (request, reply) => controller.register(request, reply));
  };
}
