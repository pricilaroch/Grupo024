import { z } from 'zod';

// ── Shared error response schemas for OpenAPI docs ──────────────

export const errorResponseSchema = z.object({
  error: z.string(),
});

export const errorResponses = {
  400: {
    description: 'Erro de validação',
    content: { 'application/json': { schema: errorResponseSchema } },
  },
  401: {
    description: 'Não autorizado — token inválido, expirado ou usuário sem permissão',
    content: { 'application/json': { schema: errorResponseSchema } },
  },
  404: {
    description: 'Recurso não encontrado',
    content: { 'application/json': { schema: errorResponseSchema } },
  },
  500: {
    description: 'Erro interno do servidor',
    content: { 'application/json': { schema: errorResponseSchema } },
  },
} as const;

// ── Shared param schemas ────────────────────────────────────────

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// ── Shared message response ─────────────────────────────────────

export const messageResponseSchema = z.object({
  message: z.string(),
});
