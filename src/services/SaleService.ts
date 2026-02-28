import {
    CreateSaleDTO,
    UpdateSaleDTO,
    ISaleRepository,
    ISaleService,
    SaleData,
} from "../models/Sale";
import { IOrderRepository } from "../models/Order";
import { IClientRepository } from "../models/Client";
import { NotFoundError, ValidationError } from "../errors/AppError";

/** Margem padrão usada quando valor_lucro não é informado em vendas manuais */
const DEFAULT_PROFIT_MARGIN = 0.3; // 30%

export class SaleService implements ISaleService {
    private saleRepository: ISaleRepository;
    private orderRepository: IOrderRepository;
    private clientRepository: IClientRepository;

    constructor(
        saleRepository: ISaleRepository,
        orderRepository: IOrderRepository,
        clientRepository: IClientRepository
    ) {
        this.saleRepository = saleRepository;
        this.orderRepository = orderRepository;
        this.clientRepository = clientRepository;
    }

    /**
     * Cria uma venda simplificada (manual, sem order_id).
     * Se valor_lucro não for informado, calcula com margem padrão de 30%.
     */
    async createSale(dto: CreateSaleDTO, user_id: number): Promise<SaleData> {
        // Validar cliente se fornecido
        if (dto.client_id) {
            const client = await this.clientRepository.findById(dto.client_id);
            if (!client || client.user_id !== user_id) {
                throw new NotFoundError('Cliente não encontrado ou não pertence ao usuário.');
            }
        }

        const valorLucro = dto.valor_lucro !== undefined
            ? dto.valor_lucro
            : dto.valor_total * DEFAULT_PROFIT_MARGIN;

        const saleData: SaleData = {
            user_id,
            client_id: dto.client_id ?? null,
            order_id: null,
            valor_total: dto.valor_total,
            valor_lucro: valorLucro,
            forma_pagamento: dto.forma_pagamento,
            data_venda: dto.data_venda,
            descricao: dto.descricao,
        };

        return await this.saleRepository.create(saleData);
    }

    /**
     * Cria um registro no livro caixa a partir de uma encomenda paga.
     * Transpõe valor_total e valor_lucro_total da order para a sale.
     * Se já existe uma sale para este order_id, não duplica.
     */
    async createFromOrder(orderId: number, user_id: number): Promise<SaleData> {
        const order = await this.orderRepository.findById(orderId);
        if (!order || order.user_id !== user_id) {
            throw new NotFoundError('Encomenda não encontrada ou não pertence ao usuário.');
        }

        // Evitar duplicatas
        const existing = await this.saleRepository.findByOrderId(orderId);
        if (existing) {
            return existing;
        }

        const saleData: SaleData = {
            user_id,
            client_id: order.client_id,
            order_id: order.id!,
            valor_total: order.valor_total,
            valor_lucro: order.valor_lucro_total ?? 0,
            forma_pagamento: order.forma_pagamento || 'dinheiro',
            data_venda: new Date().toISOString(),
            descricao: `Encomenda #${order.id}`,
        };

        return await this.saleRepository.create(saleData);
    }

    async getSalesByUserId(user_id: number): Promise<SaleData[]> {
        return await this.saleRepository.findByUserId(user_id);
    }

    async updateSale(id: number, dto: UpdateSaleDTO, user_id: number): Promise<SaleData> {
        const sale = await this.saleRepository.findById(id);
        if (!sale || sale.user_id !== user_id) {
            throw new NotFoundError('Venda não encontrada ou não pertence ao usuário.');
        }

        // Validar novo client_id se fornecido
        if (dto.client_id !== undefined && dto.client_id !== null) {
            const client = await this.clientRepository.findById(dto.client_id);
            if (!client || client.user_id !== user_id) {
                throw new NotFoundError('Cliente não encontrado ou não pertence ao usuário.');
            }
        }

        const updated = await this.saleRepository.update(id, dto as Partial<SaleData>);
        if (!updated) {
            throw new NotFoundError('Erro ao atualizar venda.');
        }
        return updated;
    }

    async deleteSale(id: number, user_id: number): Promise<boolean> {
        const sale = await this.saleRepository.findById(id);
        if (!sale || sale.user_id !== user_id) {
            return false;
        }
        return await this.saleRepository.delete(id);
    }

    async getFollowUpAvg(user_id: number): Promise<{ avg_days: number; count: number }> {
        return await this.saleRepository.getFollowUpAvg(user_id);
    }
}
