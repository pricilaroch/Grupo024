-- Tabela de Encomendas (Cabeçalho do Pedido)
CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    client_id INTEGER NOT NULL,
    
    -- Status do Fluxo
    status TEXT NOT NULL DEFAULT 'pendente', -- pendente, em_producao, pronto, entregue, cancelado
    
    -- Financeiro
    forma_pagamento TEXT, -- pix, dinheiro, cartao_credito, cartao_debito
    status_pagamento TEXT NOT NULL DEFAULT 'pendente', -- pendente, pago, parcial
    
    -- Logística
    tipo_entrega TEXT NOT NULL DEFAULT 'retirada', -- retirada, entrega
    taxa_entrega DECIMAL(10,2) DEFAULT 0.00,
    data_entrega DATETIME,
    
    -- Totais (Calculados no Service)
    valor_subtotal DECIMAL(10,2) NOT NULL, -- Soma bruta dos itens
    desconto DECIMAL(10,2) DEFAULT 0.00,
    valor_total DECIMAL(10,2) NOT NULL,    -- (Subtotal + Taxa) - Desconto
    valor_lucro_total DECIMAL(10,2),       -- (Venda total - Custo total) - Desconto
    
    -- Metadados
    observacoes TEXT,
    data_pedido DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    -- Relacionamentos
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients (id) ON DELETE RESTRICT
);

-- Tabela de Itens da Encomenda (Relação Muitos-para-Muitos)
CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    
    quantidade INTEGER NOT NULL,
    
    -- Snapshots de preço (Histórico)
    preco_venda_unitario DECIMAL(10,2) NOT NULL,
    preco_custo_unitario DECIMAL(10,2) NOT NULL,

    FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE RESTRICT
);

-- Trigger para atualização automática do campo updated_at
CREATE TRIGGER IF NOT EXISTS update_orders_timestamp 
AFTER UPDATE ON orders
when NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE orders SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;