import { getDatabase } from '../database/database';
import { IProductRepository, ProductData, ProductDTO } from "../models/Product";
import { Database } from 'sqlite';


export class ProductRepository implements  IProductRepository{

    private db: Database ;
    constructor(db: Database) {
        this.db = db;
    }
    
    // Implementação dos métodos do IProductRepository aqui
    async create(product: ProductDTO, user_id: number): Promise<ProductData> {
        const result = await this.db.run(
            `INSERT INTO products (user_id, nome, descricao, preco_venda, preco_custo, unidade_medida, quantidade_estoque, tempo_producao_minutos, imagem_url, categoria, ativo) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            user_id,
            product.nome,
            product.descricao || null,
            product.preco_venda,
            product.preco_custo || null,
            product.unidade_medida || null,
            product.quantidade_estoque || 0,
            product.tempo_producao_minutos || null,
            product.imagem_url || null,
            product.categoria || null,
            product.ativo !== undefined ? (product.ativo ? 1 : 0) : 1
        );

        if (result.lastID === undefined) {
            throw new Error('Erro ao criar produto');
        }

        const data = await this.findById(result.lastID);

        if (!data) {
            throw new Error('Erro ao criar produto');
        }

        return data;
    }

    async findById(id: number): Promise<ProductData | null> {
        const product: ProductData | undefined = await this.db.get(
            `SELECT * FROM products WHERE id = ?`,
            id
        );

        if (!product) {
            return null;
        }

        return {
            id: product.id,
            user_id: product.user_id,
            nome: product.nome,
            descricao: product.descricao,
            preco_venda: product.preco_venda,
            preco_custo: product.preco_custo,
            unidade_medida: product.unidade_medida,
            quantidade_estoque: product.quantidade_estoque,
            tempo_producao_minutos: product.tempo_producao_minutos,
            imagem_url: product.imagem_url,
            categoria: product.categoria,
            ativo: Boolean(product.ativo),
            created_at: product.created_at,
            updated_at: product.updated_at
        };
    }

    async findByUserId(user_id: number): Promise<ProductData[]> {
        const products: ProductData[] = await this.db.all(
            `SELECT * FROM products WHERE user_id = ?`,
            user_id
        );

        return products.map(product => ({
            id: product.id,
            user_id: product.user_id,
            nome: product.nome,
            descricao: product.descricao,
            preco_venda: product.preco_venda,
            preco_custo: product.preco_custo,
            unidade_medida: product.unidade_medida,
            quantidade_estoque: product.quantidade_estoque,
            tempo_producao_minutos: product.tempo_producao_minutos,
            imagem_url: product.imagem_url,
            categoria: product.categoria,
            ativo: Boolean(product.ativo),
            created_at: product.created_at,
            updated_at: product.updated_at
        }));
    }

    async findAll(): Promise<ProductData[]> {
        const products: ProductData[] = await this.db.all(
            `SELECT * FROM products`
        );

        return products.map(product => ({
            id: product.id,
            user_id: product.user_id,
            nome: product.nome,
            descricao: product.descricao,
            preco_venda: product.preco_venda,
            preco_custo: product.preco_custo,
            unidade_medida: product.unidade_medida,
            quantidade_estoque: product.quantidade_estoque,
            tempo_producao_minutos: product.tempo_producao_minutos,
            imagem_url: product.imagem_url,
            categoria: product.categoria,
            ativo: Boolean(product.ativo),
            created_at: product.created_at,
            updated_at: product.updated_at
        }));
    }

    async update(id: number, product: ProductDTO): Promise<ProductData | null> {
        const existingProduct = await this.findById(id);
        if (!existingProduct) {
            return null;
        }

        await this.db.run(
            `UPDATE products SET nome = ?, descricao = ?, preco_venda = ?, preco_custo = ?, unidade_medida = ?, quantidade_estoque = ?, tempo_producao_minutos = ?, imagem_url = ?, categoria = ?, ativo = ?, updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            product.nome || existingProduct.nome,
            product.descricao || existingProduct.descricao,
            product.preco_venda !== undefined ? product.preco_venda : existingProduct.preco_venda,
            product.preco_custo !== undefined ? product.preco_custo : existingProduct.preco_custo,
            product.unidade_medida || existingProduct.unidade_medida,
            product.quantidade_estoque !== undefined ? product.quantidade_estoque : existingProduct.quantidade_estoque,
            product.tempo_producao_minutos !== undefined ? product.tempo_producao_minutos : existingProduct.tempo_producao_minutos,
            product.imagem_url || existingProduct.imagem_url,
            product.categoria || existingProduct.categoria,
            product.ativo !== undefined ? (product.ativo ? 1 : 0) : (existingProduct.ativo ? 1 : 0),
            id
        );

        return this.findById(id);
    }

    async delete(id: number): Promise<boolean> {
        const result = await this.db.run(
            `DELETE FROM products WHERE id = ?`,
            id
        );

        if (result.changes === undefined) {
            return false;
        }

        return result.changes > 0;
    }
}