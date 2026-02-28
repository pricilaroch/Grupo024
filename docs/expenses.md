# Despesas — `/expenses`

Gerenciamento de despesas com controle de status (pendente/pago) e resumo mensal. Todas as rotas exigem JWT de usuário com status **aprovado**.

---

## POST `/expenses`

Registra uma nova despesa.

### Corpo da Requisição (JSON)

| Campo             | Tipo     | Obrigatório | Regras                                                                                                                                                                 |
| ----------------- | -------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `valor`           | `number` | Sim         | Maior que zero                                                                                                                                                         |
| `categoria`       | `string` | Sim         | Uma de: `materia_prima`, `embalagem`, `transporte`, `aluguel`, `energia`, `agua`, `internet`, `marketing`, `equipamento`, `manutencao`, `impostos`, `salarios`, `outros` |
| `descricao`       | `string` | Não         | Texto descritivo                                                                                                                                                        |
| `data_emissao`    | `string` | Não         | Data de emissão                                                                                                                                                         |
| `data_vencimento` | `string` | Não         | Data de vencimento                                                                                                                                                      |

#### Exemplo

```json
{
  "valor": 250.00,
  "categoria": "materia_prima",
  "descricao": "Compra de farinha e açúcar",
  "data_emissao": "2026-02-25",
  "data_vencimento": "2026-03-05"
}
```

### Respostas

| Status | Corpo                                                                        |
| ------ | ---------------------------------------------------------------------------- |
| `201`  | `{ id, valor, categoria, descricao, status, data_emissao, ... }`            |
| `400`  | `{ "error": "<validação>" }`                                                 |

---

## GET `/expenses`

Lista despesas do usuário. Opcionalmente filtra por status.

### Query Parameters

| Parâmetro | Tipo     | Obrigatório | Descrição                                  |
| --------- | -------- | ----------- | ------------------------------------------ |
| `status`  | `string` | Não         | Filtra por `"pendente"` ou `"pago"`        |

#### Exemplos

```
GET /expenses
GET /expenses?status=pendente
```

### Respostas

| Status | Corpo                                                    |
| ------ | -------------------------------------------------------- |
| `200`  | `[ { id, valor, categoria, status, ... }, ... ]`         |

---

## PATCH `/expenses/:id`

Atualiza parcialmente uma despesa.

### Parâmetros de Rota

| Parâmetro | Tipo     | Descrição       |
| --------- | -------- | --------------- |
| `id`      | `number` | ID da despesa   |

### Corpo da Requisição (JSON)

| Campo             | Tipo     | Obrigatório | Regras                       |
| ----------------- | -------- | ----------- | ---------------------------- |
| `valor`           | `number` | Não         | Maior que zero               |
| `categoria`       | `string` | Não         | Mesmas categorias da criação |
| `descricao`       | `string` | Não         | Texto descritivo             |
| `data_emissao`    | `string` | Não         | Data de emissão              |
| `data_vencimento` | `string` | Não         | Data de vencimento           |

### Respostas

| Status | Corpo                                                |
| ------ | ---------------------------------------------------- |
| `200`  | Objeto atualizado da despesa                         |
| `400`  | `{ "error": "ID inválido" }`                         |

---

## PATCH `/expenses/:id/pay`

Marca uma despesa como **paga** (atalho para `pendente → pago`).

### Parâmetros de Rota

| Parâmetro | Tipo     | Descrição       |
| --------- | -------- | --------------- |
| `id`      | `number` | ID da despesa   |

### Corpo da Requisição

Nenhum.

### Respostas

| Status | Corpo                                                |
| ------ | ---------------------------------------------------- |
| `200`  | Objeto da despesa com `status: "pago"`               |
| `400`  | `{ "error": "ID inválido" }`                         |
| `404`  | `{ "error": "..." }` — despesa não encontrada        |

---

## DELETE `/expenses/:id`

Remove uma despesa.

### Parâmetros de Rota

| Parâmetro | Tipo     | Descrição       |
| --------- | -------- | --------------- |
| `id`      | `number` | ID da despesa   |

### Respostas

| Status | Corpo                                                            |
| ------ | ---------------------------------------------------------------- |
| `204`  | Sem corpo                                                        |
| `400`  | `{ "error": "ID inválido" }`                                    |
| `404`  | `{ "error": "Despesa não encontrada ou acesso negado." }`       |

---

## GET `/expenses/summary`

Retorna resumo mensal de despesas agrupado por categoria.

### Respostas

| Status | Corpo                                                                                      |
| ------ | ------------------------------------------------------------------------------------------ |
| `200`  | `[ { "month": "2026-02", "total": 500.00, "count": 5, "by_category": { ... } }, ... ]`   |
