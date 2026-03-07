import { ProductService } from '../../src/services/ProductService';
import { CatalogService } from '../../src/services/CatalogService';
import { IProductRepository, ProductData, ProductDTO, PublicProduct, CatalogProduct } from '../../src/models/Product';
import { NotFoundError } from '../../src/errors/AppError';
import { UserRepository } from '../../src/repositories/UserRepository';

// -----------  Mock do ProductRepository  -----------

function createMockRepo(): jest.Mocked<IProductRepository> {
  return {
    create: jest.fn(),
    findById: jest.fn(),
    findByUserId: jest.fn(),
    findAll: jest.fn(),
    findActiveByUserId: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
}

// -----------  Helpers  -----------

function makeProductDTO(overrides: Partial<ProductDTO> = {}): ProductDTO {
  return {
    nome: 'Bolo de Chocolate',
    descricao: 'Bolo artesanal de chocolate',
    preco_venda: 45.0,
    preco_custo: 20.0,
    unidade_medida: 'unidade',
    quantidade_estoque: 10,
    tempo_producao_minutos: 60,
    categoria: 'Doces',
    ativo: true,
    ...overrides,
  };
}

function makeProduct(overrides: Partial<ProductData> = {}): ProductData {
  return {
    id: 1,
    user_id: 1,
    nome: 'Bolo de Chocolate',
    descricao: 'Bolo artesanal de chocolate',
    preco_venda: 45.0,
    preco_custo: 20.0,
    unidade_medida: 'unidade',
    quantidade_estoque: 10,
    tempo_producao_minutos: 60,
    categoria: 'Doces',
    ativo: true,
    created_at: '2026-02-25 12:00:00',
    updated_at: '2026-02-25 12:00:00',
    ...overrides,
  };
}

// =============================================
//  Tests
// =============================================

describe('ProductService', () => {
  let service: ProductService;
  let repo: jest.Mocked<IProductRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = createMockRepo();
    service = new ProductService(repo);
  });

  // ----------- createProduct -----------

  describe('createProduct', () => {
    it('deve criar um produto com sucesso', async () => {
      const dto = makeProductDTO();
      const expected = makeProduct();
      repo.create.mockResolvedValue(expected);

      const result = await service.createProduct(dto, 1);

      expect(repo.create).toHaveBeenCalledWith(dto, 1);
      expect(result).toEqual(expected);
    });
  });

  // ----------- getProductById -----------

  describe('getProductById', () => {
    it('deve retornar o produto quando pertence ao usuário', async () => {
      const product = makeProduct({ id: 5, user_id: 1 });
      repo.findById.mockResolvedValue(product);

      const result = await service.getProductById(5, 1);

      expect(repo.findById).toHaveBeenCalledWith(5);
      expect(result).toEqual(product);
    });

    it('deve retornar null quando o produto pertence a outro usuário', async () => {
      repo.findById.mockResolvedValue(makeProduct({ user_id: 99 }));

      const result = await service.getProductById(1, 1);

      expect(result).toBeNull();
    });

    it('deve retornar null quando o produto não existe', async () => {
      repo.findById.mockResolvedValue(null);

      const result = await service.getProductById(999, 1);

      expect(result).toBeNull();
    });
  });

  // ----------- getProductsByUserId -----------

  describe('getProductsByUserId', () => {
    it('deve retornar lista de produtos do usuário', async () => {
      const products = [makeProduct({ id: 1 }), makeProduct({ id: 2, nome: 'Torta' })];
      repo.findByUserId.mockResolvedValue(products);

      const result = await service.getProductsByUserId(1);

      expect(repo.findByUserId).toHaveBeenCalledWith(1);
      expect(result).toHaveLength(2);
    });

    it('deve retornar lista vazia quando não há produtos', async () => {
      repo.findByUserId.mockResolvedValue([]);

      const result = await service.getProductsByUserId(1);

      expect(result).toEqual([]);
    });
  });

  // ----------- getAllProducts (público) -----------

  describe('getAllProducts', () => {
    it('deve retornar apenas produtos ativos (visibilidade pública)', async () => {
      const publicProducts: PublicProduct[] = [
        {
          id: 1, user_id: 1, nome: 'Bolo', preco_venda: 45,
          unidade_medida: 'unidade', quantidade_estoque: 10,
          tempo_producao_minutos: 60, categoria: 'Doces',
        },
      ];
      repo.findAll.mockResolvedValue(publicProducts);

      const result = await service.getAllProducts();

      expect(repo.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(publicProducts);
    });
  });

  // ----------- updateProduct -----------

  describe('updateProduct', () => {
    it('deve atualizar um produto do próprio usuário', async () => {
      const existing = makeProduct({ id: 3, user_id: 1 });
      const updated = makeProduct({ id: 3, user_id: 1, nome: 'Bolo Atualizado' });
      repo.findById.mockResolvedValue(existing);
      repo.update.mockResolvedValue(updated);

      const result = await service.updateProduct(3, { nome: 'Bolo Atualizado' } as ProductDTO, 1);

      expect(repo.update).toHaveBeenCalledWith(3, { nome: 'Bolo Atualizado' });
      expect(result?.nome).toBe('Bolo Atualizado');
    });

    it('deve retornar null quando o produto pertence a outro usuário', async () => {
      repo.findById.mockResolvedValue(makeProduct({ user_id: 99 }));

      const result = await service.updateProduct(1, makeProductDTO(), 1);

      expect(repo.update).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('deve retornar null quando o produto não existe', async () => {
      repo.findById.mockResolvedValue(null);

      const result = await service.updateProduct(999, makeProductDTO(), 1);

      expect(result).toBeNull();
    });
  });

  // ----------- deleteProduct -----------

  describe('deleteProduct', () => {
    it('deve excluir o produto do próprio usuário', async () => {
      repo.findById.mockResolvedValue(makeProduct({ id: 5, user_id: 1 }));
      repo.delete.mockResolvedValue(true);

      const result = await service.deleteProduct(5, 1);

      expect(repo.delete).toHaveBeenCalledWith(5);
      expect(result).toBe(true);
    });

    it('deve retornar false quando o produto pertence a outro usuário', async () => {
      repo.findById.mockResolvedValue(makeProduct({ user_id: 99 }));

      const result = await service.deleteProduct(1, 1);

      expect(repo.delete).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it('deve retornar false quando o produto não existe', async () => {
      repo.findById.mockResolvedValue(null);

      const result = await service.deleteProduct(999, 1);

      expect(result).toBe(false);
    });
  });
});

// =============================================
//  CatalogService — testes de vitrine pública
// =============================================

describe('CatalogService', () => {
  let catalogService: CatalogService;
  let repo: jest.Mocked<IProductRepository>;
  let userRepo: jest.Mocked<Pick<UserRepository, 'findBySlug'>>;

  const activeProducts: CatalogProduct[] = [
    { id: 1, nome: 'Bolo de Chocolate', descricao: 'Artesanal', preco_venda: 45, imagem_url: undefined, categoria: 'Doces' },
    { id: 2, nome: 'Brigadeiro', descricao: undefined, preco_venda: 5, imagem_url: undefined, categoria: 'Doces' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    repo = createMockRepo();
    userRepo = { findBySlug: jest.fn() };
    catalogService = new CatalogService(userRepo as unknown as UserRepository, repo);
  });

  it('deve retornar os produtos ativos do produtor identificado pelo slug', async () => {
    userRepo.findBySlug.mockResolvedValue({ id: 1, nome: 'Vovó Doces', nome_fantasia: 'Doces da Vovó', categoria_producao: 'Doces', telefone: '(34) 99999-0000' } as any);
    repo.findActiveByUserId.mockResolvedValue(activeProducts);

    const result = await catalogService.getCatalogBySlug('doces-da-vovo');

    expect(userRepo.findBySlug).toHaveBeenCalledWith('doces-da-vovo');
    expect(repo.findActiveByUserId).toHaveBeenCalledWith(1);
    expect(result.produtos).toHaveLength(2);
    expect(result.produtos).toEqual(activeProducts);
    expect(result.loja.nome_fantasia).toBe('Doces da Vovó');
    expect(result.loja.categoria_producao).toBe('Doces');
    expect(result.loja.telefone).toBe('(34) 99999-0000');
  });

  it('(segurança) preco_custo deve ser undefined em todos os produtos retornados', async () => {
    userRepo.findBySlug.mockResolvedValue({ id: 1, nome: 'Vovó Doces', nome_fantasia: 'Doces da Vovó', categoria_producao: 'Doces', telefone: '(34) 99999-0000' } as any);
    repo.findActiveByUserId.mockResolvedValue(activeProducts);

    const result = await catalogService.getCatalogBySlug('doces-da-vovo');

    result.produtos.forEach((produto) => {
      expect((produto as any).preco_custo).toBeUndefined();
    });
  });

  it('deve lançar NotFoundError quando o slug não existe', async () => {
    userRepo.findBySlug.mockResolvedValue(null);

    await expect(catalogService.getCatalogBySlug('slug-inexistente'))
      .rejects.toThrow(NotFoundError);
  });
});

