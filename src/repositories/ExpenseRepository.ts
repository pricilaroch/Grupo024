import { IExpenseRepository, ExpenseData, ExpenseSummary } from "../models/Expense";
import { Database } from 'sqlite';

export class ExpenseRepository implements IExpenseRepository {
    private db: Database;

    constructor(db: Database) {
        this.db = db;
    }

    async create(expense: ExpenseData): Promise<ExpenseData> {
        const result = await this.db.run(
            `INSERT INTO expenses (user_id, valor, categoria, descricao, data_emissao, data_vencimento, status)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            expense.user_id,
            expense.valor,
            expense.categoria,
            expense.descricao ?? null,
            expense.data_emissao || new Date().toISOString(),
            expense.data_vencimento ?? null,
            expense.status || 'pendente'
        );

        if (result.lastID === undefined) {
            throw new Error('Erro ao criar despesa');
        }

        const created = await this.findById(result.lastID);
        if (!created) {
            throw new Error('Erro ao recuperar despesa criada');
        }
        return created;
    }

    async findById(id: number): Promise<ExpenseData | null> {
        const row: ExpenseData | undefined = await this.db.get(
            `SELECT * FROM expenses WHERE id = ?`,
            id
        );

        if (!row) return null;

        return this.mapRow(row);
    }

    async findByUserId(user_id: number): Promise<ExpenseData[]> {
        const rows: ExpenseData[] = await this.db.all(
            `SELECT * FROM expenses WHERE user_id = ? ORDER BY data_vencimento DESC, created_at DESC`,
            user_id
        );

        return rows.map(r => this.mapRow(r));
    }

    async findByStatus(user_id: number, status: string): Promise<ExpenseData[]> {
        const rows: ExpenseData[] = await this.db.all(
            `SELECT * FROM expenses WHERE user_id = ? AND status = ? ORDER BY data_vencimento ASC`,
            user_id,
            status
        );

        return rows.map(r => this.mapRow(r));
    }

    async findByDueDateRange(user_id: number, from: string, to: string): Promise<ExpenseData[]> {
        const rows: ExpenseData[] = await this.db.all(
            `SELECT * FROM expenses WHERE user_id = ? AND data_vencimento >= ? AND data_vencimento <= ? ORDER BY data_vencimento ASC`,
            user_id,
            from,
            to
        );

        return rows.map(r => this.mapRow(r));
    }

    async update(id: number, data: Partial<ExpenseData>): Promise<ExpenseData | null> {
        const fields: string[] = [];
        const values: any[] = [];

        if (data.valor !== undefined) { fields.push('valor = ?'); values.push(data.valor); }
        if (data.categoria !== undefined) { fields.push('categoria = ?'); values.push(data.categoria); }
        if (data.descricao !== undefined) { fields.push('descricao = ?'); values.push(data.descricao); }
        if (data.data_emissao !== undefined) { fields.push('data_emissao = ?'); values.push(data.data_emissao); }
        if (data.data_vencimento !== undefined) { fields.push('data_vencimento = ?'); values.push(data.data_vencimento); }
        if (data.status !== undefined) { fields.push('status = ?'); values.push(data.status); }

        if (fields.length === 0) return this.findById(id);

        fields.push('updated_at = CURRENT_TIMESTAMP');
        values.push(id);

        await this.db.run(
            `UPDATE expenses SET ${fields.join(', ')} WHERE id = ?`,
            ...values
        );

        return this.findById(id);
    }

    async updateStatus(id: number, status: string): Promise<ExpenseData | null> {
        await this.db.run(
            `UPDATE expenses SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            status,
            id
        );
        return this.findById(id);
    }

    async delete(id: number): Promise<boolean> {
        const result = await this.db.run(
            `DELETE FROM expenses WHERE id = ?`,
            id
        );
        return (result.changes ?? 0) > 0;
    }

    async getMonthlySummary(user_id: number): Promise<ExpenseSummary[]> {
        const rows = await this.db.all(
            `SELECT
                strftime('%Y-%m', data_emissao) AS month,
                categoria,
                SUM(valor) AS total,
                COUNT(*) AS count
             FROM expenses
             WHERE user_id = ?
             GROUP BY month, categoria
             ORDER BY month DESC`,
            user_id
        );

        // Agregar por mês
        const monthMap: Record<string, ExpenseSummary> = {};
        for (const row of rows as any[]) {
            if (!monthMap[row.month]) {
                monthMap[row.month] = {
                    month: row.month,
                    total: 0,
                    count: 0,
                    by_category: {},
                };
            }
            monthMap[row.month].total += row.total;
            monthMap[row.month].count += row.count;
            monthMap[row.month].by_category[row.categoria] = row.total;
        }

        return Object.values(monthMap);
    }

    private mapRow(row: ExpenseData): ExpenseData {
        return {
            id: row.id,
            user_id: row.user_id,
            valor: row.valor,
            categoria: row.categoria,
            descricao: row.descricao,
            data_emissao: row.data_emissao,
            data_vencimento: row.data_vencimento,
            status: row.status,
            created_at: row.created_at,
            updated_at: row.updated_at,
        };
    }
}
