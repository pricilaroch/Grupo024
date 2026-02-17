import { FastifyRequest, FastifyReply } from 'fastify';
import { UserService } from '../services/UserService';

interface UpdateStatusBody {
  status: string;
  motivo?: string;
}

interface IdParam {
  id: string;
}

export class AdminController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  /**
   * GET /admin/users/pending
   * Retorna todos os usuários com status "pendente".
   */
  public async listPending(
    _request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const users = await this.userService.listPendingUsers();
      const publicUsers = users.map((u) => u.toPublicJSON());
      reply.status(200).send({ users: publicUsers });
    } catch (error: unknown) {
      _request.log.error(error);
      reply.status(500).send({ error: 'Erro interno do servidor.' });
    }
  }

  /**
   * PATCH /admin/users/:id/status
   * Aprova ou reprova um usuário pendente.
   */
  public async updateStatus(
    request: FastifyRequest<{ Params: IdParam; Body: UpdateStatusBody }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const id = Number(request.params.id);
      if (isNaN(id)) {
        reply.status(400).send({ error: 'ID inválido.' });
        return;
      }

      const { status, motivo } = request.body;

      if (!status) {
        reply.status(400).send({ error: 'O campo "status" é obrigatório.' });
        return;
      }

      const user = await this.userService.updateUserStatus(id, status, motivo);

      reply.status(200).send({
        message: `Usuário ${status} com sucesso.`,
        user: user.toPublicJSON(),
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';

      const clientErrors = [
        'Status inválido. Use "aprovado" ou "reprovado".',
        'Usuário não encontrado.',
        'Apenas usuários com status "pendente" podem ser atualizados.',
        'O motivo da reprovação é obrigatório.',
      ];

      if (clientErrors.includes(message)) {
        const statusCode = message === 'Usuário não encontrado.' ? 404 : 400;
        reply.status(statusCode).send({ error: message });
        return;
      }

      request.log.error(error);
      reply.status(500).send({ error: 'Erro interno do servidor.' });
    }
  }
}
