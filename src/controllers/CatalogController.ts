import { FastifyRequest, FastifyReply } from 'fastify';
import { ICatalogService } from '../services/CatalogService';

export class CatalogController {
  constructor(private readonly catalogService: ICatalogService) {}

  async getPublicCatalog(
    request: FastifyRequest<{ Params: { slug: string } }>,
    reply: FastifyReply,
  ): Promise<void> {
    const { slug } = request.params;
    const data = await this.catalogService.getCatalogBySlug(slug);

    reply.status(200).send({
      slug,
      loja: data.loja,
      produtos: data.produtos,
    });
  }
}
