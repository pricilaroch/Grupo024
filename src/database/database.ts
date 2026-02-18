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
    `INSERT INTO users (nome, cpf, cnpj, nome_fantasia, categoria_producao, email, telefone, data_nascimento, endereco, senha, status, role)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'Administrador',
      '00000000000',
      '',
      'Sistema',
      'Administração',
      'admin@sistema.com',
      '0000000000',
      '2000-01-01',
      'Sistema',
      hashedPassword,
      'aprovado',
      'admin',
    ]
  );

  const hashedPasswordp = await bcrypt.hash('senha123', config.bcryptSaltRounds);

  // Inserção 1
  await database.run(
      `INSERT INTO users (nome, cpf, cnpj, nome_fantasia, categoria_producao, email, telefone, data_nascimento, endereco, senha, status, role)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'João Produtor',
        '11122233344',
        '',
        'Fazenda do João',
        'Frutas',
        'joao@email.com',
        '34999991111',
        '1985-05-10',
        'Rua das Flores, 123',
        hashedPasswordp,
        'pendente',
        'produtor',
      ]
  );

  // Inserção 2
  await database.run(
      `INSERT INTO users (nome, cpf, cnpj, nome_fantasia, categoria_producao, email, telefone, data_nascimento, endereco, senha, status, role)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'Maria Silva',
        '22233344455',
        '12345678000100',
        'Laticínios da Maria',
        'Laticínios',
        'maria@email.com',
        '34999992222',
        '1992-08-20',
        'Av. Central, 456',
        hashedPasswordp,
        'pendente',
        'produtor',
      ]
  );

  // Inserção 3
  await database.run(
      `INSERT INTO users (nome, cpf, cnpj, nome_fantasia, categoria_producao, email, telefone, data_nascimento, endereco, senha, status, role)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'José Santos',
        '33344455566',
        '',
        'Horta do Zé',
        'Hortaliças',
        'jose@email.com',
        '34999993333',
        '1978-12-15',
        'Rua do Comércio, 789',
        hashedPasswordp,
        'pendente',
        'produtor',
      ]
  );

  console.log('Seed: usuário administrador criado (CPF: 00000000000 / Senha: admin123)');
}
