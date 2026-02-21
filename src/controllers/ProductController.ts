import { IProductController, IProductService, ProductData, ProductDTO} from "../models/Product";
import { createProductSchema, updateProductSchema } from "../schemas/product.schema";
import { FastifyReply, FastifyRequest } from "fastify";

export class ProductController implements IProductController {
    private productService: IProductService;

    constructor(productService: IProductService) {
        this.productService = productService;
    }

    async create(
        request: FastifyRequest, 
        reply: FastifyReply
    ): Promise<void> {
        try {
            const user_id = request.user.id;

            
            const productDTO: ProductDTO = createProductSchema.parse(request.body);
            const product = await this.productService.createProduct(productDTO, user_id);
            reply.status(201).send(product);
        } catch (error) {
            if (error instanceof Error && error.name === 'Erro ao criar produto') {
                console.error('Erro ao criar produto:', error);
                reply.status(400).send({ error: 'Erro ao criar produto', details: error.message });
            }
            console.error('Erro ao criar produto:', error);
            reply.status(400).send({ error: 'Erro ao criar produto', details: error instanceof Error ? error.message : String(error) });
        }
    }

    async getById(
        request: FastifyRequest<{ Params: { id: string } }>, 
        reply: FastifyReply
    ): Promise<void> {
        try {
            const user_id = request.user.id;
            const id = Number(request.params.id);
            if (isNaN(id)) {
                reply.status(400).send({ error: 'ID inválido' });
                return;
            }
            const product = await this.productService.getProductById(id, user_id);
            if (!product) {
                reply.status(404).send({ error: 'Produto não encontrado ou acesso negado.' });
                return;
            }
            reply.status(200).send(product);
        } catch (error) {
            console.error('Erro ao buscar produto:', error);
            reply.status(500).send({ error: 'Erro ao buscar produto', details: error instanceof Error ? error.message : String(error) });
        }
    }

    async getByUserId(
        request: FastifyRequest, 
        reply: FastifyReply
    ): Promise<void> {
        try {
            const user_id = request.user.id;
            const products = await this.productService.getProductsByUserId(user_id);
            reply.status(200).send(products);
        } catch (error) {
            console.error('Erro ao buscar produtos do usuário:', error);
            reply.status(500).send({ error: 'Erro ao buscar produtos do usuário', details: error instanceof Error ? error.message : String(error) });
        }
    }

    async getAll(
        request: FastifyRequest, 
        reply: FastifyReply
    ): Promise<void> {
        try {
            const products = await this.productService.getAllProducts();
            reply.status(200).send(products);
        } catch (error) {
            console.error('Erro ao buscar todos os produtos:', error);
            reply.status(500).send({ error: 'Erro ao buscar todos os produtos', details: error instanceof Error ? error.message : String(error) });
        }
    }

    async update(
        request: FastifyRequest<{ Params: { id: string } }>, 
        reply: FastifyReply
    ): Promise<void> {
        try {
            const user_id = request.user.id;
            const id = Number(request.params.id);
            if (isNaN(id)) {
                reply.status(400).send({ error: 'ID inválido' });
                return;
            }
            const productDTO: ProductDTO = updateProductSchema.parse(request.body);
            if(Object.keys(productDTO).length === 0) {
                reply.status(400).send({ error: 'Nenhum campo recebido para atualização' });
                return;
            }

            const updatedProduct = await this.productService.updateProduct(id, productDTO, user_id);
            if (!updatedProduct) {
                reply.status(404).send({ error: 'Produto não encontrado ou acesso negado.' });
                return;
            }
            reply.status(200).send(updatedProduct);
        } catch (error) {
            console.error('Erro ao atualizar produto:', error);
            reply.status(400).send({ error: 'Erro ao atualizar produto', details: error instanceof Error ? error.message : String(error) });
        }
    }

    async delete(
        request: FastifyRequest<{ Params: { id: string } }>, 
        reply: FastifyReply
    ): Promise<void> {
        try {
            const user_id = request.user.id;
            const id = Number(request.params.id);
            if (isNaN(id)) {
                reply.status(400).send({ error: 'ID inválido' });
                return;
            }
            const success = await this.productService.deleteProduct(id, user_id);
            if (!success) {
                reply.status(404).send({ error: 'Produto não encontrado ou acesso negado.' });
                return;
            }
            reply.status(204).send();
        } catch (error) {
            console.error('Erro ao deletar produto:', error);
            reply.status(500).send({ error: 'Erro ao deletar produto', details: error instanceof Error ? error.message : String(error) });
        }
    }
}