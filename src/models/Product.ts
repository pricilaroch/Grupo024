import { FastifyReply, FastifyRequest } from "fastify";

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
    user_id: number;
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
    create(product: ProductDTO, user_id: number): Promise<ProductData>;
    findById(id: number): Promise<ProductData | null>;
    findByUserId(user_id: number): Promise<ProductData[]>;
    findAll(): Promise<PublicProduct[]>;
    update(id: number, product: ProductDTO): Promise<ProductData | null>;
    delete(id: number): Promise<boolean>;
}

export interface IProductService {
    createProduct(product: ProductDTO, user_id: number): Promise<ProductData>;
    getProductById(id: number, user_id: number): Promise<ProductData | null>;
    getProductsByUserId(user_id: number): Promise<ProductData[]>;
    getAllProducts(): Promise<PublicProduct[]>;
    updateProduct(id: number, product: ProductDTO, user_id: number): Promise<ProductData | null>;
    deleteProduct(id: number, user_id: number): Promise<boolean>;
}

export interface IProductController {
    create(request: FastifyRequest, reply: FastifyReply): Promise<void>;
    getById(request: FastifyRequest, reply: FastifyReply): Promise<void>;
    getByUserId(request: FastifyRequest, reply: FastifyReply): Promise<void>;
    getAll(request: FastifyRequest, reply: FastifyReply): Promise<void>;
    update(request: FastifyRequest, reply: FastifyReply): Promise<void>;
    delete(request: FastifyRequest, reply: FastifyReply): Promise<void>;
}

