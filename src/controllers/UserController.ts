import { FastifyRequest, FastifyReply } from 'fastify';
import { UserService, UpdateMetaDTO, UpdateProfileDTO } from '../services/UserService';
import { registerSchema } from '../schemas/user.schema';
import { ValidationError } from '../errors/AppError';
import { ZodError } from 'zod';
import { z } from 'zod';

const updateMetaSchema = z.object({
  meta_faturamento: z.coerce.number().nonnegative(),
});

const updateProfileSchema = z.object({
  nome_fantasia: z.string().min(1).max(120).optional(),
  categoria_producao: z.string().min(1).max(120).optional(),
  slug: z.string().min(1).max(60).optional(),
  email: z.string().email().max(255).optional(),
  telefone: z.string().min(8).max(20).optional(),
});

export class UserController {
  private userService: UserService;

  constructor(userService: UserService) {
    this.userService = userService;
  }

  /**
   * POST /users/register
   */
  public async register(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const parsed = registerSchema.parse(request.body);

    const user = await this.userService.register(parsed);

    reply.status(201).send({
      message: 'Cadastro realizado com sucesso! Aguarde a aprovação do administrador.',
      user: user.toPublicJSON(),
    });
  }

  /**
   * GET /users/me  (requer JWT + status aprovado)
   */
  public async getMe(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const { id } = request.user as { id: number };
    const user = await this.userService.getMe(id);
    reply.status(200).send(user.toPublicJSON());
  }

  /**
   * PATCH /users/me/meta  (requer JWT + status aprovado)
   */
  public async updateMeta(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const { id } = request.user as { id: number };
    const dto = updateMetaSchema.parse(request.body) as UpdateMetaDTO;
    const user = await this.userService.updateMeta(id, dto);
    reply.status(200).send({
      message: 'Meta atualizada com sucesso.',
      meta_faturamento: user.meta_faturamento,
    });
  }

  /**
   * PATCH /users/me  (requer JWT + status aprovado)
   * Atualiza campos editáveis do perfil: nome_fantasia, categoria_producao, slug.
   * Campos imutáveis (cpf, cnpj, email) enviados no body são ignorados.
   */
  public async updateProfile(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const { id } = request.user as { id: number };
    // Strip immutable fields (cpf, cnpj) the client may have sent
    const { cpf, cnpj, ...rest } = request.body as Record<string, unknown>;
    const dto = updateProfileSchema.parse(rest) as UpdateProfileDTO;
    const user = await this.userService.updateProfile(id, dto);
    reply.status(200).send({
      message: 'Perfil atualizado com sucesso.',
      user: user.toPublicJSON(),
    });
  }
}
