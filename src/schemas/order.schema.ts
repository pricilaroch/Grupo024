import { z } from 'zod';

/**
 * Schema de um item da encomenda (na criação).
 */
const orderItemSchema = z.object({
  product_id: z
    .number({ error: 'O campo "product_id" é obrigatório.' })
    .int('O product_id deve ser um número inteiro.')
    .positive('O product_id deve ser positivo.'),

  quantidade: z
    .number({ error: 'O campo "quantidade" é obrigatório.' })
    .int('A quantidade deve ser um número inteiro.')
    .positive('A quantidade deve ser maior que zero.'),
});

/**
 * Schema de validação para criação de encomenda.
 */
export const createOrderSchema = z.object({
  client_id: z
    .number({ error: 'O campo "client_id" é obrigatório.' })
    .int('O client_id deve ser um número inteiro.')
    .positive('O client_id deve ser positivo.'),

  forma_pagamento: z
    .enum(['pix', 'dinheiro', 'cartao_credito', 'cartao_debito'], {
      error: 'Forma de pagamento inválida.',
    })
    .optional(),

  tipo_entrega: z
    .enum(['retirada', 'entrega'], {
      error: 'Tipo de entrega inválido. Use "retirada" ou "entrega".',
    })
    .default('retirada'),

  taxa_entrega: z
    .number()
    .nonnegative('A taxa de entrega não pode ser negativa.')
    .optional()
    .default(0),

  desconto: z
    .number()
    .nonnegative('O desconto não pode ser negativo.')
    .optional()
    .default(0),

  data_entrega: z
    .string()
    .optional(),

  observacoes: z
    .string()
    .optional(),

  items: z
    .array(orderItemSchema, { error: 'Os itens da encomenda são obrigatórios.' })
    .min(1, 'A encomenda deve ter pelo menos 1 item.'),
});

/**
 * Schema de validação para atualização de encomenda.
 */
export const updateOrderSchema = z.object({
  status: z
    .enum(['pendente', 'em_producao', 'pronto', 'entregue', 'cancelado'], {
      error: 'Status inválido.',
    })
    .optional(),

  forma_pagamento: z
    .enum(['pix', 'dinheiro', 'cartao_credito', 'cartao_debito'], {
      error: 'Forma de pagamento inválida.',
    })
    .optional(),

  status_pagamento: z
    .enum(['pendente', 'pago', 'parcial'], {
      error: 'Status de pagamento inválido.',
    })
    .optional(),

  tipo_entrega: z
    .enum(['retirada', 'entrega'], {
      error: 'Tipo de entrega inválido.',
    })
    .optional(),

  taxa_entrega: z
    .number()
    .nonnegative('A taxa de entrega não pode ser negativa.')
    .optional(),

  desconto: z
    .number()
    .nonnegative('O desconto não pode ser negativo.')
    .optional(),

  data_entrega: z
    .string()
    .optional(),

  observacoes: z
    .string()
    .optional(),
});
