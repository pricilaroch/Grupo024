# Vendas — `/sales`

Registro de vendas (livro caixa). Vendas podem ser criadas manualmente ou automaticamente ao marcar uma encomenda como paga. Todas as rotas exigem JWT de usuário com status **aprovado**.

---

## POST `/sales`

Registra uma venda manual.

### Corpo da Requisição (JSON)

| Campo             | Tipo            | Obrigatório | Regras                                                                |
| ----------------- | --------------- | ----------- | --------------------------------------------------------------------- |
| `client_id`       | `number\|null`  | Não         | Inteiro positivo ou `null`                                            |
| `valor_total`     | `number`        | Sim         | Maior que zero                                                        |
| `valor_lucro`     | `number`        | Não         | Lucro da venda                                                        |
| `forma_pagamento` | `string`        | Sim         | `"pix"`, `"dinheiro"`, `"cartao_credito"` ou `"cartao_debito"`       |
| `data_venda`      | `string`        | Não         | Data da venda                                                         |
| `descricao`       | `string`        | Não         | Texto descritivo                                                      |

#### Exemplo

```json
{
  "client_id": 1,
  "valor_total": 120.00,
  "valor_lucro": 45.00,
  "forma_pagamento": "pix",
  "data_venda": "2026-02-28",
  "descricao": "Venda de 3 bolos"
}
```

### Respostas

| Status | Corpo                                                                               |
| ------ | ----------------------------------------------------------------------------------- |
| `201`  | `{ id, user_id, client_id, valor_total, valor_lucro, forma_pagamento, ... }`       |
| `400`  | `{ "error": "<validação>" }`                                                        |

---

## GET `/sales`

Lista todas as vendas do usuário autenticado.

### Respostas

| Status | Corpo                                                       |
| ------ | ----------------------------------------------------------- |
| `200`  | `[ { id, valor_total, forma_pagamento, data_venda, ... } ]` |

---

## GET `/sales/follow-up`

Retorna a média de dias entre criação da encomenda e pagamento (follow-up).

### Respostas

| Status | Corpo                                     |
| ------ | ----------------------------------------- |
| `200`  | `{ "avg_days": 3.5, "count": 12 }`       |

---

## PATCH `/sales/:id`

Atualiza parcialmente uma venda.

### Parâmetros de Rota

| Parâmetro | Tipo     | Descrição     |
| --------- | -------- | ------------- |
| `id`      | `number` | ID da venda   |

### Corpo da Requisição (JSON)

| Campo             | Tipo            | Obrigatório | Regras                                                                |
| ----------------- | --------------- | ----------- | --------------------------------------------------------------------- |
| `client_id`       | `number\|null`  | Não         | Inteiro positivo ou `null`                                            |
| `valor_total`     | `number`        | Não         | Maior que zero                                                        |
| `valor_lucro`     | `number`        | Não         | Lucro da venda                                                        |
| `forma_pagamento` | `string`        | Não         | `"pix"`, `"dinheiro"`, `"cartao_credito"` ou `"cartao_debito"`       |
| `data_venda`      | `string`        | Não         | Data da venda                                                         |
| `descricao`       | `string`        | Não         | Texto descritivo                                                      |

### Respostas

| Status | Corpo                                                                               |
| ------ | ----------------------------------------------------------------------------------- |
| `200`  | Objeto atualizado da venda                                                          |
| `400`  | `{ "error": "ID inválido" }`                                                        |
| `404`  | `{ "error": "..." }` — venda não encontrada                                         |

---

## DELETE `/sales/:id`

Remove uma venda.

### Parâmetros de Rota

| Parâmetro | Tipo     | Descrição     |
| --------- | -------- | ------------- |
| `id`      | `number` | ID da venda   |

### Respostas

| Status | Corpo                                                         |
| ------ | ------------------------------------------------------------- |
| `204`  | Sem corpo                                                     |
| `400`  | `{ "error": "ID inválido" }`                                 |
| `404`  | `{ "error": "Venda não encontrada ou acesso negado." }`      |
