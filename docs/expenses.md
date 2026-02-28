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

| Status | Descrição                       |
| ------ | --------------------------- |
| `201`  | Despesa criada com sucesso  |
| `400`  | Campos inválidos ou ausentes  |

#### `201` Created

```json
{
  "id": 9,
  "user_id": 1,
  "valor": 250.00,
  "categoria": "materia_prima",
  "descricao": "Compra de farinha e açúcar",
  "data_emissao": "2026-02-25",
  "data_vencimento": "2026-03-05",
  "status": "pendente",
  "created_at": "2026-02-28T19:00:00.000Z"
}
```

#### `400` Bad Request

```json
{ "error": "Categoria inválida. Use: materia_prima, embalagem, transporte, ..." }
```

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

| Status | Descrição                               |
| ------ | ------------------------------------- |
| `200`  | Lista de despesas (filtrada ou não)  |

#### `200` OK

```json
[
  {
    "id": 9,
    "user_id": 1,
    "valor": 250.00,
    "categoria": "materia_prima",
    "descricao": "Compra de farinha e açúcar",
    "data_emissao": "2026-02-25",
    "data_vencimento": "2026-03-05",
    "status": "pendente"
  }
]
```

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

| Status | Descrição            |
| ------ | ------------------ |
| `200`  | Despesa atualizada |
| `400`  | ID inválido        |

#### `200` OK

```json
{
  "id": 9,
  "user_id": 1,
  "valor": 275.00,
  "categoria": "materia_prima",
  "descricao": "Compra de farinha, açúcar e manteiga",
  "data_emissao": "2026-02-25",
  "data_vencimento": "2026-03-05",
  "status": "pendente"
}
```

#### `400` Bad Request

```json
{ "error": "ID inválido" }
```

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

| Status | Descrição                       |
| ------ | --------------------------- |
| `200`  | Despesa marcada como paga   |
| `400`  | ID inválido                 |
| `404`  | Despesa não encontrada      |

#### `200` OK

```json
{
  "id": 9,
  "user_id": 1,
  "valor": 250.00,
  "categoria": "materia_prima",
  "descricao": "Compra de farinha e açúcar",
  "data_emissao": "2026-02-25",
  "data_vencimento": "2026-03-05",
  "status": "pago"
}
```

#### `404` Not Found

```json
{ "error": "Despesa não encontrada ou acesso negado." }
```

---

## DELETE `/expenses/:id`

Remove uma despesa.

### Parâmetros de Rota

| Parâmetro | Tipo     | Descrição       |
| --------- | -------- | --------------- |
| `id`      | `number` | ID da despesa   |

### Respostas

| Status | Descrição                        |
| ------ | ----------------------------- |
| `204`  | Despesa removida (sem corpo)  |
| `400`  | ID inválido                   |
| `404`  | Despesa não encontrada        |

#### `400` Bad Request

```json
{ "error": "ID inválido" }
```

#### `404` Not Found

```json
{ "error": "Despesa não encontrada ou acesso negado." }
```

---

## GET `/expenses/summary`

Retorna resumo mensal de despesas agrupado por categoria.

### Respostas

| Status | Descrição                        |
| ------ | ----------------------------- |
| `200`  | Resumo mensal de despesas     |

#### `200` OK

```json
[
  {
    "month": "2026-02",
    "total": 500.00,
    "count": 3,
    "by_category": {
      "materia_prima": 250.00,
      "embalagem": 150.00,
      "transporte": 100.00
    }
  },
  {
    "month": "2026-01",
    "total": 320.00,
    "count": 2,
    "by_category": {
      "aluguel": 200.00,
      "energia": 120.00
    }
  }
]
```
