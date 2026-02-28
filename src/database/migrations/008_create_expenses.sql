CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  valor REAL NOT NULL,
  categoria TEXT NOT NULL DEFAULT 'outros',
  descricao TEXT,
  data_emissao TEXT NOT NULL DEFAULT (datetime('now')),
  data_vencimento TEXT,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK(status IN ('pendente', 'pago')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Trigger para manter o updated_at em dia
CREATE TRIGGER IF NOT EXISTS update_expenses_timestamp
AFTER UPDATE ON expenses
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE expenses SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
