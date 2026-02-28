import { FastifyReply, FastifyRequest } from "fastify";

// ─── Tipos da tabela expenses ────────────────────────────

export interface ExpenseData {
  id?: number;
  user_id: number;
  valor: number;
  categoria: string;
  descricao?: string;
  data_emissao?: string;
  data_vencimento?: string;
  status: string; // 'pendente' | 'pago'
  created_at?: string;
  updated_at?: string;
}

// ─── DTOs ────────────────────────────────────────────────

export interface CreateExpenseDTO {
  valor: number;
  categoria: string;
  descricao?: string;
  data_emissao?: string;
  data_vencimento?: string;
}

export interface UpdateExpenseDTO {
  valor?: number;
  categoria?: string;
  descricao?: string;
  data_emissao?: string;
  data_vencimento?: string;
}

// ─── Summary ─────────────────────────────────────────────

export interface ExpenseSummary {
  month: string;
  total: number;
  count: number;
  by_category: Record<string, number>;
}

// ─── Interfaces de contrato ──────────────────────────────

export interface IExpenseRepository {
  create(expense: ExpenseData): Promise<ExpenseData>;
  findById(id: number): Promise<ExpenseData | null>;
  findByUserId(user_id: number): Promise<ExpenseData[]>;
  findByStatus(user_id: number, status: string): Promise<ExpenseData[]>;
  findByDueDateRange(user_id: number, from: string, to: string): Promise<ExpenseData[]>;
  update(id: number, data: Partial<ExpenseData>): Promise<ExpenseData | null>;
  updateStatus(id: number, status: string): Promise<ExpenseData | null>;
  delete(id: number): Promise<boolean>;
  getMonthlySummary(user_id: number): Promise<ExpenseSummary[]>;
}

export interface IExpenseService {
  createExpense(dto: CreateExpenseDTO, user_id: number): Promise<ExpenseData>;
  getExpensesByUserId(user_id: number): Promise<ExpenseData[]>;
  getExpensesByStatus(user_id: number, status: string): Promise<ExpenseData[]>;
  payExpense(id: number, user_id: number): Promise<ExpenseData>;
  updateExpense(id: number, dto: UpdateExpenseDTO, user_id: number): Promise<ExpenseData>;
  deleteExpense(id: number, user_id: number): Promise<boolean>;
  getMonthlySummary(user_id: number): Promise<ExpenseSummary[]>;
}

export interface IExpenseController {
  create(request: FastifyRequest, reply: FastifyReply): Promise<void>;
  getByUserId(request: FastifyRequest, reply: FastifyReply): Promise<void>;
  pay(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply): Promise<void>;
  update(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply): Promise<void>;
  delete(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply): Promise<void>;
  summary(request: FastifyRequest, reply: FastifyReply): Promise<void>;
}
