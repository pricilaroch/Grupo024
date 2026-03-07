import { FastifyRequest, FastifyReply } from 'fastify';
import { UserService } from '../services/UserService';
import { loginSchema } from '../schemas/user.schema';
import { config } from '../config';

export class AuthController {
  private userService: UserService;

  constructor(userService: UserService) {
    this.userService = userService;
  }

  /**
   * POST /login
   * Autentica o usuário e retorna um JWT + dados públicos.
   * Garante que o usuário tenha um slug ao fazer login pela primeira vez.
   */
  public async login(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const { cpf, senha } = loginSchema.parse(request.body);

    let user = await this.userService.authenticate(cpf, senha);

    // Task 4: garante que usuários sem slug recebam um automaticamente
    if (!user.slug) {
      user = await this.userService.ensureSlug(user);
    }

    const token = (request.server as import('fastify').FastifyInstance).jwt.sign(
      { id: user.id!, status: user.status, role: user.role },
      { expiresIn: config.jwtExpiresIn }
    );

    reply.status(200).send({
      message: 'Login realizado com sucesso.',
      token,
      user: user.toPublicJSON(),
    });
  }
}
