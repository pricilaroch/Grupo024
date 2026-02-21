export interface ProductData {
  id?: number;
  user_id: number;
  nome: string;
  descricao?: string;
  preco_venda: number;
  preco_custo?: number;
  unidade_medida?: string;
  quantidade_estoque?: number;
  tempo_producao_minutos?: number;
  imagem_url?: string;
  categoria?: string;
  ativo?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ProductDTO {
    nome?: string;
    descricao?: string;
    preco_venda?: number;
    preco_custo?: number;
    unidade_medida?: string;
    quantidade_estoque?: number;
    tempo_producao_minutos?: number;
    imagem_url?: string;
    categoria?: string;
    ativo?: boolean;
}

export interface PublicProduct {
    id: number;
    nome: string;
    descricao?: string;
    preco_venda: number;
    unidade_medida: string;
    quantidade_estoque: number;
    tempo_producao_minutos: number;
    imagem_url?: string;
    categoria?: string;
}

export interface IProductRepository {
    create(product: ProductData, user_id: number): Promise<ProductData>;
    findById(id: number): Promise<ProductData | null>;
    findByUserId(user_id: number): Promise<ProductData[]>;
    findAll(): Promise<ProductData[]>;
    update(id: number, product: ProductDTO): Promise<ProductData | null>;
    delete(id: number): Promise<boolean>;
}