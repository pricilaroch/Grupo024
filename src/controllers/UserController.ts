import { FastifyRequest, FastifyReply } from 'fastify';
import { UserService } from '../services/UserService';
import { registerSchema } from '../schemas/user.schema';
import { ValidationError } from '../errors/AppError';
import { ZodError } from 'zod';

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
}
