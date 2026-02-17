import crypto from 'crypto';
import { User } from '../models/User';
import { UserRepository } from '../repositories/UserRepository';

interface RegisterDTO {
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

  constructor() {
    this.userRepository = new UserRepository();
  }

  /**
   * Hash da senha usando SHA-256.
   */
  private hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  /**
   * Registra um novo usuário no sistema.
   * Valida se o CPF/CNPJ já existe e salva com status "pendente".
   */
  public async register(data: RegisterDTO): Promise<User> {
    // Verificar se o CPF/CNPJ já está cadastrado
    const existing = await this.userRepository.findByCpfCnpj(data.cpf_cnpj);
    if (existing) {
      throw new Error('CPF/CNPJ já cadastrado no sistema.');
    }

    // Criar o objeto User com senha hasheada e status pendente
    const user = new User({
      nome: data.nome,
      cpf_cnpj: data.cpf_cnpj,
      email: data.email,
      telefone: data.telefone,
      data_nascimento: data.data_nascimento,
      observacao: data.observacao,
      endereco: data.endereco,
      senha: this.hashPassword(data.senha),
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
   * Status válidos: 'aprovado' ou 'reprovado'.
   * Se reprovado, o motivo é obrigatório.
   */
  public async updateUserStatus(
    id: number,
    newStatus: string,
    motivo?: string
  ): Promise<User> {
    const validStatuses = ['aprovado', 'reprovado'];
    if (!validStatuses.includes(newStatus)) {
      throw new Error('Status inválido. Use "aprovado" ou "reprovado".');
    }

    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new Error('Usuário não encontrado.');
    }

    if (user.status !== 'pendente') {
      throw new Error('Apenas usuários com status "pendente" podem ser atualizados.');
    }

    if (newStatus === 'reprovado' && (!motivo || motivo.trim() === '')) {
      throw new Error('O motivo da reprovação é obrigatório.');
    }

    const motivoReprovacao = newStatus === 'reprovado' ? (motivo ?? '') : '';
    await this.userRepository.updateStatus(id, newStatus, motivoReprovacao);

    user.status = newStatus;
    user.motivo_reprovacao = motivoReprovacao;
    return user;
  }

  /**
   * Autentica um usuário pelo CPF/CNPJ e senha.
   * Retorna o usuário com status e motivo_reprovacao.
   */
  public async authenticate(cpfCnpj: string, senha: string): Promise<User> {
    const user = await this.userRepository.findByCpfCnpj(cpfCnpj);
    if (!user) {
      throw new Error('CPF/CNPJ não encontrado.');
    }

    const hashedPassword = this.hashPassword(senha);
    if (user.senha !== hashedPassword) {
      throw new Error('Senha incorreta.');
    }

    return user;
  }
}
