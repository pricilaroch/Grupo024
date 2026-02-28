import { FastifyReply, FastifyRequest } from "fastify";

// ─── Movement (unified view of sales + paid expenses) ────

export interface MovementEntry {
  id: number;
  tipo: 'entrada' | 'saida';
  descricao: string;
  valor: number;
  data: string;
  categoria?: string;        // only for expenses
  forma_pagamento?: string;  // only for sales
  origem_id: number;         // original sale.id or expense.id
}

// ─── Goal / Meta ─────────────────────────────────────────

export interface GoalSummary {
  meta_valor: number;
  realizado: number;
  percentual: number;
  lucro_realizado: number;
  caixinha: number;           // 10% of lucro_realizado
}

// ─── Cash-flow balance ───────────────────────────────────

export interface BalanceSummary {
  total_vendas: number;       // Sum(sales.valor_total)
  despesas_pagas: number;     // Sum(expenses where status='pago')
  despesas_pendentes: number; // Sum(expenses where status='pendente')
  saldo_real: number;         // total_vendas - despesas_pagas
  saldo_projetado: number;    // total_vendas - despesas_pagas - despesas_pendentes
}

// ─── Interfaces de contrato ──────────────────────────────

export interface IAnalyticsService {
  getMovements(user_id: number): Promise<MovementEntry[]>;
  getBalance(user_id: number): Promise<BalanceSummary>;
  getGoalSummary(user_id: number, meta_valor: number): Promise<GoalSummary>;
}

export interface IAnalyticsController {
  movements(request: FastifyRequest, reply: FastifyReply): Promise<void>;
  balance(request: FastifyRequest, reply: FastifyReply): Promise<void>;
  goalSummary(request: FastifyRequest, reply: FastifyReply): Promise<void>;
}
