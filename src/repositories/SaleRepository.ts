import { ISaleRepository, SaleData } from "../models/Sale";
import { Database } from 'sqlite';

export class SaleRepository implements ISaleRepository {
    private db: Database;

    constructor(db: Database) {
        this.db = db;
    }

    async create(sale: SaleData): Promise<SaleData> {
        const result = await this.db.run(
            `INSERT INTO sales (user_id, client_id, order_id, valor_total, valor_lucro, forma_pagamento, data_venda, descricao)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            sale.user_id,
            sale.client_id ?? null,
            sale.order_id ?? null,
            sale.valor_total,
            sale.valor_lucro,
            sale.forma_pagamento,
            sale.data_venda || new Date().toISOString(),
            sale.descricao ?? null
        );

        if (result.lastID === undefined) {
            throw new Error('Erro ao criar venda');
        }

        const created = await this.findById(result.lastID);
        if (!created) {
            throw new Error('Erro ao recuperar venda criada');
        }
        return created;
    }

    async findById(id: number): Promise<SaleData | null> {
        const sale: SaleData | undefined = await this.db.get(
            `SELECT * FROM sales WHERE id = ?`,
            id
        );

        if (!sale) return null;

        return {
            id: sale.id,
            user_id: sale.user_id,
            client_id: sale.client_id,
            order_id: sale.order_id,
            valor_total: sale.valor_total,
            valor_lucro: sale.valor_lucro,
            forma_pagamento: sale.forma_pagamento,
            data_venda: sale.data_venda,
            descricao: sale.descricao,
            created_at: sale.created_at,
            updated_at: sale.updated_at,
        };
    }

    async findByUserId(user_id: number): Promise<SaleData[]> {
        const sales: SaleData[] = await this.db.all(
            `SELECT * FROM sales WHERE user_id = ? ORDER BY data_venda DESC`,
            user_id
        );

        return sales.map(sale => ({
            id: sale.id,
            user_id: sale.user_id,
            client_id: sale.client_id,
            order_id: sale.order_id,
            valor_total: sale.valor_total,
            valor_lucro: sale.valor_lucro,
            forma_pagamento: sale.forma_pagamento,
            data_venda: sale.data_venda,
            descricao: sale.descricao,
            created_at: sale.created_at,
            updated_at: sale.updated_at,
        }));
    }

    async findByOrderId(order_id: number): Promise<SaleData | null> {
        const sale: SaleData | undefined = await this.db.get(
            `SELECT * FROM sales WHERE order_id = ?`,
            order_id
        );

        if (!sale) return null;

        return {
            id: sale.id,
            user_id: sale.user_id,
            client_id: sale.client_id,
            order_id: sale.order_id,
            valor_total: sale.valor_total,
            valor_lucro: sale.valor_lucro,
            forma_pagamento: sale.forma_pagamento,
            data_venda: sale.data_venda,
            descricao: sale.descricao,
            created_at: sale.created_at,
            updated_at: sale.updated_at,
        };
    }

    async update(id: number, data: Partial<SaleData>): Promise<SaleData | null> {
        const fields: string[] = [];
        const values: any[] = [];

        if (data.client_id !== undefined) { fields.push('client_id = ?'); values.push(data.client_id); }
        if (data.valor_total !== undefined) { fields.push('valor_total = ?'); values.push(data.valor_total); }
        if (data.valor_lucro !== undefined) { fields.push('valor_lucro = ?'); values.push(data.valor_lucro); }
        if (data.forma_pagamento !== undefined) { fields.push('forma_pagamento = ?'); values.push(data.forma_pagamento); }
        if (data.data_venda !== undefined) { fields.push('data_venda = ?'); values.push(data.data_venda); }
        if (data.descricao !== undefined) { fields.push('descricao = ?'); values.push(data.descricao); }

        if (fields.length === 0) return this.findById(id);

        fields.push('updated_at = CURRENT_TIMESTAMP');
        values.push(id);

        await this.db.run(
            `UPDATE sales SET ${fields.join(', ')} WHERE id = ?`,
            ...values
        );

        return this.findById(id);
    }

    async delete(id: number): Promise<boolean> {
        const result = await this.db.run(
            `DELETE FROM sales WHERE id = ?`,
            id
        );
        return result.changes ? result.changes > 0 : false;
    }
}
