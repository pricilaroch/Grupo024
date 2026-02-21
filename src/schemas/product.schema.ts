import z from 'zod';

/**
 * Schema de validação para criação de produto.
 */
export const createProductSchema = z.object({
  nome: z
    .string({ error: 'O campo "nome" é obrigatório.' })
    .min(3, 'O nome do produto deve ter pelo menos 3 caracteres.'),
  
  descricao: z
    .string({ error: 'O campo "descricao" é obrigatório.' })
    .min(5, 'A descrição do produto deve ter pelo menos 5 caracteres.'),
  
  preco_venda: z
    .number({ error: 'O campo "preco_venda" é obrigatório.' })
    .positive('O preço de venda deve ser um número positivo.'),

  preco_custo: z
    .number()
    .positive('O preço de custo deve ser um número positivo.')
    .optional(),

  unidade_medida: z
      .string()
      .min(1, 'A unidade de medida é obrigatória.')
      .optional(),
  
  quantidade_estoque: z
    .number()
    .int('A quantidade em estoque deve ser um número inteiro.')
    .nonnegative('A quantidade em estoque não pode ser negativa.')
    .optional(),

  tempo_producao_minutos: z
    .number()
    .int('O tempo de produção deve ser um número inteiro.')
    .nonnegative('O tempo de produção não pode ser negativo.')
    .optional(),

  imagem_url: z
    .string()
    .url('A URL da imagem deve ser válida.')
    .optional()
    .or(z.literal('')),
  
  categoria: z
    .string({ error: 'O campo "categoria" é obrigatório.' })
    .min(3, 'A categoria do produto deve ter pelo menos 3 caracteres.'),
});

/**
 * Schema de validação para atualização de produto.
 */
export const updateProductSchema = z.object({
    nome: z
      .string()
      .min(3, 'O nome do produto deve ter pelo menos 3 caracteres.')
      .optional(),
    
    descricao: z
      .string()
      .min(5, 'A descrição do produto deve ter pelo menos 5 caracteres.')
      .optional(),
    
    preco_venda: z
      .number()
      .positive('O preço de venda deve ser um número positivo.')
      .optional(),
    
    preco_custo: z
      .number()
      .positive('O preço de custo deve ser um número positivo.')
      .optional(),

    unidade_medida: z
      .string()
      .min(1, 'A unidade de medida é obrigatória.')
      .optional(),

    quantidade_estoque: z
      .number()
      .int('A quantidade em estoque deve ser um número inteiro.')
      .nonnegative('A quantidade em estoque não pode ser negativa.')
      .optional(),

    tempo_producao_minutos: z
      .number()
      .int('O tempo de produção deve ser um número inteiro.')
      .nonnegative('O tempo de produção não pode ser negativo.')
      .optional(),

    imagem_url: z
      .string()
      .url('A URL da imagem deve ser válida.')
      .optional()
      .or(z.literal('')),
    
    categoria: z
        .string()
        .min(3, 'A categoria do produto deve ter pelo menos 3 caracteres.')
        .optional(),

    ativo: z
      .boolean()
      .optional(),
});