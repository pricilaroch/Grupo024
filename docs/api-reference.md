# API Reference — Sistema de Gestão de Encomendas

Base URL: `http://localhost:3000`

---

## Índice

- [Autenticação](#autenticação)
- [Usuários](#usuários)
- [Admin](#admin)
- [Produtos](#produtos)
- [Clientes](#clientes)
- [Encomendas (Orders)](#encomendas-orders)
- [Códigos de Erro](#códigos-de-erro)

---

## Autenticação

A maioria das rotas exige um token JWT no header `Authorization`:

```
Authorization: Bearer <token>
```

O token é obtido via login e contém `{ id, status, role }`. Rotas protegidas exigem `status: 'aprovado'`.

---

## Usuários

### Registrar Usuário

```
POST /users/register
```

**Auth:** Nenhuma

**Body:**

```json
{
  "nome": "Maria Silva",
  "cpf": "12345678900",
  "telefone": "34999999999",
  "senha": "minhasenha123",
  "nome_empresa": "Doces da Maria"
}
```

**Sucesso:** `201 Created`

```json
{
  "id": 1,
  "nome": "Maria Silva",
  "cpf": "12345678900",
  "telefone": "34999999999",
  "nome_empresa": "Doces da Maria",
  "status": "pendente",
  "role": "user",
  "created_at": "2026-02-25T10:00:00.000Z"
}
```

**Erros:**
- `400` — Campos obrigatórios faltando ou CPF já cadastrado
- `409` — CPF já cadastrado

---

## Autenticação (Login)

### Login

```
POST /login
```

**Auth:** Nenhuma

**Body:**

```json
{
  "cpf": "12345678900",
  "senha": "minhasenha123"
}
```

**Sucesso:** `200 OK`

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "nome": "Maria Silva",
    "cpf": "12345678900",
    "status": "aprovado",
    "role": "user"
  }
}
```

**Erros:**
- `401` — CPF ou senha incorretos
- `403` — Usuário não aprovado

---

## Admin

### Listar Usuários Pendentes

```
GET /admin/users/pending
```

**Auth:** JWT (role: `admin`)

**Sucesso:** `200 OK`

```json
[
  {
    "id": 2,
    "nome": "João Silva",
    "cpf": "98765432100",
    "telefone": "34988888888",
    "nome_empresa": "Bolos do João",
    "status": "pendente",
    "role": "user",
    "created_at": "2026-02-25T10:00:00.000Z"
  }
]
```

### Atualizar Status de Usuário

```
PATCH /admin/users/:id/status
```

**Auth:** JWT (role: `admin`)

**Body:**

```json
{
  "status": "aprovado",
  "motivo": ""
}
```

Valores válidos para `status`: `aprovado`, `rejeitado`

**Sucesso:** `200 OK`

```json
{
  "id": 2,
  "nome": "João Silva",
  "status": "aprovado"
}
```

**Erros:**
- `400` — Status inválido
- `401` — Token inválido ou não é admin
- `404` — Usuário não encontrado

---

## Produtos

Todas as rotas de produtos exigem autenticação JWT com `status: 'aprovado'`.

Prefixo: `/products`

### Criar Produto

```
POST /products
```

**Body:**

```json
{
  "nome": "Bolo de Chocolate",
  "descricao": "Bolo artesanal de chocolate belga",
  "preco_venda": 89.90,
  "preco_custo": 35.00,
  "quantidade_estoque": 10,
  "ativo": true
}
```

**Sucesso:** `201 Created`

```json
{
  "id": 1,
  "user_id": 1,
  "nome": "Bolo de Chocolate",
  "descricao": "Bolo artesanal de chocolate belga",
  "preco_venda": 89.90,
  "preco_custo": 35.00,
  "quantidade_estoque": 10,
  "ativo": true,
  "created_at": "2026-02-25T10:00:00.000Z",
  "updated_at": "2026-02-25T10:00:00.000Z"
}
```

### Listar Produtos do Usuário

```
GET /products
```

**Sucesso:** `200 OK` — Array de produtos do usuário autenticado.

### Buscar Produto por ID

```
GET /products/:id
```

**Sucesso:** `200 OK`

**Erros:**
- `404` — Produto não encontrado

### Atualizar Produto

```
PATCH /products/:id
```

**Body:** (todos os campos são opcionais)

```json
{
  "nome": "Bolo Atualizado",
  "preco_venda": 95.00,
  "ativo": false
}
```

**Sucesso:** `200 OK`

**Erros:**
- `400` — Dados inválidos
- `404` — Produto não encontrado

### Excluir Produto

```
DELETE /products/:id
```

**Sucesso:** `204 No Content`

**Erros:**
- `404` — Produto não encontrado

---

## Clientes

Todas as rotas de clientes exigem autenticação JWT com `status: 'aprovado'`.

Prefixo: `/clients`

### Criar Cliente

```
POST /clients
```

**Body:**

```json
{
  "nome": "João da Silva",
  "telefone": "34999999999",
  "endereco": "Rua das Flores, 123"
}
```

**Sucesso:** `201 Created`

```json
{
  "id": 1,
  "user_id": 1,
  "nome": "João da Silva",
  "telefone": "34999999999",
  "endereco": "Rua das Flores, 123",
  "created_at": "2026-02-25T10:00:00.000Z",
  "updated_at": "2026-02-25T10:00:00.000Z"
}
```

### Listar Clientes do Usuário

```
GET /clients
```

**Sucesso:** `200 OK` — Array de clientes do usuário autenticado.

### Buscar Cliente por ID

```
GET /clients/:id
```

**Sucesso:** `200 OK`

**Erros:**
- `404` — Cliente não encontrado

### Atualizar Cliente

```
PATCH /clients/:id
```

**Body:** (todos os campos são opcionais)

```json
{
  "nome": "João Atualizado",
  "telefone": "34988888888",
  "endereco": "Rua Nova, 456"
}
```

**Sucesso:** `200 OK`

**Erros:**
- `400` — Dados inválidos
- `404` — Cliente não encontrado

### Excluir Cliente

```
DELETE /clients/:id
```

**Sucesso:** `204 No Content`

**Erros:**
- `404` — Cliente não encontrado

---

## Encomendas (Orders)

Todas as rotas de encomendas exigem autenticação JWT com `status: 'aprovado'`.

Prefixo: `/orders`

### Criar Encomenda

```
POST /orders
```

**Body:**

```json
{
  "client_id": 1,
  "tipo_entrega": "entrega",
  "taxa_entrega": 10.00,
  "desconto": 5.00,
  "forma_pagamento": "pix",
  "data_entrega": "2026-03-01T14:00",
  "observacoes": "Entregar pela manhã",
  "items": [
    { "product_id": 1, "quantidade": 2 },
    { "product_id": 3, "quantidade": 1 }
  ]
}
```

| Campo             | Tipo     | Obrigatório | Descrição                                                |
|-------------------|----------|-------------|----------------------------------------------------------|
| `client_id`       | number   | Sim         | ID do cliente (deve pertencer ao usuário)                |
| `tipo_entrega`    | string   | Não         | `"retirada"` (padrão) ou `"entrega"`                    |
| `taxa_entrega`    | number   | Não         | Taxa de entrega (≥ 0, padrão 0)                         |
| `desconto`        | number   | Não         | Desconto em R$ (≥ 0, padrão 0)                          |
| `forma_pagamento` | string   | Não         | `"pix"`, `"dinheiro"`, `"cartao_credito"`, `"cartao_debito"` |
| `data_entrega`    | string   | Não         | Data/hora de entrega                                     |
| `observacoes`     | string   | Não         | Observações do pedido                                    |
| `items`           | array    | Sim         | Array de itens (mínimo 1)                                |
| `items[].product_id`  | number | Sim      | ID do produto (deve pertencer ao usuário e estar ativo)  |
| `items[].quantidade`  | number | Sim      | Quantidade (inteiro positivo)                            |

**Cálculos automáticos:**
- `valor_subtotal` = Σ(preço_venda × quantidade) — snapshot de preços no momento da criação
- `valor_total` = (subtotal + taxa_entrega) − desconto
- `valor_lucro_total` = (subtotal − custo_total) − desconto
- `status` = `"pendente"` (automático)
- `status_pagamento` = `"pendente"` (automático)

**Sucesso:** `201 Created`

```json
{
  "id": 1,
  "user_id": 1,
  "client_id": 1,
  "status": "pendente",
  "forma_pagamento": "pix",
  "status_pagamento": "pendente",
  "tipo_entrega": "entrega",
  "taxa_entrega": 10.00,
  "data_entrega": "2026-03-01T14:00",
  "valor_subtotal": 200.00,
  "desconto": 5.00,
  "valor_total": 205.00,
  "valor_lucro_total": 115.00,
  "observacoes": "Entregar pela manhã",
  "created_at": "2026-02-25T10:00:00.000Z",
  "updated_at": "2026-02-25T10:00:00.000Z",
  "items": [
    {
      "id": 1,
      "order_id": 1,
      "product_id": 1,
      "produto_nome": "Bolo de Chocolate",
      "quantidade": 2,
      "preco_venda_unitario": 89.90,
      "preco_custo_unitario": 35.00
    }
  ]
}
```

**Erros:**
- `400` — Dados inválidos, desconto maior que total, produto inativo
- `404` — Cliente ou produto não encontrado

### Listar Encomendas do Usuário

```
GET /orders
```

**Sucesso:** `200 OK` — Array de encomendas com itens inclusos.

### Buscar Encomenda por ID

```
GET /orders/:id
```

**Sucesso:** `200 OK`

**Erros:**
- `404` — Encomenda não encontrada ou acesso negado

### Filtrar Encomendas por Status

```
GET /orders/status?status=pendente&status=em_producao
```

**Query Params:**
- `status` — Um ou mais valores: `pendente`, `em_producao`, `pronto`, `entregue`, `cancelado`

**Sucesso:** `200 OK` — Array de encomendas filtradas.

### Listar Itens de uma Encomenda

```
GET /orders/:id/items
```

**Sucesso:** `200 OK`

```json
[
  {
    "id": 1,
    "order_id": 1,
    "product_id": 1,
    "produto_nome": "Bolo de Chocolate",
    "quantidade": 2,
    "preco_venda_unitario": 89.90,
    "preco_custo_unitario": 35.00
  }
]
```

**Erros:**
- `404` — Encomenda não encontrada ou acesso negado

### Atualizar Encomenda

```
PATCH /orders/:id
```

**Body:** (todos os campos são opcionais)

```json
{
  "tipo_entrega": "entrega",
  "taxa_entrega": 15.00,
  "desconto": 10.00,
  "forma_pagamento": "dinheiro",
  "data_entrega": "2026-03-02T10:00",
  "observacoes": "Atualizado",
  "items": [
    { "product_id": 1, "quantidade": 3 },
    { "product_id": 2, "quantidade": 1 }
  ]
}
```

> **Nota:** Se `items` for enviado, todos os itens anteriores são substituídos. Os preços são recalculados com snapshot atualizado. Campos financeiros (`valor_subtotal`, `valor_total`, `valor_lucro_total`) são recalculados automaticamente.

**Restrição:** Encomendas com status `entregue` ou `cancelado` não podem ser atualizadas.

**Sucesso:** `200 OK`

**Erros:**
- `400` — Dados inválidos, pedido finalizado, desconto maior que total
- `404` — Encomenda não encontrada ou acesso negado

### Atualizar Status da Encomenda

```
PATCH /orders/:id/status
```

**Body:**

```json
{
  "status": "em_producao"
}
```

Fluxo de status: `pendente` → `em_producao` → `pronto` → `entregue` (ou `cancelado` a qualquer momento, exceto se já finalizado).

**Restrição:** Encomendas com status `entregue` ou `cancelado` não podem ter o status alterado.

**Sucesso:** `200 OK`

**Erros:**
- `400` — Status inválido ou pedido finalizado
- `404` — Encomenda não encontrada

### Atualizar Status de Pagamento

```
PATCH /orders/:id/payment
```

**Body:**

```json
{
  "status_pagamento": "pago"
}
```

Valores válidos: `pendente`, `pago`, `parcial`

> **Nota:** O pagamento pode ser atualizado mesmo em pedidos com status `entregue`.

**Sucesso:** `200 OK`

**Erros:**
- `400` — Status de pagamento inválido
- `404` — Encomenda não encontrada

### Excluir Encomenda

```
DELETE /orders/:id
```

**Sucesso:** `204 No Content`

**Erros:**
- `404` — Encomenda não encontrada ou acesso negado

---

## Códigos de Erro

| Código | Significado                                      |
|--------|--------------------------------------------------|
| `400`  | Requisição inválida (validação, regras de negócio)|
| `401`  | Token ausente, inválido ou expirado              |
| `403`  | Sem permissão (usuário não aprovado / não admin) |
| `404`  | Recurso não encontrado                           |
| `409`  | Conflito (ex: CPF já cadastrado)                 |
| `500`  | Erro interno do servidor                         |

Todos os erros retornam:

```json
{
  "error": "Mensagem descritiva do erro."
}
```
