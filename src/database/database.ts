import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcrypt';
import { config } from '../config';

let db: Database | null = null;

/**
 * Retorna a instância singleton do banco de dados.
 * Na primeira chamada, abre a conexão e executa as migrations.
 */
export async function getDatabase(): Promise<Database> {
  if (db) return db;

  const dbPath = path.join(process.cwd(), 'database.sqlite');

  db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  await runMigrations(db);
  await seedAdmin(db);

  return db;
}

/**
 * Executa todos os scripts SQL do diretório de migrations em ordem alfabética.
 */
async function runMigrations(database: Database): Promise<void> {
  // Tabela de controle de migrations
  await database.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      executed_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const migrationsDir = path.join(__dirname, 'migrations');

  if (!fs.existsSync(migrationsDir)) {
    return;
  }

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const alreadyRun = await database.get<{ name: string }>(
      'SELECT name FROM migrations WHERE name = ?',
      [file]
    );

    if (alreadyRun) continue;

    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    await database.exec(sql);
    await database.run('INSERT INTO migrations (name) VALUES (?)', [file]);
    console.log(`Migration aplicada: ${file}`);
  }
}

/**
 * Seed: cria o usuário administrador padrão caso a tabela users esteja vazia.
 */
async function seedAdmin(database: Database): Promise<void> {
  const count = await database.get<{ total: number }>(
    'SELECT COUNT(*) as total FROM users'
  );

  if (count && count.total > 0) return;

  const hashedPassword = await bcrypt.hash('admin123', config.bcryptSaltRounds);

  await database.run(
    `INSERT INTO users (nome, cpf_cnpj, email, telefone, data_nascimento, endereco, senha, status, role)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'Administrador',
      '000.000.000-00',
      'admin@sistema.com',
      '0000000000',
      '2000-01-01',
      'Sistema',
      hashedPassword,
      'aprovado',
      'admin',
    ]
  );

  console.log('Seed: usuário administrador criado (CPF: 000.000.000-00 / Senha: admin123)');
}
