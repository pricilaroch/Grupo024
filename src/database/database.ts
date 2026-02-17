import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

let db: Database | null = null;

export async function getDatabase(): Promise<Database> {
  if (db) return db;

  const dbPath = path.join(process.cwd(), 'database.sqlite');

  db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      cpf_cnpj TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL,
      telefone TEXT NOT NULL,
      data_nascimento TEXT NOT NULL,
      observacao TEXT,
      endereco TEXT NOT NULL,
      senha TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pendente',
      motivo_reprovacao TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  return db;
}
