import { z } from 'zod';

const CATEGORIES = [
  'materia_prima',
  'embalagem',
  'transporte',
  'aluguel',
  'energia',
  'agua',
  'internet',
  'marketing',
  'equipamento',
  'manutencao',
  'impostos',
  'salarios',
  'outros',
] as const;

/**
 * Schema de validação para criação de despesa.
 */
export const createExpenseSchema = z.object({
  valor: z
    .number({ error: 'O campo "valor" é obrigatório.' })
    .positive('O valor deve ser maior que zero.'),

  categoria: z
    .enum(CATEGORIES, {
      error: `Categoria inválida. Use: ${CATEGORIES.join(', ')}.`,
    }),

  descricao: z
    .string()
    .optional(),

  data_emissao: z
    .string()
    .optional(),

  data_vencimento: z
    .string()
    .optional(),
});

/**
 * Schema de validação para atualização parcial de despesa.
 */
export const updateExpenseSchema = z.object({
  valor: z
    .number()
    .positive('O valor deve ser maior que zero.')
    .optional(),

  categoria: z
    .enum(CATEGORIES, {
      error: `Categoria inválida. Use: ${CATEGORIES.join(', ')}.`,
    })
    .optional(),

  descricao: z
    .string()
    .optional(),

  data_emissao: z
    .string()
    .optional(),

  data_vencimento: z
    .string()
    .optional(),
});
