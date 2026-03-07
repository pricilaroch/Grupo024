-- 1. Adiciona a coluna slug sem a restrição UNIQUE direta (SQLite limitation)
ALTER TABLE users ADD COLUMN slug TEXT;

-- 2. Adiciona a meta de faturamento com valor padrão
ALTER TABLE users ADD COLUMN meta_faturamento DECIMAL(10, 2) NOT NULL DEFAULT 0;

-- 3. Agora sim, criamos a unicidade através de um ÍNDICE
-- O "WHERE slug IS NOT NULL" garante que usuários antigos sem slug não quebrem a regra
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_slug ON users (slug) WHERE slug IS NOT NULL;