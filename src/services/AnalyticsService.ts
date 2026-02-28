import {
    IAnalyticsService,
    MovementEntry,
    BalanceSummary,
    GoalSummary,
} from "../models/Analytics";
import { ISaleRepository } from "../models/Sale";
import { IExpenseRepository } from "../models/Expense";

/**
 * AnalyticsService — Cálculos financeiros centralizados (verdade única).
 * Não acessa banco diretamente; depende dos repositórios existentes.
 */
export class AnalyticsService implements IAnalyticsService {
    private saleRepo: ISaleRepository;
    private expenseRepo: IExpenseRepository;

    constructor(saleRepo: ISaleRepository, expenseRepo: IExpenseRepository) {
        this.saleRepo = saleRepo;
        this.expenseRepo = expenseRepo;
    }

    /**
     * Extrato unificado: UNION lógico de sales + expenses (status='pago'),
     * ordenado por data decrescente.
     */
    async getMovements(user_id: number): Promise<MovementEntry[]> {
        const [sales, paidExpenses] = await Promise.all([
            this.saleRepo.findByUserId(user_id),
            this.expenseRepo.findByStatus(user_id, 'pago'),
        ]);

        const entries: MovementEntry[] = [];

        for (const s of sales) {
            entries.push({
                id: s.id!,
                tipo: 'entrada',
                descricao: s.descricao || (s.order_id ? `Encomenda #${s.order_id}` : 'Venda manual'),
                valor: s.valor_total,
                data: s.data_venda || s.created_at || '',
                forma_pagamento: s.forma_pagamento,
                origem_id: s.id!,
            });
        }

        for (const e of paidExpenses) {
            entries.push({
                id: e.id!,
                tipo: 'saida',
                descricao: e.descricao || e.categoria,
                valor: e.valor,
                data: e.data_emissao || e.created_at || '',
                categoria: e.categoria,
                origem_id: e.id!,
            });
        }

        // Ordenar por data decrescente
        entries.sort((a, b) => {
            const da = a.data ? new Date(a.data).getTime() : 0;
            const db = b.data ? new Date(b.data).getTime() : 0;
            return db - da;
        });

        return entries;
    }

    /**
     * Saldo Real = Σ(Sales) − Σ(Expenses pagas)
     * Saldo Projetado = Σ(Sales) − Σ(Expenses pagas) − Σ(Expenses pendentes)
     */
    async getBalance(user_id: number): Promise<BalanceSummary> {
        const [sales, paidExpenses, pendingExpenses] = await Promise.all([
            this.saleRepo.findByUserId(user_id),
            this.expenseRepo.findByStatus(user_id, 'pago'),
            this.expenseRepo.findByStatus(user_id, 'pendente'),
        ]);

        const totalVendas = sales.reduce((sum, s) => sum + (s.valor_total || 0), 0);
        const despesasPagas = paidExpenses.reduce((sum, e) => sum + (e.valor || 0), 0);
        const despesasPendentes = pendingExpenses.reduce((sum, e) => sum + (e.valor || 0), 0);

        return {
            total_vendas: totalVendas,
            despesas_pagas: despesasPagas,
            despesas_pendentes: despesasPendentes,
            saldo_real: totalVendas - despesasPagas,
            saldo_projetado: totalVendas - despesasPagas - despesasPendentes,
        };
    }

    /**
     * Motor de Metas: compara o faturamento do mês corrente com a meta informada.
     */
    async getGoalSummary(user_id: number, meta_valor: number): Promise<GoalSummary> {
        const sales = await this.saleRepo.findByUserId(user_id);

        // Filtrar vendas do mês corrente
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

        const monthSales = sales.filter(s => {
            const d = s.data_venda ? new Date(s.data_venda) : null;
            return d && d >= monthStart && d < monthEnd;
        });

        const realizado = monthSales.reduce((sum, s) => sum + (s.valor_total || 0), 0);
        const lucroRealizado = monthSales.reduce((sum, s) => sum + (s.valor_lucro || 0), 0);
        const percentual = meta_valor > 0 ? Math.min((realizado / meta_valor) * 100, 100) : 0;

        return {
            meta_valor,
            realizado,
            percentual: Math.round(percentual * 100) / 100,
            lucro_realizado: lucroRealizado,
            caixinha: lucroRealizado * 0.1,
        };
    }
}
