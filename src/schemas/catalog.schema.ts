import z from 'zod';

/**
 * Schema do produto público retornado pela rota /public/catalog/:slug.
 * Garante que nenhum campo interno (preco_custo, timestamps) vaze para o cliente.
 */
export const catalogProductSchema = z.object({
  id: z.number(),
  nome: z.string(),
  descricao: z.string().optional(),
  preco_venda: z.number().positive(),
  imagem_url: z.string().url().optional().or(z.literal('')).optional(),
  categoria: z.string().optional(),
});

export const lojaPublicaSchema = z.object({
  nome_fantasia: z.string(),
  categoria_producao: z.string(),
});

export const publicCatalogSchema = z.object({
  slug: z.string(),
  loja: lojaPublicaSchema,
  produtos: z.array(catalogProductSchema),
});

export type CatalogProductSchema = z.infer<typeof catalogProductSchema>;
export type PublicCatalogSchema   = z.infer<typeof publicCatalogSchema>;
