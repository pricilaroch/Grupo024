import { FastifyRequest, FastifyReply } from 'fastify';
import { UserService } from '../services/UserService';
import { updateStatusSchema } from '../schemas/user.schema';
import { ValidationError } from '../errors/AppError';

interface IdParam {
  id: string;
}

export class AdminController {
  private userService: UserService;

  constructor(userService: UserService) {
    this.userService = userService;
  }

  /**
   * GET /admin/users/pending
   */
  public async listPending(
    _request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const users = await this.userService.listPendingUsers();
    const publicUsers = users.map((u) => u.toPublicJSON());
    reply.status(200).send({ users: publicUsers });
  }

  /**
   * PATCH /admin/users/:id/status
   */
  public async updateStatus(
    request: FastifyRequest<{ Params: IdParam }>,
    reply: FastifyReply
  ): Promise<void> {
    const id = Number(request.params.id);
    if (isNaN(id)) {
      throw new ValidationError('ID inválido.');
    }

    const { status, motivo } = updateStatusSchema.parse(request.body);

    const user = await this.userService.updateUserStatus(id, status, motivo);

    reply.status(200).send({
      message: `Usuário ${status} com sucesso.`,
      user: user.toPublicJSON(),
    });
  }
}
