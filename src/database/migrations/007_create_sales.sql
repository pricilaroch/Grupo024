-- Tabela de vendas / livro caixa
CREATE TABLE IF NOT EXISTS sales (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER NOT NULL,
    client_id       INTEGER,
    order_id        INTEGER,
    valor_total     REAL    NOT NULL DEFAULT 0,
    valor_lucro     REAL    NOT NULL DEFAULT 0,
    forma_pagamento TEXT    NOT NULL CHECK (forma_pagamento IN ('pix', 'dinheiro', 'cartao_credito', 'cartao_debito')),
    data_venda      TEXT    NOT NULL DEFAULT (datetime('now')),
    descricao       TEXT,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT    NOT NULL DEFAULT (datetime('now')),

    FOREIGN KEY (user_id)   REFERENCES users(id),
    FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (order_id)  REFERENCES orders(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_order_id_unique
ON sales(order_id)
WHERE order_id IS NOT NULL;