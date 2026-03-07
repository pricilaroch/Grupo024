import { getDatabase } from '../database/database';
import { User, UserData } from '../models/User';

export class UserRepository {
  /**
   * Busca um usuário pelo CPF.
   */
  public async findByCpf(cpf: string): Promise<User | null> {
    const db = await getDatabase();
    const row = await db.get<UserData>(
      'SELECT * FROM users WHERE cpf = ?',
      [cpf]
    );

    if (!row) return null;
    return new User(row);
  }

  /**
   * Busca um usuário pelo slug (rota pública de vitrine).
   */
  public async findBySlug(slug: string): Promise<User | null> {
    const db = await getDatabase();
    const row = await db.get<UserData>(
      'SELECT * FROM users WHERE slug = ? AND status = ?',
      [slug, 'aprovado']
    );
    if (!row) return null;
    return new User(row);
  }

  /**
   * Insere um novo usuário no banco de dados.
   */
  public async create(user: User): Promise<User> {
    const db = await getDatabase();
    const result = await db.run(
      `INSERT INTO users (nome, cpf, cnpj, nome_fantasia, categoria_producao, email, telefone, data_nascimento, observacao, endereco, senha, status, role)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user.nome,
        user.cpf,
        user.cnpj,
        user.nome_fantasia,
        user.categoria_producao,
        user.email,
        user.telefone,
        user.data_nascimento,
        user.observacao,
        user.endereco,
        user.senha,
        user.status,
        user.role,
      ]
    );

    user.id = result.lastID;
    return user;
  }

  /**
   * Busca todos os usuários com status 'pendente'.
   */
  public async findPending(): Promise<User[]> {
    const db = await getDatabase();
    const rows = await db.all<UserData[]>(
      'SELECT * FROM users WHERE status = ? ORDER BY created_at ASC',
      ['pendente']
    );
    return rows.map((row) => new User(row));
  }

  /**
   * Busca um usuário por ID.
   */
  public async findById(id: number): Promise<User | null> {
    const db = await getDatabase();
    const row = await db.get<UserData>(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );
    if (!row) return null;
    return new User(row);
  }

  /**
   * Atualiza o status e o motivo de reprovação de um usuário.
   */
  public async updateStatus(id: number, status: string, motivoReprovacao: string): Promise<void> {
    const db = await getDatabase();
    await db.run(
      'UPDATE users SET status = ?, motivo_reprovacao = ? WHERE id = ?',
      [status, motivoReprovacao, id]
    );
  }

  /**
   * Atualiza a meta de faturamento mensal de um usuário.
   */
  public async updateMeta(id: number, meta: number): Promise<void> {
    const db = await getDatabase();
    await db.run(
      'UPDATE users SET meta_faturamento = ? WHERE id = ?',
      [meta, id]
    );
  }

  /**
   * Atualiza o slug de um usuário.
   */
  public async updateSlug(id: number, slug: string): Promise<void> {
    const db = await getDatabase();
    await db.run(
      'UPDATE users SET slug = ? WHERE id = ?',
      [slug, id]
    );
  }

  /**
   * Verifica se um slug já está em uso (independentemente do status).
   */
  public async existsBySlug(slug: string): Promise<boolean> {
    const db = await getDatabase();
    const row = await db.get<{ count: number }>(
      'SELECT COUNT(*) as count FROM users WHERE slug = ?',
      [slug]
    );
    return (row?.count ?? 0) > 0;
  }

  /**
   * Verifica se um slug já está em uso por outro usuário (exclui o próprio).
   */
  public async existsBySlugExcludingUser(slug: string, userId: number): Promise<boolean> {
    const db = await getDatabase();
    const row = await db.get<{ count: number }>(
      'SELECT COUNT(*) as count FROM users WHERE slug = ? AND id != ?',
      [slug, userId]
    );
    return (row?.count ?? 0) > 0;
  }

  /**
   * Atualiza campos editáveis do perfil (nome_fantasia, categoria_producao, slug).
   */
  public async updateProfile(
    id: number,
    fields: { nome_fantasia?: string; categoria_producao?: string; slug?: string; email?: string; telefone?: string }
  ): Promise<void> {
    const db = await getDatabase();
    const sets: string[] = [];
    const values: any[] = [];

    if (fields.nome_fantasia !== undefined) {
      sets.push('nome_fantasia = ?');
      values.push(fields.nome_fantasia);
    }
    if (fields.categoria_producao !== undefined) {
      sets.push('categoria_producao = ?');
      values.push(fields.categoria_producao);
    }
    if (fields.slug !== undefined) {
      sets.push('slug = ?');
      values.push(fields.slug);
    }
    if (fields.email !== undefined) {
      sets.push('email = ?');
      values.push(fields.email);
    }
    if (fields.telefone !== undefined) {
      sets.push('telefone = ?');
      values.push(fields.telefone);
    }

    if (sets.length === 0) return;

    values.push(id);
    await db.run(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, values);
  }
}
