import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { AuthController } from '../controllers/AuthController';
import { loginSchema } from '../schemas/user.schema';
import { errorResponses } from '../schemas/common.schema';

export function buildAuthRoutes(controller: AuthController) {
  return async function authRoutes(fastify: FastifyInstance): Promise<void> {
    const app = fastify.withTypeProvider<ZodTypeProvider>();

    app.post('/login', {
      schema: {
        tags: ['Auth'],
        summary: 'Autenticar usuário',
        description: 'Realiza login com CPF e senha, retornando um token JWT.',
        body: loginSchema,
        response: {
          200: z.object({
            token: z.string(),
          }),
          ...errorResponses,
        },
      },
    }, (request, reply) => controller.login(request, reply));
  };
}
