import { FastifyReply, FastifyRequest } from "fastify";

// ─── Tipos da tabela orders ──────────────────────────────

export interface OrderData {
  id?: number;
  user_id: number;
  client_id: number;
  status: string;
  forma_pagamento?: string;
  status_pagamento: string;
  tipo_entrega: string;
  taxa_entrega: number;
  data_entrega?: string;
  valor_subtotal: number;
  desconto: number;
  valor_total: number;
  valor_lucro_total?: number;
  observacoes?: string;
  data_pedido?: string;
  created_at?: string;
  updated_at?: string;
  items?: OrderItemData[];
}

export interface OrderItemData {
  id?: number;
  order_id?: number;
  product_id: number;
  produto_nome?: string;
  quantidade: number;
  preco_venda_unitario: number;
  preco_custo_unitario: number;
}

// ─── DTOs (vindos do frontend) ───────────────────────────

export interface CreateOrderItemDTO {
  product_id: number;
  quantidade: number;
}

export interface CreateOrderDTO {
  client_id: number;
  forma_pagamento?: string;
  tipo_entrega: string;
  taxa_entrega?: number;
  desconto?: number;
  data_entrega?: string;
  observacoes?: string;
  items: CreateOrderItemDTO[];
}

export interface UpdateOrderDTO {
  status?: string;
  forma_pagamento?: string;
  status_pagamento?: string;
  tipo_entrega?: string;
  taxa_entrega?: number;
  desconto?: number;
  data_entrega?: string;
  observacoes?: string;
}

// ─── Interfaces de contrato ──────────────────────────────

export interface IOrderRepository {
  create(order: OrderData, items: OrderItemData[]): Promise<OrderData>;
  findById(id: number): Promise<OrderData | null>;
  findByUserId(user_id: number): Promise<OrderData[]>;
  findByUserIdAndStatus(user_id: number, status: string[]): Promise<OrderData[]>;
  update(id: number, order: UpdateOrderDTO): Promise<OrderData | null>;
  updateStatus(id: number, status: string): Promise<OrderData | null>;
  updatePaymentStatus(id: number, status_pagamento: string): Promise<OrderData | null>;
  delete(id: number): Promise<boolean>;
  findItemsByOrderId(order_id: number): Promise<OrderItemData[]>;
}

export interface IOrderService {
  createOrder(dto: CreateOrderDTO, user_id: number): Promise<OrderData>;
  getOrderById(id: number, user_id: number): Promise<OrderData | null>;
  getOrdersByUserId(user_id: number): Promise<OrderData[]>;
  getByUserIdAndStatus(user_id: number, status: string[]): Promise<OrderData[]>;
  getItemsByOrderId(order_id: number, user_id: number): Promise<OrderItemData[] | null>;
  updateOrder(id: number, dto: UpdateOrderDTO, user_id: number): Promise<OrderData | null>;
  updateOrderStatus(id: number, status: string, user_id: number): Promise<OrderData | null>;
  updatePaymentStatus(id: number, status_pagamento: string, user_id: number): Promise<OrderData | null>;
  deleteOrder(id: number, user_id: number): Promise<boolean>;
}

export interface IOrderController {
  create(request: FastifyRequest, reply: FastifyReply): Promise<void>;
  getById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply): Promise<void>;
  getByUserId(request: FastifyRequest, reply: FastifyReply): Promise<void>;
  getByUserIdAndStatus(request: FastifyRequest, reply: FastifyReply): Promise<void>;
  getItemsByOrderId(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply): Promise<void>;  
  update(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply): Promise<void>;
  updateStatus(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply): Promise<void>;
  updatePaymentStatus(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply): Promise<void>;
  delete(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply): Promise<void>;
}
