import {
    CreateOrderDTO,
    IOrderRepository,
    IOrderService,
    OrderData,
    OrderItemData,
    UpdateOrderDTO,
} from "../models/Order";
import { IProductRepository } from "../models/Product";
import { IClientRepository } from "../models/Client";
import { AppError, NotFoundError, ValidationError } from "../errors/AppError";

export class OrderService implements IOrderService {
    private orderRepository: IOrderRepository;
    private productRepository: IProductRepository;
    private clientRepository: IClientRepository;

    constructor(
        orderRepository: IOrderRepository,
        productRepository: IProductRepository,
        clientRepository: IClientRepository
    ) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.clientRepository = clientRepository;
    }

    /**
     * Cria uma encomenda completa com validação de propriedade,
     * snapshot de preços e cálculos financeiros.
     */
    async createOrder(dto: CreateOrderDTO, user_id: number): Promise<OrderData> {
        // 1. Validar que o cliente pertence ao usuário
        const client = await this.clientRepository.findById(dto.client_id);
        if (!client || client.user_id !== user_id) {
            throw new NotFoundError('Cliente não encontrado ou não pertence ao usuário.');
        }

        // 2. Validar produtos e realizar snapshot de preços
        const orderItems: OrderItemData[] = [];
        let subtotal = 0;
        let custoTotal = 0;

        for (const item of dto.items) {
            const product = await this.productRepository.findById(item.product_id);

            if (!product || product.user_id !== user_id) {
                throw new NotFoundError(`Produto com ID ${item.product_id} não encontrado ou não pertence ao usuário.`);
            }

            if (!product.ativo) {
                throw new ValidationError(`Produto "${product.nome}" está inativo.`);
            }

            // Snapshot de preços no momento da criação
            const precoVenda = product.preco_venda;
            const precoCusto = product.preco_custo || 0;

            subtotal += precoVenda * item.quantidade;
            custoTotal += precoCusto * item.quantidade;

            orderItems.push({
                product_id: item.product_id,
                quantidade: item.quantidade,
                preco_venda_unitario: precoVenda,
                preco_custo_unitario: precoCusto,
            });
        }

        // 3. Cálculos financeiros
        const taxaEntrega = dto.taxa_entrega || 0;
        const desconto = dto.desconto || 0;

        if (desconto > subtotal + taxaEntrega) {
            throw new ValidationError('O desconto não pode ser maior que o valor total da encomenda.');
        }

        const valorTotal = (subtotal + taxaEntrega) - desconto;
        const valorLucroTotal = (subtotal - custoTotal) - desconto;

        // 4. Montar objeto da order
        const orderData: OrderData = {
            user_id,
            client_id: dto.client_id,
            status: 'pendente',
            forma_pagamento: dto.forma_pagamento,
            status_pagamento: 'pendente',
            tipo_entrega: dto.tipo_entrega || 'retirada',
            taxa_entrega: taxaEntrega,
            data_entrega: dto.data_entrega,
            valor_subtotal: subtotal,
            desconto,
            valor_total: Math.max(valorTotal, 0),
            valor_lucro_total: valorLucroTotal,
            observacoes: dto.observacoes,
        };

        // 5. Criar de forma transacional via repository
        return await this.orderRepository.create(orderData, orderItems);
    }

    async getOrderById(id: number, user_id: number): Promise<OrderData | null> {
        const order = await this.orderRepository.findById(id);
        if (order && order.user_id === user_id) {
            return order;
        }
        return null;
    }

    async getOrdersByUserId(user_id: number): Promise<OrderData[]> {
        return await this.orderRepository.findByUserId(user_id);
    }

    async getByUserIdAndStatus(user_id: number, status: string[]): Promise<OrderData[]> {
        return await this.orderRepository.findByUserIdAndStatus(user_id, status);
    }

    async updateOrder(id: number, dto: UpdateOrderDTO, user_id: number): Promise<OrderData | null> {
        const existingOrder = await this.orderRepository.findById(id);
        if (!existingOrder || existingOrder.user_id !== user_id) {
            return null;
        }

        // validações de status e regras de negócio para atualização
        if (existingOrder.status === 'entregue' || existingOrder.status === 'cancelado') {
            throw new ValidationError('Pedido finalizado ou cancelado não pode ser alterado.');
        }

        // preparar valores base
        let subtotal = existingOrder.valor_subtotal ?? 0;
        const descontoExistente = existingOrder.desconto ?? 0;
        let custoTotal = subtotal - ((existingOrder.valor_lucro_total ?? 0) + descontoExistente);

        // Se itens foram enviados, recalcular tudo com snapshot de preços
        let orderItems: OrderItemData[] | undefined;
        if (dto.items && dto.items.length > 0) {
            orderItems = [];
            subtotal = 0;
            custoTotal = 0;

            for (const item of dto.items) {
                const product = await this.productRepository.findById(item.product_id);

                if (!product || product.user_id !== user_id) {
                    throw new NotFoundError(`Produto com ID ${item.product_id} não encontrado ou não pertence ao usuário.`);
                }

                if (!product.ativo) {
                    throw new ValidationError(`Produto "${product.nome}" está inativo.`);
                }

                const precoVenda = product.preco_venda;
                const precoCusto = product.preco_custo || 0;

                subtotal += precoVenda * item.quantidade;
                custoTotal += precoCusto * item.quantidade;

                orderItems.push({
                    product_id: item.product_id,
                    quantidade: item.quantidade,
                    preco_venda_unitario: precoVenda,
                    preco_custo_unitario: precoCusto,
                });
            }
        }

        // taxa_entrega e desconto (prioriza dto, senão usa existente)
        const taxaEntrega = dto.taxa_entrega !== undefined ? dto.taxa_entrega : (existingOrder.taxa_entrega ?? 0);
        const desconto = dto.desconto !== undefined ? dto.desconto : (existingOrder.desconto ?? 0);

        if (desconto > subtotal + taxaEntrega) {
            throw new ValidationError('O desconto não pode ser maior que o valor total da encomenda.');
        }

        const valorTotal = (subtotal + taxaEntrega) - desconto;
        const valorLucroTotal = (subtotal - custoTotal) - desconto;

        // Substituir itens se foram enviados
        if (orderItems) {
            await this.orderRepository.replaceItems(id, orderItems);
        }

        // construir objeto de atualização
        const updatedDto: any = {
            ...dto,
            valor_subtotal: subtotal,
            taxa_entrega: taxaEntrega,
            desconto,
            valor_total: Math.max(valorTotal, 0),
            valor_lucro_total: valorLucroTotal,
        };
        // Remove items from the DTO going to repository.update (items are handled separately)
        delete updatedDto.items;

        return await this.orderRepository.update(id, updatedDto);
    }

    async deleteOrder(id: number, user_id: number): Promise<boolean> {
        const existingOrder = await this.orderRepository.findById(id);
        if (!existingOrder || existingOrder.user_id !== user_id) {
            return false;
        }

        return await this.orderRepository.delete(id);
    }

    async updateOrderStatus(id: number, status: string, user_id: number): Promise<OrderData | null> {
        const existingOrder = await this.orderRepository.findById(id);
        if (!existingOrder || existingOrder.user_id !== user_id) {
            return null;
        }

        if (existingOrder.status === 'entregue' || existingOrder.status === 'cancelado') {
            throw new ValidationError('Pedido finalizado ou cancelado não pode ser alterado.');
        }

        return await this.orderRepository.updateStatus(id, status);
    }

    async updatePaymentStatus(id: number, status_pagamento: string, user_id: number): Promise<OrderData | null> {
        const existingOrder = await this.orderRepository.findById(id);
        if (!existingOrder || existingOrder.user_id !== user_id) {
            return null;
        }

        return await this.orderRepository.updatePaymentStatus(id, status_pagamento);
    }

    async getItemsByOrderId(order_id: number, user_id: number): Promise<OrderItemData[] | null> {
        const order = await this.orderRepository.findById(order_id);
        if (!order || order.user_id !== user_id) {
            return null;
        }

        return await this.orderRepository.findItemsByOrderId(order_id);
    }
}
