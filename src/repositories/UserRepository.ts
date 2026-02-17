import { getDatabase } from '../database/database';
import { User, UserData } from '../models/User';

export class UserRepository {
  /**
   * Busca um usuário pelo CPF ou CNPJ.
   */
  public async findByCpfCnpj(cpfCnpj: string): Promise<User | null> {
    const db = await getDatabase();
    const row = await db.get<UserData>(
      'SELECT * FROM users WHERE cpf_cnpj = ?',
      [cpfCnpj]
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
      `INSERT INTO users (nome, cpf_cnpj, email, telefone, data_nascimento, observacao, endereco, senha, status, role)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user.nome,
        user.cpf_cnpj,
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
}
