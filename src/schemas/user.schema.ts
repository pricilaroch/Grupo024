import { z } from 'zod';

/**
 * Schema de validação para registro de usuário.
 */
export const registerSchema = z.object({
  nome: z
    .string({ error: 'O campo "nome" é obrigatório.' })
    .min(3, 'O nome deve ter pelo menos 3 caracteres.'),

  cpf_cnpj: z
    .string({ error: 'O campo "cpf_cnpj" é obrigatório.' })
    .min(11, 'CPF/CNPJ deve ter pelo menos 11 caracteres.')
    .max(18, 'CPF/CNPJ deve ter no máximo 18 caracteres.')
    .regex(
      /^[\d.\-/]+$/,
      'CPF/CNPJ deve conter apenas números, pontos, hífens ou barras.'
    ),

  email: z
    .string({ error: 'O campo "email" é obrigatório.' })
    .email('E-mail inválido.'),

  telefone: z
    .string({ error: 'O campo "telefone" é obrigatório.' })
    .min(10, 'Telefone deve ter pelo menos 10 caracteres.'),

  data_nascimento: z
    .string({ error: 'O campo "data_nascimento" é obrigatório.' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de nascimento deve estar no formato AAAA-MM-DD.'),

  observacao: z.string().optional().default(''),

  endereco: z
    .string({ error: 'O campo "endereco" é obrigatório.' })
    .min(5, 'Endereço deve ter pelo menos 5 caracteres.'),

  senha: z
    .string({ error: 'O campo "senha" é obrigatório.' })
    .min(6, 'A senha deve ter pelo menos 6 caracteres.'),
});

/**
 * Schema de validação para login.
 */
export const loginSchema = z.object({
  cpf_cnpj: z
    .string({ error: 'O campo "cpf_cnpj" é obrigatório.' })
    .min(1, 'O CPF/CNPJ é obrigatório.'),

  senha: z
    .string({ error: 'O campo "senha" é obrigatório.' })
    .min(1, 'A senha é obrigatória.'),
});

/**
 * Schema de validação para atualização de status (admin).
 */
export const updateStatusSchema = z.object({
  status: z.enum(['aprovado', 'reprovado'], {
    error: 'Status inválido. Use "aprovado" ou "reprovado".',
  }),

  motivo: z.string().optional(),
});

/** Tipos inferidos dos schemas */
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
