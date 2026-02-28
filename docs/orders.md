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

| Status | Corpo                                                                                         |
| ------ | --------------------------------------------------------------------------------------------- |
| `201`  | Objeto da encomenda com `valor_subtotal`, `valor_total`, `valor_lucro_total` calculados       |
| `400`  | `{ "error": "<validação>" }` — campos inválidos, desconto excessivo, produto inativo etc.     |
| `404`  | `{ "error": "Cliente não encontrado..." }` ou `{ "error": "Produto com ID X não encontrado..." }` |

---

## GET `/orders`

Lista todas as encomendas do usuário autenticado.

### Respostas

| Status | Corpo                                             |
| ------ | ------------------------------------------------- |
| `200`  | `[ { id, client_id, status, valor_total, ... } ]` |

---

## GET `/orders/:id`

Retorna uma encomenda específica.

### Parâmetros de Rota

| Parâmetro | Tipo     | Descrição          |
| --------- | -------- | ------------------ |
| `id`      | `number` | ID da encomenda    |

### Respostas

| Status | Corpo                                                              |
| ------ | ------------------------------------------------------------------ |
| `200`  | `{ id, client_id, status, valor_total, ... }`                     |
| `400`  | `{ "error": "ID inválido" }`                                      |
| `404`  | `{ "error": "Encomenda não encontrada ou acesso negado." }`       |

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

| Status | Corpo                                             |
| ------ | ------------------------------------------------- |
| `200`  | `[ { id, status, ... }, ... ]`                    |
| `400`  | `{ "error": "Status é obrigatório" }`             |

---

## GET `/orders/:id/items`

Retorna os itens de uma encomenda específica.

### Parâmetros de Rota

| Parâmetro | Tipo     | Descrição          |
| --------- | -------- | ------------------ |
| `id`      | `number` | ID da encomenda    |

### Respostas

| Status | Corpo                                                                                                 |
| ------ | ----------------------------------------------------------------------------------------------------- |
| `200`  | `[ { product_id, quantidade, preco_venda_unitario, preco_custo_unitario }, ... ]`                     |
| `400`  | `{ "error": "ID de encomenda inválido" }`                                                             |
| `404`  | `{ "error": "Encomenda não encontrada ou acesso negado." }`                                           |

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

| Status | Corpo                                                                           |
| ------ | ------------------------------------------------------------------------------- |
| `200`  | Objeto atualizado da encomenda com valores recalculados                         |
| `400`  | `{ "error": "..." }` — validação, pedido finalizado, desconto inválido etc.    |
| `404`  | `{ "error": "Encomenda não encontrada ou acesso negado." }`                    |

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

| Status | Corpo                                                              |
| ------ | ------------------------------------------------------------------ |
| `200`  | Objeto atualizado da encomenda                                     |
| `400`  | `{ "error": "Status inválido" }` ou pedido finalizado              |
| `404`  | `{ "error": "Encomenda não encontrada ou acesso negado." }`       |

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

| Status | Corpo                                                              |
| ------ | ------------------------------------------------------------------ |
| `200`  | Objeto atualizado da encomenda                                     |
| `400`  | `{ "error": "Status de pagamento inválido" }`                     |
| `404`  | `{ "error": "Encomenda não encontrada ou acesso negado." }`       |

---

## DELETE `/orders/:id`

Remove uma encomenda e seus itens.

### Parâmetros de Rota

| Parâmetro | Tipo     | Descrição          |
| --------- | -------- | ------------------ |
| `id`      | `number` | ID da encomenda    |

### Respostas

| Status | Corpo                                                              |
| ------ | ------------------------------------------------------------------ |
| `204`  | Sem corpo                                                          |
| `400`  | `{ "error": "ID inválido" }`                                      |
| `404`  | `{ "error": "Encomenda não encontrada ou acesso negado." }`       |
