import { UserRepository } from '../repositories/UserRepository';
import { IProductRepository, CatalogProduct } from '../models/Product';
import { NotFoundError } from '../errors/AppError';

export interface LojaPublica {
  nome_fantasia: string;
  categoria_producao: string;
  telefone: string;
}

export interface PublicCatalogData {
  loja: LojaPublica;
  produtos: CatalogProduct[];
}

export interface ICatalogService {
  getCatalogBySlug(slug: string): Promise<PublicCatalogData>;
}

export class CatalogService implements ICatalogService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly productRepository: IProductRepository,
  ) {}

  /**
   * Retorna os dados públicos da loja + produtos ativos.
   * Segurança: o campo preco_custo nunca é incluído — a query seleciona
   * apenas id, nome, descricao, preco_venda, imagem_url e categoria.
   */
  async getCatalogBySlug(slug: string): Promise<PublicCatalogData> {
    const user = await this.userRepository.findBySlug(slug);

    if (!user || !user.id) {
      throw new NotFoundError(`Vitrine "${slug}" não encontrada.`);
    }

    const produtos = await this.productRepository.findActiveByUserId(user.id);

    return {
      loja: {
        nome_fantasia: user.nome_fantasia,
        categoria_producao: user.categoria_producao,
        telefone: user.telefone,
      },
      produtos,
    };
  }
}
