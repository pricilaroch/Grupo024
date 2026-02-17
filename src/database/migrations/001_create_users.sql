CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  cpf_cnpj TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  telefone TEXT NOT NULL,
  data_nascimento TEXT NOT NULL,
  observacao TEXT DEFAULT '',
  endereco TEXT NOT NULL,
  senha TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente',
  motivo_reprovacao TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
