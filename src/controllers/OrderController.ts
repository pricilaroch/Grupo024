import { FastifyRequest, FastifyReply } from "fastify";
import { IOrderController, IOrderService, CreateOrderDTO, UpdateOrderDTO } from "../models/Order";
import { createOrderSchema, updateOrderSchema } from "../schemas/order.schema";

export class OrderController implements IOrderController {
    private orderService: IOrderService;

    constructor(orderService: IOrderService) {
        this.orderService = orderService;
    }

    async create(request: FastifyRequest, reply: FastifyReply): Promise<void> {
        const user_id = request.user.id;
        const dto: CreateOrderDTO = createOrderSchema.parse(request.body);

        const order = await this.orderService.createOrder(dto, user_id);
        
        reply.status(201).send(order);
    }

    async getById(
        request: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply
    ): Promise<void> {
        const user_id = request.user.id;
        const id = Number(request.params.id);
        if (isNaN(id)) {
            reply.status(400).send({ error: 'ID inválido' });
            return;
        }

        const order = await this.orderService.getOrderById(id, user_id);
        if (!order) {
            reply.status(404).send({ error: 'Encomenda não encontrada ou acesso negado.' });
            return;
        }
        reply.status(200).send(order);
    }

    async getByUserId(request: FastifyRequest, reply: FastifyReply): Promise<void> {
        const user_id = request.user.id;
        const orders = await this.orderService.getOrdersByUserId(user_id);
        reply.status(200).send(orders);
    }

    async getByUserIdAndStatus(
        request: FastifyRequest<{ Querystring: { status?: string | string[] } }>,
        reply: FastifyReply
    ): Promise<void> {
        const user_id = request.user.id;
        const status = request.query.status;
        if (!status) {
            reply.status(400).send({ error: 'Status é obrigatório' });
            return;
        }

        const orders = await this.orderService.getByUserIdAndStatus(user_id, Array.isArray(status) ? status : [status]);
        reply.status(200).send(orders);
    }

    async getItemsByOrderId(
        request: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply
    ): Promise<void> {
        const user_id = request.user.id;
        const order_id = Number(request.params.id);
        if (isNaN(order_id)) {
            reply.status(400).send({ error: 'ID de encomenda inválido' });
            return;
        }

        const items = await this.orderService.getItemsByOrderId(order_id, user_id);
        if (items === null) {
            reply.status(404).send({ error: 'Encomenda não encontrada ou acesso negado.' });
            return;
        }
        reply.status(200).send(items);
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

        const dto: UpdateOrderDTO = updateOrderSchema.parse(request.body);
        if (Object.keys(dto).length === 0) {
            reply.status(400).send({ error: 'Nenhum campo recebido para atualização' });
            return;
        }

        const updatedOrder = await this.orderService.updateOrder(id, dto, user_id);
        if (!updatedOrder) {
            reply.status(404).send({ error: 'Encomenda não encontrada ou acesso negado.' });
            return;
        }
        reply.status(200).send(updatedOrder);
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

        const success = await this.orderService.deleteOrder(id, user_id);
        if (!success) {
            reply.status(404).send({ error: 'Encomenda não encontrada ou acesso negado.' });
            return;
        }
        reply.status(204).send();
    }
}
