import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { ProductController } from '../controllers/ProductController';
import { createProductSchema, updateProductSchema } from '../schemas/product.schema';
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

const productResponseSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  nome: z.string(),
  descricao: z.string(),
  preco_venda: z.number(),
  preco_custo: z.number().nullable().optional(),
  unidade_medida: z.string().nullable().optional(),
  quantidade_estoque: z.number().nullable().optional(),
  tempo_producao_minutos: z.number().nullable().optional(),
  imagem_url: z.string().nullable().optional(),
  categoria: z.string(),
  ativo: z.boolean().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export function buildProductRoutes(controller: ProductController) {
  return async function productRoutes(fastify: FastifyInstance): Promise<void> {
    const app = fastify.withTypeProvider<ZodTypeProvider>();

    app.post('/', {
      preHandler: authenticate,
      schema: {
        tags: ['Products'],
        summary: 'Criar produto',
        description: 'Cria um novo produto vinculado ao usuário autenticado.',
        security: [{ bearerAuth: [] }],
        body: createProductSchema,
        response: {
          201: productResponseSchema,
          ...errorResponses,
        },
      },
    }, (request, reply) => controller.create(request, reply));

    app.get('/:id', {
      preHandler: authenticate,
      schema: {
        tags: ['Products'],
        summary: 'Buscar produto por ID',
        description: 'Retorna os detalhes de um produto específico do usuário.',
        security: [{ bearerAuth: [] }],
        params: idParamSchema,
        response: {
          200: productResponseSchema,
          ...errorResponses,
        },
      },
    }, (request, reply) =>
      controller.getById(request as FastifyRequest<{ Params: { id: string } }>, reply)
    );

    app.get('/', {
      preHandler: authenticate,
      schema: {
        tags: ['Products'],
        summary: 'Listar produtos do usuário',
        description: 'Retorna todos os produtos do usuário autenticado.',
        security: [{ bearerAuth: [] }],
        response: {
          200: z.array(productResponseSchema),
          ...errorResponses,
        },
      },
    }, (request, reply) => controller.getByUserId(request, reply));

    app.patch('/:id', {
      preHandler: authenticate,
      schema: {
        tags: ['Products'],
        summary: 'Atualizar produto',
        description: 'Atualiza parcialmente os dados de um produto existente.',
        security: [{ bearerAuth: [] }],
        params: idParamSchema,
        body: updateProductSchema,
        response: {
          200: productResponseSchema,
          ...errorResponses,
        },
      },
    }, (request, reply) =>
      controller.update(request as FastifyRequest<{ Params: { id: string } }>, reply)
    );

    app.delete('/:id', {
      preHandler: authenticate,
      schema: {
        tags: ['Products'],
        summary: 'Excluir produto',
        description: 'Remove um produto do usuário autenticado.',
        security: [{ bearerAuth: [] }],
        params: idParamSchema,
        response: {
          200: messageResponseSchema,
          ...errorResponses,
        },
      },
    }, (request, reply) =>
      controller.delete(request as FastifyRequest<{ Params: { id: string } }>, reply)
    );
  };
}
