import { z } from 'zod';

// ── Shared error response schemas for OpenAPI docs ──────────────

export const errorResponseSchema = z.object({
  error: z.string(),
});

export const errorResponses = {
  400: errorResponseSchema.describe('Erro de validação'),
  401: errorResponseSchema.describe('Não autorizado — token inválido, expirado ou usuário sem permissão'),
  404: errorResponseSchema.describe('Recurso não encontrado'),
  500: errorResponseSchema.describe('Erro interno do servidor'),
};

// ── Shared param schemas ────────────────────────────────────────

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// ── Shared message response ─────────────────────────────────────

export const messageResponseSchema = z.object({
  message: z.string(),
});
