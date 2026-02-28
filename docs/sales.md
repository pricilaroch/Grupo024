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

| Status | Descrição                      |
| ------ | -------------------------- |
| `201`  | Venda registrada           |
| `400`  | Campos inválidos ou ausentes |

#### `201` Created

```json
{
  "id": 8,
  "user_id": 1,
  "client_id": 1,
  "order_id": null,
  "valor_total": 120.00,
  "valor_lucro": 45.00,
  "forma_pagamento": "pix",
  "data_venda": "2026-02-28",
  "descricao": "Venda de 3 bolos",
  "created_at": "2026-02-28T18:00:00.000Z"
}
```

#### `400` Bad Request

```json
{ "error": "Forma de pagamento inválida. Use: pix, dinheiro, cartao_credito ou cartao_debito." }
```

---

## GET `/sales`

Lista todas as vendas do usuário autenticado.

### Respostas

| Status | Descrição                      |
| ------ | -------------------------- |
| `200`  | Lista de vendas do usuário  |

#### `200` OK

```json
[
  {
    "id": 8,
    "user_id": 1,
    "client_id": 1,
    "order_id": null,
    "valor_total": 120.00,
    "valor_lucro": 45.00,
    "forma_pagamento": "pix",
    "data_venda": "2026-02-28",
    "descricao": "Venda de 3 bolos"
  }
]
```

---

## GET `/sales/follow-up`

Retorna a média de dias entre criação da encomenda e pagamento (follow-up).

### Respostas

| Status | Descrição                         |
| ------ | ----------------------------- |
| `200`  | Média de dias e total de vendas |

#### `200` OK

```json
{
  "avg_days": 3.5,
  "count": 12
}
```

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

| Status | Descrição                    |
| ------ | ------------------------ |
| `200`  | Venda atualizada         |
| `400`  | ID inválido              |
| `404`  | Venda não encontrada     |

#### `200` OK

```json
{
  "id": 8,
  "user_id": 1,
  "client_id": 1,
  "valor_total": 130.00,
  "valor_lucro": 50.00,
  "forma_pagamento": "dinheiro",
  "data_venda": "2026-02-28",
  "descricao": "Venda atualizada"
}
```

#### `404` Not Found

```json
{ "error": "Venda não encontrada ou acesso negado." }
```

Remove uma venda.

### Parâmetros de Rota

| Parâmetro | Tipo     | Descrição     |
| --------- | -------- | ------------- |
| `id`      | `number` | ID da venda   |

### Respostas

| Status | Descrição                      |
| ------ | -------------------------- |
| `204`  | Venda removida (sem corpo)  |
| `400`  | ID inválido                 |
| `404`  | Venda não encontrada        |

#### `400` Bad Request

```json
{ "error": "ID inválido" }
```

#### `404` Not Found

```json
{ "error": "Venda não encontrada ou acesso negado." }
```
