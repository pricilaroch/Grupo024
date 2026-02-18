import { z } from 'zod';

/**
 * Schema de validação para registro de usuário.
 */
export const registerSchema = z.object({
  nome: z
    .string({ error: 'O campo "nome" é obrigatório.' })
    .min(3, 'O nome deve ter pelo menos 3 caracteres.'),

  cpf: z
    .string({ error: 'O campo "cpf" é obrigatório.' })
    .min(11, 'CPF deve ter pelo menos 11 caracteres.')
    .max(14, 'CPF deve ter no máximo 14 caracteres.')
    .regex(
      /^[\d.\-]+$/,
      'CPF deve conter apenas números, pontos ou hífens.'
    ),

  cnpj: z
    .string()
    .max(18, 'CNPJ deve ter no máximo 18 caracteres.')
    .regex(
      /^[\d.\-/]*$/,
      'CNPJ deve conter apenas números, pontos, hífens ou barras.'
    )
    .optional()
    .default(''),

  nome_fantasia: z
    .string({ error: 'O campo "nome_fantasia" é obrigatório.' })
    .min(2, 'O nome fantasia deve ter pelo menos 2 caracteres.'),

  categoria_producao: z
    .string({ error: 'O campo "categoria_producao" é obrigatório.' })
    .min(1, 'A categoria de produção é obrigatória.'),

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
  cpf: z
    .string({ error: 'O campo "cpf" é obrigatório.' })
    .min(1, 'O CPF é obrigatório.'),

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
