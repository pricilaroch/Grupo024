CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  preco_venda REAL NOT NULL, -- Alterado para clareza
  preco_custo REAL,          -- Novo: para cálculo de lucro
  unidade_medida TEXT,       -- Novo: 'kg', 'un', 'litro', etc.
  quantidade_estoque REAL DEFAULT 0,
  tempo_producao_minutos INTEGER, -- Novo: para gestão de agenda
  imagem_url TEXT,          -- Novo: para exibir foto do produto
  categoria TEXT,
  ativo BOOLEAN DEFAULT 1,    -- Novo: para desativar sem apagar
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);