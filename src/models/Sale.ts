import { FastifyReply, FastifyRequest } from "fastify";

// ─── Tipos da tabela sales ───────────────────────────────

export interface SaleData {
  id?: number;
  user_id: number;
  client_id?: number | null;
  order_id?: number | null;
  valor_total: number;
  valor_lucro: number;
  forma_pagamento: string;
  data_venda?: string;
  descricao?: string;
  created_at?: string;
  updated_at?: string;
}

// ─── DTOs ────────────────────────────────────────────────

export interface CreateSaleDTO {
  client_id?: number | null;
  valor_total: number;
  valor_lucro?: number;
  forma_pagamento: string;
  data_venda?: string;
  descricao?: string;
}

export interface UpdateSaleDTO {
  client_id?: number | null;
  valor_total?: number;
  valor_lucro?: number;
  forma_pagamento?: string;
  data_venda?: string;
  descricao?: string;
}

// ─── Interfaces de contrato ──────────────────────────────

export interface ISaleRepository {
  create(sale: SaleData): Promise<SaleData>;
  findById(id: number): Promise<SaleData | null>;
  findByUserId(user_id: number): Promise<SaleData[]>;
  findByOrderId(order_id: number): Promise<SaleData | null>;
  update(id: number, data: Partial<SaleData>): Promise<SaleData | null>;
  delete(id: number): Promise<boolean>;
}

export interface ISaleService {
  createSale(dto: CreateSaleDTO, user_id: number): Promise<SaleData>;
  createFromOrder(orderId: number, user_id: number): Promise<SaleData>;
  getSalesByUserId(user_id: number): Promise<SaleData[]>;
  updateSale(id: number, dto: UpdateSaleDTO, user_id: number): Promise<SaleData>;
  deleteSale(id: number, user_id: number): Promise<boolean>;
}

export interface ISaleController {
  create(request: FastifyRequest, reply: FastifyReply): Promise<void>;
  getByUserId(request: FastifyRequest, reply: FastifyReply): Promise<void>;
  update(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply): Promise<void>;
  delete(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply): Promise<void>;
}
