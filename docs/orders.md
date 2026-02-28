# Encomendas — `/orders`

Gerenciamento completo de encomendas (pedidos) com itens, cálculos financeiros automáticos e integração com vendas. Todas as rotas exigem JWT de usuário com status **aprovado**.

---

## POST `/orders`

Cria uma nova encomenda com snapshot de preços dos produtos no momento da criação.

### Corpo da Requisição (JSON)

| Campo             | Tipo     | Obrigatório | Regras                                                                      |
| ----------------- | -------- | ----------- | --------------------------------------------------------------------------- |
| `client_id`       | `number` | Sim         | Inteiro positivo; cliente deve pertencer ao usuário                         |
| `forma_pagamento` | `string` | Não         | `"pix"`, `"dinheiro"`, `"cartao_credito"` ou `"cartao_debito"`             |
| `tipo_entrega`    | `string` | Não         | `"retirada"` (padrão) ou `"entrega"`                                       |
| `taxa_entrega`    | `number` | Não         | Não negativo (padrão: `0`)                                                 |
| `desconto`        | `number` | Não         | Não negativo (padrão: `0`); não pode exceder subtotal + taxa_entrega       |
| `data_entrega`    | `string` | Não         | Data no formato string                                                      |
| `observacoes`     | `string` | Não         | Texto livre                                                                 |
| `items`           | `array`  | Sim         | Mínimo 1 item                                                              |
| `items[].product_id`  | `number` | Sim    | Inteiro positivo; produto deve pertencer ao usuário e estar ativo           |
| `items[].quantidade`  | `number` | Sim    | Inteiro positivo                                                            |

#### Exemplo

```json
{
  "client_id": 1,
  "forma_pagamento": "pix",
  "tipo_entrega": "entrega",
  "taxa_entrega": 10.00,
  "desconto": 5.00,
  "data_entrega": "2026-03-15",
  "observacoes": "Sem glúten",
  "items": [
    { "product_id": 1, "quantidade": 2 },
    { "product_id": 3, "quantidade": 1 }
  ]
}
```

### Respostas

| Status | Descrição                                                            |
| ------ | --------------------------------------------------------------------- |
| `201`  | Encomenda criada com valores calculados automaticamente               |
| `400`  | Campos inválidos, desconto excessivo, produto inativo etc.           |
| `404`  | Cliente ou produto não encontrado                                     |

#### `201` Created

```json
{
  "id": 12,
  "user_id": 1,
  "client_id": 1,
  "status": "pendente",
  "forma_pagamento": "pix",
  "status_pagamento": "pendente",
  "tipo_entrega": "entrega",
  "taxa_entrega": 10.00,
  "desconto": 5.00,
  "data_entrega": "2026-03-15",
  "observacoes": "Sem glúten",
  "valor_subtotal": 135.00,
  "valor_total": 140.00,
  "valor_lucro_total": 62.00,
  "created_at": "2026-02-28T17:00:00.000Z"
}
```

#### `400` Bad Request

```json
{ "error": "O desconto não pode ser maior que o valor total da encomenda." }
```

#### `404` Not Found

```json
{ "error": "Produto com ID 99 não encontrado ou não pertence ao usuário." }
```

---

## GET `/orders`

Lista todas as encomendas do usuário autenticado.

### Respostas

| Status | Descrição                                  |
| ------ | ---------------------------------------- |
| `200`  | Lista de encomendas do usuário           |

#### `200` OK

```json
[
  {
    "id": 12,
    "user_id": 1,
    "client_id": 1,
    "status": "pendente",
    "status_pagamento": "pendente",
    "forma_pagamento": "pix",
    "valor_total": 140.00,
    "data_entrega": "2026-03-15"
  }
]
```

---

## GET `/orders/:id`

Retorna uma encomenda específica.

### Parâmetros de Rota

| Parâmetro | Tipo     | Descrição          |
| --------- | -------- | ------------------ |
| `id`      | `number` | ID da encomenda    |

### Respostas

| Status | Descrição                                              |
| ------ | ------------------------------------------------------ |
| `200`  | Encomenda encontrada                                  |
| `400`  | ID inválido                                           |
| `404`  | Encomenda não encontrada ou não pertence ao usuário   |

#### `200` OK

```json
{
  "id": 12,
  "user_id": 1,
  "client_id": 1,
  "status": "pendente",
  "forma_pagamento": "pix",
  "status_pagamento": "pendente",
  "tipo_entrega": "entrega",
  "taxa_entrega": 10.00,
  "desconto": 5.00,
  "data_entrega": "2026-03-15",
  "observacoes": "Sem glúten",
  "valor_subtotal": 135.00,
  "valor_total": 140.00,
  "valor_lucro_total": 62.00
}
```

#### `404` Not Found

```json
{ "error": "Encomenda não encontrada ou acesso negado." }
```

---

## GET `/orders/status`

Filtra encomendas por status.

### Query Parameters

| Parâmetro | Tipo              | Obrigatório | Descrição                                                        |
| --------- | ----------------- | ----------- | ---------------------------------------------------------------- |
| `status`  | `string\|string[]`| Sim         | Um ou mais status: `pendente`, `em_producao`, `pronto`, `entregue`, `cancelado` |

#### Exemplo

```
GET /orders/status?status=pendente&status=em_producao
```

### Respostas

| Status | Descrição                             |
| ------ | ------------------------------------- |
| `200`  | Lista filtrada de encomendas          |
| `400`  | Parâmetro `status` ausente            |

#### `200` OK

```json
[
  {
    "id": 12,
    "status": "pendente",
    "valor_total": 140.00,
    "client_id": 1
  },
  {
    "id": 13,
    "status": "em_producao",
    "valor_total": 90.00,
    "client_id": 2
  }
]
```

#### `400` Bad Request

```json
{ "error": "Status é obrigatório" }
```

---

## GET `/orders/:id/items`

Retorna os itens de uma encomenda específica.

### Parâmetros de Rota

| Parâmetro | Tipo     | Descrição          |
| --------- | -------- | ------------------ |
| `id`      | `number` | ID da encomenda    |

### Respostas

| Status | Descrição                                              |
| ------ | ------------------------------------------------------ |
| `200`  | Lista de itens da encomenda                           |
| `400`  | ID inválido                                           |
| `404`  | Encomenda não encontrada ou não pertence ao usuário   |

#### `200` OK

```json
[
  {
    "id": 1,
    "order_id": 12,
    "product_id": 1,
    "quantidade": 2,
    "preco_venda_unitario": 45.00,
    "preco_custo_unitario": 18.50
  },
  {
    "id": 2,
    "order_id": 12,
    "product_id": 3,
    "quantidade": 1,
    "preco_venda_unitario": 45.00,
    "preco_custo_unitario": 20.00
  }
]
```

#### `404` Not Found

```json
{ "error": "Encomenda não encontrada ou acesso negado." }
```

---

## PATCH `/orders/:id`

Atualiza uma encomenda (campos e/ou itens). Encomendas com status `entregue` ou `cancelado` não podem ser alteradas. Se `items` for enviado, os itens anteriores são substituídos e os valores recalculados.

### Parâmetros de Rota

| Parâmetro | Tipo     | Descrição          |
| --------- | -------- | ------------------ |
| `id`      | `number` | ID da encomenda    |

### Corpo da Requisição (JSON)

| Campo             | Tipo     | Obrigatório | Regras                                                               |
| ----------------- | -------- | ----------- | -------------------------------------------------------------------- |
| `status`          | `string` | Não         | `"pendente"`, `"em_producao"`, `"pronto"`, `"entregue"`, `"cancelado"` |
| `forma_pagamento` | `string` | Não         | `"pix"`, `"dinheiro"`, `"cartao_credito"`, `"cartao_debito"`         |
| `status_pagamento`| `string` | Não         | `"pendente"`, `"pago"`, `"parcial"`                                  |
| `tipo_entrega`    | `string` | Não         | `"retirada"`, `"entrega"`                                           |
| `taxa_entrega`    | `number` | Não         | Não negativo                                                         |
| `desconto`        | `number` | Não         | Não negativo                                                         |
| `data_entrega`    | `string` | Não         | Data                                                                 |
| `observacoes`     | `string` | Não         | Texto livre                                                          |
| `items`           | `array`  | Não         | Se enviado, substitui todos os itens (mínimo 1)                     |

### Respostas

| Status | Descrição                                                 |
| ------ | --------------------------------------------------------- |
| `200`  | Encomenda atualizada com valores recalculados             |
| `400`  | Validação, pedido finalizado, desconto inválido etc.      |
| `404`  | Encomenda não encontrada ou não pertence ao usuário        |

#### `200` OK

```json
{
  "id": 12,
  "status": "pendente",
  "taxa_entrega": 15.00,
  "desconto": 5.00,
  "valor_subtotal": 135.00,
  "valor_total": 145.00,
  "valor_lucro_total": 60.00
}
```

#### `400` Bad Request

```json
{ "error": "Pedido finalizado ou cancelado não pode ser alterado." }
```

#### `404` Not Found

```json
{ "error": "Encomenda não encontrada ou acesso negado." }
```

---

## PATCH `/orders/:id/status`

Atualiza apenas o status de produção da encomenda.

### Parâmetros de Rota

| Parâmetro | Tipo     | Descrição          |
| --------- | -------- | ------------------ |
| `id`      | `number` | ID da encomenda    |

### Corpo da Requisição (JSON)

| Campo    | Tipo     | Obrigatório | Regras                                                               |
| -------- | -------- | ----------- | -------------------------------------------------------------------- |
| `status` | `string` | Sim         | `"pendente"`, `"em_producao"`, `"pronto"`, `"entregue"`, `"cancelado"` |

#### Exemplo

```json
{ "status": "em_producao" }
```

### Respostas

| Status | Descrição                                              |
| ------ | ------------------------------------------------------ |
| `200`  | Status atualizado                                     |
| `400`  | Status inválido ou pedido finalizado                  |
| `404`  | Encomenda não encontrada ou não pertence ao usuário   |

#### `200` OK

```json
{
  "id": 12,
  "status": "em_producao",
  "status_pagamento": "pendente",
  "valor_total": 140.00
}
```

#### `400` Bad Request

```json
{ "error": "Status inválido" }
```

#### `404` Not Found

```json
{ "error": "Encomenda não encontrada ou acesso negado." }
```

---

## PATCH `/orders/:id/payment`

Atualiza o status de pagamento. Quando marcado como `"pago"`, cria automaticamente um registro de venda no livro caixa.

### Parâmetros de Rota

| Parâmetro | Tipo     | Descrição          |
| --------- | -------- | ------------------ |
| `id`      | `number` | ID da encomenda    |

### Corpo da Requisição (JSON)

| Campo              | Tipo     | Obrigatório | Regras                               |
| ------------------ | -------- | ----------- | ------------------------------------ |
| `status_pagamento` | `string` | Sim         | `"pendente"`, `"pago"`, `"parcial"` |

#### Exemplo

```json
{ "status_pagamento": "pago" }
```

### Respostas

| Status | Descrição                                              |
| ------ | ------------------------------------------------------ |
| `200`  | Status de pagamento atualizado                        |
| `400`  | Status de pagamento inválido                          |
| `404`  | Encomenda não encontrada ou não pertence ao usuário   |

#### `200` OK

```json
{
  "id": 12,
  "status": "pronto",
  "status_pagamento": "pago",
  "forma_pagamento": "pix",
  "valor_total": 140.00
}
```

> Ao marcar como `"pago"`, uma venda é registrada automaticamente no livro caixa.

#### `400` Bad Request

```json
{ "error": "Status de pagamento inválido" }
```

#### `404` Not Found

```json
{ "error": "Encomenda não encontrada ou acesso negado." }
```

---

## DELETE `/orders/:id`

Remove uma encomenda e seus itens.

### Parâmetros de Rota

| Parâmetro | Tipo     | Descrição          |
| --------- | -------- | ------------------ |
| `id`      | `number` | ID da encomenda    |

### Respostas

| Status | Descrição                                              |
| ------ | ------------------------------------------------------ |
| `204`  | Encomenda removida (sem corpo)                        |
| `400`  | ID inválido                                           |
| `404`  | Encomenda não encontrada ou não pertence ao usuário   |

#### `400` Bad Request

```json
{ "error": "ID inválido" }
```

#### `404` Not Found

```json
{ "error": "Encomenda não encontrada ou acesso negado." }
```
