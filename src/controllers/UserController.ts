import { FastifyRequest, FastifyReply } from 'fastify';
import { UserService } from '../services/UserService';

interface RegisterBody {
  nome: string;
  cpf_cnpj: string;
  email: string;
  telefone: string;
  data_nascimento: string;
  observacao?: string;
  endereco: string;
  senha: string;
}

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  /**
   * Endpoint POST /users/register
   * Cadastra um novo usuário típico com status "pendente".
   */
  public async register(
    request: FastifyRequest<{ Body: RegisterBody }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const {
        nome,
        cpf_cnpj,
        email,
        telefone,
        data_nascimento,
        observacao,
        endereco,
        senha,
      } = request.body;

      // Validação dos campos obrigatórios
      if (!nome || !cpf_cnpj || !email || !telefone || !data_nascimento || !endereco || !senha) {
        reply.status(400).send({
          error: 'Todos os campos obrigatórios devem ser preenchidos.',
        });
        return;
      }

      const user = await this.userService.register({
        nome,
        cpf_cnpj,
        email,
        telefone,
        data_nascimento,
        observacao,
        endereco,
        senha,
      });

      reply.status(201).send({
        message: 'Cadastro realizado com sucesso! Aguarde a aprovação do administrador.',
        user: user.toPublicJSON(),
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';

      if (message === 'CPF/CNPJ já cadastrado no sistema.') {
        reply.status(409).send({ error: message });
        return;
      }

      request.log.error(error);
      reply.status(500).send({ error: 'Erro interno do servidor.' });
    }
  }
}
