import { z } from 'zod';

/**
 * Schema de validação para criação de venda simplificada (manual).
 */
export const createSaleSchema = z.object({
  client_id: z
    .number()
    .int('O client_id deve ser um número inteiro.')
    .positive('O client_id deve ser positivo.')
    .nullable()
    .optional(),

  valor_total: z
    .number({ error: 'O campo "valor_total" é obrigatório.' })
    .positive('O valor total deve ser maior que zero.'),

  valor_lucro: z
    .number()
    .optional(),

  forma_pagamento: z
    .enum(['pix', 'dinheiro', 'cartao_credito', 'cartao_debito'], {
      error: 'Forma de pagamento inválida. Use: pix, dinheiro, cartao_credito ou cartao_debito.',
    }),

  data_venda: z
    .string()
    .optional(),

  descricao: z
    .string()
    .optional(),
});

/**
 * Schema de validação para atualização parcial de venda.
 */
export const updateSaleSchema = z.object({
  client_id: z
    .number()
    .int('O client_id deve ser um número inteiro.')
    .positive('O client_id deve ser positivo.')
    .nullable()
    .optional(),

  valor_total: z
    .number()
    .positive('O valor total deve ser maior que zero.')
    .optional(),

  valor_lucro: z
    .number()
    .optional(),

  forma_pagamento: z
    .enum(['pix', 'dinheiro', 'cartao_credito', 'cartao_debito'], {
      error: 'Forma de pagamento inválida. Use: pix, dinheiro, cartao_credito ou cartao_debito.',
    })
    .optional(),

  data_venda: z
    .string()
    .optional(),

  descricao: z
    .string()
    .optional(),
});
