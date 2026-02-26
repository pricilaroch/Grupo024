import { IOrderRepository, OrderData, OrderItemData, UpdateOrderDTO } from "../models/Order";
import { Database } from 'sqlite';

export class OrderRepository implements IOrderRepository {
    private db: Database;

    constructor(db: Database) {
        this.db = db;
    }

    /**
     * Cria uma encomenda e seus itens dentro de uma transação.
     */
    async create(order: OrderData, items: OrderItemData[]): Promise<OrderData> {
        try {
            await this.db.run('BEGIN TRANSACTION');

            const result = await this.db.run(
                `INSERT INTO orders (
                    user_id, client_id, status, forma_pagamento, status_pagamento,
                    tipo_entrega, taxa_entrega, data_entrega, valor_subtotal,
                    desconto, valor_total, valor_lucro_total, observacoes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                order.user_id,
                order.client_id,
                order.status || 'pendente',
                order.forma_pagamento || null,
                order.status_pagamento || 'pendente',
                order.tipo_entrega || 'retirada',
                order.taxa_entrega || 0,
                order.data_entrega || null,
                order.valor_subtotal,
                order.desconto || 0,
                order.valor_total,
                order.valor_lucro_total || null,
                order.observacoes || null
            );

            if (result.lastID === undefined) {
                throw new Error('Erro ao criar encomenda');
            }

            const orderId = result.lastID;

            for (const item of items) {
                await this.db.run(
                    `INSERT INTO order_items (order_id, product_id, quantidade, preco_venda_unitario, preco_custo_unitario)
                     VALUES (?, ?, ?, ?, ?)`,
                    orderId,
                    item.product_id,
                    item.quantidade,
                    item.preco_venda_unitario,
                    item.preco_custo_unitario
                );
            }

            await this.db.run('COMMIT');

            const created = await this.findById(orderId);
            if (!created) {
                throw new Error('Erro ao recuperar encomenda criada');
            }
            return created;

        } catch (error) {
            await this.db.run('ROLLBACK');
            throw error;
        }
    }

    async findById(id: number): Promise<OrderData | null> {
        const order: OrderData | undefined = await this.db.get(
            `SELECT * FROM orders WHERE id = ?`,
            id
        );

        if (!order) {
            return null;
        }

        const items = await this.findItemsByOrderId(order.id!);

        return {
            id: order.id,
            user_id: order.user_id,
            client_id: order.client_id,
            status: order.status,
            forma_pagamento: order.forma_pagamento,
            status_pagamento: order.status_pagamento,
            tipo_entrega: order.tipo_entrega,
            taxa_entrega: order.taxa_entrega,
            data_entrega: order.data_entrega,
            valor_subtotal: order.valor_subtotal,
            desconto: order.desconto,
            valor_total: order.valor_total,
            valor_lucro_total: order.valor_lucro_total,
            observacoes: order.observacoes,
            data_pedido: order.data_pedido,
            created_at: order.created_at,
            updated_at: order.updated_at,
            items,
        };
    }

    async findByUserId(user_id: number): Promise<OrderData[]> {
        const orders: OrderData[] = await this.db.all(
            `SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC`,
            user_id
        );

        const result: OrderData[] = [];
        for (const order of orders) {
            const items = await this.findItemsByOrderId(order.id!);
            result.push({
                id: order.id,
                user_id: order.user_id,
                client_id: order.client_id,
                status: order.status,
                forma_pagamento: order.forma_pagamento,
                status_pagamento: order.status_pagamento,
                tipo_entrega: order.tipo_entrega,
                taxa_entrega: order.taxa_entrega,
                data_entrega: order.data_entrega,
                valor_subtotal: order.valor_subtotal,
                desconto: order.desconto,
                valor_total: order.valor_total,
                valor_lucro_total: order.valor_lucro_total,
                observacoes: order.observacoes,
                data_pedido: order.data_pedido,
                created_at: order.created_at,
                updated_at: order.updated_at,
                items,
            });
        }

        return result;
    }

    async findByUserIdAndStatus(user_id: number, status: string[]): Promise<OrderData[]> {
        const orders: OrderData[] = await this.db.all(
            `SELECT * FROM orders WHERE user_id = ? AND status IN (${status.map(() => '?').join(',')}) ORDER BY created_at DESC`,
            [user_id, ...status]
        );
        
        const result: OrderData[] = [];
        for (const order of orders) {
            const items: OrderItemData[] = await this.findItemsByOrderId(order.id!);
            result.push({
                id: order.id,
                user_id: order.user_id,
                client_id: order.client_id,
                status: order.status,
                forma_pagamento: order.forma_pagamento,
                status_pagamento: order.status_pagamento,
                tipo_entrega: order.tipo_entrega,
                taxa_entrega: order.taxa_entrega,
                data_entrega: order.data_entrega,
                valor_subtotal: order.valor_subtotal,
                desconto: order.desconto,
                valor_total: order.valor_total,
                valor_lucro_total: order.valor_lucro_total,
                observacoes: order.observacoes,
                data_pedido: order.data_pedido,
                created_at: order.created_at,
                updated_at: order.updated_at,
                items,
            });
        }

        return result;
    }

    async update(id: number, order: UpdateOrderDTO & { valor_subtotal?: number; valor_total?: number; valor_lucro_total?: number }): Promise<OrderData | null> {
        const existing = await this.findById(id);
        if (!existing) {
            return null;
        }

        await this.db.run(
            `UPDATE orders SET
                status = ?,
                forma_pagamento = ?,
                status_pagamento = ?,
                tipo_entrega = ?,
                taxa_entrega = ?,
                desconto = ?,
                data_entrega = ?,
                observacoes = ?,
                valor_subtotal = ?,
                valor_total = ?,
                valor_lucro_total = ?
            WHERE id = ?`,
            order.status ?? existing.status,
            order.forma_pagamento ?? existing.forma_pagamento,
            order.status_pagamento ?? existing.status_pagamento,
            order.tipo_entrega ?? existing.tipo_entrega,
            order.taxa_entrega ?? existing.taxa_entrega,
            order.desconto ?? existing.desconto,
            order.data_entrega ?? existing.data_entrega,
            order.observacoes ?? existing.observacoes,
            order.valor_subtotal ?? existing.valor_subtotal,
            order.valor_total ?? existing.valor_total,
            order.valor_lucro_total ?? existing.valor_lucro_total,
            id
        );

        return this.findById(id);
    }

    /**
     * Substitui todos os itens de uma encomenda dentro de uma transação.
     */
    async replaceItems(orderId: number, items: OrderItemData[]): Promise<void> {
        try {
            await this.db.run('BEGIN TRANSACTION');

            await this.db.run(`DELETE FROM order_items WHERE order_id = ?`, orderId);

            for (const item of items) {
                await this.db.run(
                    `INSERT INTO order_items (order_id, product_id, quantidade, preco_venda_unitario, preco_custo_unitario)
                     VALUES (?, ?, ?, ?, ?)`,
                    orderId,
                    item.product_id,
                    item.quantidade,
                    item.preco_venda_unitario,
                    item.preco_custo_unitario
                );
            }

            await this.db.run('COMMIT');
        } catch (error) {
            await this.db.run('ROLLBACK');
            throw error;
        }
    }

    async updateStatus(id: number, status: string): Promise<OrderData | null> {
        const result = await this.db.run(
            `UPDATE orders SET status = ? WHERE id = ?`,
            status,
            id
        );

        if (result.changes === 0) {
            return null;
        }

        return this.findById(id);
    }

    async delete(id: number): Promise<boolean> {
        const result = await this.db.run(
            `DELETE FROM orders WHERE id = ?`,
            id
        );

        return result.changes ? result.changes > 0 : false;
    }

    async updatePaymentStatus(id: number, status_pagamento: string): Promise<OrderData | null> {
        const result = await this.db.run(
            `UPDATE orders SET status_pagamento = ? WHERE id = ?`,
            status_pagamento,
            id
        );

        if (result.changes === 0) {
            return null;
        }

        return this.findById(id);
    }

    async findItemsByOrderId(order_id: number): Promise<OrderItemData[]> {
        const items: any[] = await this.db.all(
            `SELECT oi.*, p.nome AS produto_nome
             FROM order_items oi
             LEFT JOIN products p ON p.id = oi.product_id
             WHERE oi.order_id = ?`,
            order_id
        );

        return items.map(item => ({
            id: item.id,
            order_id: item.order_id,
            product_id: item.product_id,
            produto_nome: item.produto_nome || null,
            quantidade: item.quantidade,
            preco_venda_unitario: item.preco_venda_unitario,
            preco_custo_unitario: item.preco_custo_unitario,
        }));
    }
}
