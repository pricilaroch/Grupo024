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

export interface UpdateMetaDTO {
  meta_faturamento: number;
}

export interface RegisterDTO {
  nome: string;
  cpf: string;
  cnpj?: string;
  nome_fantasia: string;
  categoria_producao: string;
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
    const existing = await this.userRepository.findByCpf(data.cpf);
    if (existing) {
      throw new ConflictError('CPF já cadastrado no sistema.');
    }

    const user = new User({
      nome: data.nome,
      cpf: data.cpf,
      cnpj: data.cnpj,
      nome_fantasia: data.nome_fantasia,
      categoria_producao: data.categoria_producao,
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
  public async authenticate(cpf: string, senha: string): Promise<User> {
    const user = await this.userRepository.findByCpf(cpf);
    if (!user) {
      throw new UnauthorizedError('CPF ou senha inválidos.');
    }

    const isValid = await this.comparePassword(senha, user.senha);
    if (!isValid) {
      throw new UnauthorizedError('CPF ou senha inválidos.');
    }

    return user;
  }

  /**
   * Retorna o perfil completo de um usuário pelo seu ID (rota /users/me).
   */
  public async getMe(id: number): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('Usuário não encontrado.');
    }
    return user;
  }

  /**
   * Atualiza a meta de faturamento mensal do usuário.
   */
  public async updateMeta(userId: number, dto: UpdateMetaDTO): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('Usuário não encontrado.');
    }
    if (dto.meta_faturamento < 0) {
      throw new ValidationError('A meta de faturamento não pode ser negativa.');
    }
    await this.userRepository.updateMeta(userId, dto.meta_faturamento);
    user.meta_faturamento = dto.meta_faturamento;
    return user;
  }

  /**
   * Garante que o usuário tenha um slug. Se não tiver, gera automaticamente
   * a partir do nome_fantasia e persiste no banco.
   */
  public async ensureSlug(user: User): Promise<User> {
    if (user.slug) return user; // já tem slug, nada a fazer

    // Optimistic approach: generate a candidate and attempt to persist.
    // On UNIQUE constraint violation (rare race condition), retry with a
    // numeric suffix until a free slot is found.
    for (let attempt = 0; attempt < 5; attempt++) {
      const slug = await this.createUniqueSlug(user.nome_fantasia, user.id!);
      try {
        await this.userRepository.updateSlug(user.id!, slug);
        user.slug = slug;
        return user;
      } catch (err: any) {
        const isUniqueViolation =
          err?.code === 'SQLITE_CONSTRAINT' ||
          String(err?.message).includes('UNIQUE') ||
          String(err?.message).includes('unique');
        if (!isUniqueViolation || attempt === 4) throw err;
        // else: collision happened between existsBySlug and updateSlug → retry
      }
    }
    return user; // unreachable, but TypeScript demands it
  }

  /**
   * Gera um slug único a partir de um texto base.
   * Normaliza, remove acentos e caracteres especiais, substitui espaços por hífens.
   */
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')  // remove diacríticos
      .replace(/[^a-z0-9\s-]/g, '')      // remove non-alpha
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 50);
  }

  private async createUniqueSlug(base: string, userId: number): Promise<string> {
    const baseSlug = this.slugify(base) || `loja-${userId}`;
    // Tenta o base diretamente
    if (!(await this.userRepository.existsBySlug(baseSlug))) {
      return baseSlug;
    }
    // Adiciona sufixo numérico até encontrar disponível
    for (let i = 2; i <= 999; i++) {
      const candidate = `${baseSlug}-${i}`;
      if (!(await this.userRepository.existsBySlug(candidate))) {
        return candidate;
      }
    }
    return `${baseSlug}-${userId}`; // fallback absoluto
  }
}
