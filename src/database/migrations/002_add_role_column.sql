-- Adiciona a coluna role à tabela users
ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'produtor';
