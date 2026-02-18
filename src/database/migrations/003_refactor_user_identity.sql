-- Migration: Refatora identidade do usuário
--   - Separa cpf_cnpj em cpf (obrigatório) e cnpj (opcional)
--   - Adiciona nome_fantasia e categoria_producao

-- 1. Renomear tabela antiga
ALTER TABLE users RENAME TO users_old;

-- 2. Criar tabela com nova estrutura
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  cpf TEXT NOT NULL UNIQUE,
  cnpj TEXT DEFAULT '',
  nome_fantasia TEXT NOT NULL DEFAULT '',
  categoria_producao TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL,
  telefone TEXT NOT NULL,
  data_nascimento TEXT NOT NULL,
  observacao TEXT DEFAULT '',
  endereco TEXT NOT NULL,
  senha TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente',
  role TEXT NOT NULL DEFAULT 'produtor',
  motivo_reprovacao TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 3. Migrar dados existentes (cpf_cnpj vira cpf)
INSERT INTO users (id, nome, cpf, cnpj, nome_fantasia, categoria_producao, email, telefone, data_nascimento, observacao, endereco, senha, status, role, motivo_reprovacao, created_at)
SELECT id, nome, cpf_cnpj, '', '', '', email, telefone, data_nascimento, COALESCE(observacao, ''), endereco, senha, status, role, COALESCE(motivo_reprovacao, ''), created_at
FROM users_old;

-- 4. Remover tabela antiga
DROP TABLE users_old;
