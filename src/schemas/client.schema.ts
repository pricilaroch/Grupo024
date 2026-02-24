import { z } from 'zod';

export const clientSchema = z.object({
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  
  // Regex para aceitar (34) 99999-9999 ou 34999999999
  telefone: z.string().regex(/^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/, "Telefone inválido. Use (XX) 9XXXX-XXXX"),
  
  email: z.string().email("E-mail inválido").optional().or(z.literal('')),
  
  endereco: z.string().min(5, "Endereço muito curto")
});

export const updateClientSchema = clientSchema.partial();