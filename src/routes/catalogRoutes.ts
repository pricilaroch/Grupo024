import { FastifyInstance, FastifyRequest } from 'fastify';
import { CatalogController } from '../controllers/CatalogController';

/**
 * Rotas públicas — SEM autenticação JWT.
 * Qualquer pessoa pode acessar o catálogo de produtos de um produtor pelo slug.
 */
export function buildCatalogRoutes(controller: CatalogController) {
  return async function catalogRoutes(fastify: FastifyInstance): Promise<void> {
    // GET /public/catalog/:slug
    fastify.get('/:slug', (request, reply) =>
      controller.getPublicCatalog(
        request as FastifyRequest<{ Params: { slug: string } }>,
        reply,
      )
    );
  };
}
