import bcrypt from 'bcrypt';
import { User } from '../models/User';
import { UserRepository } from '../repositories/UserRepository';
import { config } from '../config';
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '../errors/AppError';

export interface RegisterDTO {
  nome: string;
  cpf_cnpj: string;
  email: string;
  telefone: string;
  data_nascimento: string;
  observacao?: string;
  endereco: string;
  senha: string;
}

export class UserService {
  private userRepository: UserRepository;

  constructor(userRepository: UserRepository) {
    this.userRepository = userRepository;
  }

  /**
   * Gera o hash da senha com bcrypt.
   */
  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, config.bcryptSaltRounds);
  }

  /**
   * Compara uma senha em texto plano com o hash armazenado.
   */
  private async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Registra um novo usuário no sistema.
   * Valida se o CPF/CNPJ já existe e salva com status "pendente".
   */
  public async register(data: RegisterDTO): Promise<User> {
    const existing = await this.userRepository.findByCpfCnpj(data.cpf_cnpj);
    if (existing) {
      throw new ConflictError('CPF/CNPJ já cadastrado no sistema.');
    }

    const user = new User({
      nome: data.nome,
      cpf_cnpj: data.cpf_cnpj,
      email: data.email,
      telefone: data.telefone,
      data_nascimento: data.data_nascimento,
      observacao: data.observacao,
      endereco: data.endereco,
      senha: await this.hashPassword(data.senha),
      status: 'pendente',
    });

    return this.userRepository.create(user);
  }

  /**
   * Retorna todos os usuários com status "pendente".
   */
  public async listPendingUsers(): Promise<User[]> {
    return this.userRepository.findPending();
  }

  /**
   * Aprova ou reprova um usuário.
   */
  public async updateUserStatus(
    id: number,
    newStatus: 'aprovado' | 'reprovado',
    motivo?: string
  ): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('Usuário não encontrado.');
    }

    if (user.status !== 'pendente') {
      throw new ValidationError('Apenas usuários com status "pendente" podem ser atualizados.');
    }

    if (newStatus === 'reprovado' && (!motivo || motivo.trim() === '')) {
      throw new ValidationError('O motivo da reprovação é obrigatório.');
    }

    const motivoReprovacao = newStatus === 'reprovado' ? (motivo ?? '') : '';
    await this.userRepository.updateStatus(id, newStatus, motivoReprovacao);

    user.status = newStatus;
    user.motivo_reprovacao = motivoReprovacao;
    return user;
  }

  /**
   * Autentica um usuário pelo CPF/CNPJ e senha (bcrypt).
   */
  public async authenticate(cpfCnpj: string, senha: string): Promise<User> {
    const user = await this.userRepository.findByCpfCnpj(cpfCnpj);
    if (!user) {
      throw new UnauthorizedError('CPF/CNPJ ou senha inválidos.');
    }

    const isValid = await this.comparePassword(senha, user.senha);
    if (!isValid) {
      throw new UnauthorizedError('CPF/CNPJ ou senha inválidos.');
    }

    return user;
  }
}
