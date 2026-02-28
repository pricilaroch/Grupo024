import { FastifyRequest, FastifyReply } from "fastify";
import { ISaleController, ISaleService, CreateSaleDTO, UpdateSaleDTO } from "../models/Sale";
import { createSaleSchema, updateSaleSchema } from "../schemas/sale.schema";

export class SaleController implements ISaleController {
    private saleService: ISaleService;

    constructor(saleService: ISaleService) {
        this.saleService = saleService;
    }

    async create(request: FastifyRequest, reply: FastifyReply): Promise<void> {
        const user_id = request.user.id;
        const dto: CreateSaleDTO = createSaleSchema.parse(request.body);

        const sale = await this.saleService.createSale(dto, user_id);

        reply.status(201).send(sale);
    }

    async getByUserId(request: FastifyRequest, reply: FastifyReply): Promise<void> {
        const user_id = request.user.id;
        const sales = await this.saleService.getSalesByUserId(user_id);
        reply.status(200).send(sales);
    }

    async update(
        request: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply
    ): Promise<void> {
        const user_id = request.user.id;
        const id = Number(request.params.id);
        if (isNaN(id)) {
            reply.status(400).send({ error: 'ID inválido' });
            return;
        }

        const dto: UpdateSaleDTO = updateSaleSchema.parse(request.body);
        const sale = await this.saleService.updateSale(id, dto, user_id);
        reply.status(200).send(sale);
    }

    async delete(
        request: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply
    ): Promise<void> {
        const user_id = request.user.id;
        const id = Number(request.params.id);
        if (isNaN(id)) {
            reply.status(400).send({ error: 'ID inválido' });
            return;
        }

        const deleted = await this.saleService.deleteSale(id, user_id);
        if (!deleted) {
            reply.status(404).send({ error: 'Venda não encontrada ou acesso negado.' });
            return;
        }
        reply.status(204).send();
    }
}
