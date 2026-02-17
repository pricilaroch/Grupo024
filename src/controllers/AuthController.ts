import { FastifyRequest, FastifyReply } from 'fastify';
import { UserService } from '../services/UserService';

interface LoginBody {
  cpf_cnpj: string;
  senha: string;
}

export class AuthController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  /**
   * POST /login
   * Autentica o usuário e retorna status + dados públicos.
   */
  public async login(
    request: FastifyRequest<{ Body: LoginBody }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { cpf_cnpj, senha } = request.body;

      if (!cpf_cnpj || !senha) {
        reply.status(400).send({
          error: 'CPF/CNPJ e senha são obrigatórios.',
        });
        return;
      }

      const user = await this.userService.authenticate(cpf_cnpj, senha);

      reply.status(200).send({
        message: 'Login realizado com sucesso.',
        user: user.toPublicJSON(),
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';

      const authErrors = [
        'CPF/CNPJ não encontrado.',
        'Senha incorreta.',
      ];

      if (authErrors.includes(message)) {
        reply.status(401).send({ error: 'CPF/CNPJ ou senha inválidos.' });
        return;
      }

      request.log.error(error);
      reply.status(500).send({ error: 'Erro interno do servidor.' });
    }
  }
}
