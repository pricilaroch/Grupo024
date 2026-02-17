import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import fs from 'fs';

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
