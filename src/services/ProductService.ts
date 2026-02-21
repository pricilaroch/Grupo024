import { IProductRepository, IProductService, ProductData, ProductDTO, PublicProduct } from "../models/Product";


export class ProductService implements IProductService {
    private productRepository: IProductRepository;

    constructor(productRepository: IProductRepository) {
        this.productRepository = productRepository;
    }

    async createProduct(product: ProductDTO, user_id: number): Promise<ProductData> {
        return await this.productRepository.create(product, user_id);
    }

    async getProductById(id: number, user_id: number): Promise<ProductData | null> {
        const product = await this.productRepository.findById(id);
        if (product && product.user_id === user_id) {
            return product;
        }
        return null;
    }

    async getProductsByUserId(user_id: number): Promise<ProductData[]> {
        return await this.productRepository.findByUserId(user_id);
    }

    async getAllProducts(): Promise<PublicProduct[]> {
        return await this.productRepository.findAll();
    }

    async updateProduct(id: number, product: ProductDTO, user_id: number): Promise<ProductData | null> {
        const existingProduct = await this.productRepository.findById(id);
        if (!existingProduct || existingProduct.user_id !== user_id) {
            return null;
        }
        return await this.productRepository.update(id, product);
    }

    async deleteProduct(id: number, user_id: number): Promise<boolean> {
        const existingProduct = await this.productRepository.findById(id);
        if (!existingProduct || existingProduct.user_id !== user_id) {
            return false;
        }
        return await this.productRepository.delete(id);
    }
}