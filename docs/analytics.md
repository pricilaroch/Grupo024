# Análises — `/analytics`

Rotas de análise financeira: extrato de movimentações, balanço e acompanhamento de metas. Todas as rotas exigem JWT de usuário com status **aprovado**.

---

## GET `/analytics/movements`

Retorna extrato unificado de movimentações (vendas como entradas + despesas pagas como saídas), ordenado por data.

### Parâmetros

Nenhum.

### Respostas

| Status | Corpo                                                                                                                |
| ------ | -------------------------------------------------------------------------------------------------------------------- |
| `200`  | Array de movimentações (ver estrutura abaixo)                                                                        |
| `401`  | `{ "error": "Token inválido ou expirado." }`                                                                        |

#### Estrutura de cada movimentação

```json
{
  "id": 1,
  "tipo": "entrada",
  "descricao": "Venda #5",
  "valor": 120.00,
  "data": "2026-02-28",
  "forma_pagamento": "pix",
  "origem_id": 5
}
```

```json
{
  "id": 2,
  "tipo": "saida",
  "descricao": "Compra de farinha",
  "valor": 50.00,
  "data": "2026-02-27",
  "categoria": "materia_prima",
  "origem_id": 3
}
```

---

## GET `/analytics/balance`

Retorna o balanço financeiro: total de vendas, despesas pagas, despesas pendentes, saldo real e saldo projetado.

### Parâmetros

Nenhum.

### Respostas

| Status | Corpo                                              |
| ------ | -------------------------------------------------- |
| `200`  | Objeto de balanço (ver estrutura abaixo)           |

#### Estrutura da resposta

```json
{
  "total_vendas": 5000.00,
  "despesas_pagas": 1200.00,
  "despesas_pendentes": 300.00,
  "saldo_real": 3800.00,
  "saldo_projetado": 3500.00
}
```

| Campo                | Descrição                                            |
| -------------------- | ---------------------------------------------------- |
| `total_vendas`       | Soma de `valor_total` de todas as vendas             |
| `despesas_pagas`     | Soma de despesas com `status = "pago"`               |
| `despesas_pendentes` | Soma de despesas com `status = "pendente"`           |
| `saldo_real`         | `total_vendas - despesas_pagas`                      |
| `saldo_projetado`    | `total_vendas - despesas_pagas - despesas_pendentes` |

---

## GET `/analytics/goal`

Retorna o progresso em relação a uma meta mensal de faturamento.

### Query Parameters

| Parâmetro | Tipo     | Obrigatório | Descrição                                        |
| --------- | -------- | ----------- | ------------------------------------------------ |
| `meta`    | `number` | Não         | Valor da meta mensal (padrão: `0`). Não negativo |

#### Exemplo

```
GET /analytics/goal?meta=5000
```

### Respostas

| Status | Corpo                                              |
| ------ | -------------------------------------------------- |
| `200`  | Objeto de meta (ver estrutura abaixo)              |
| `400`  | `{ "error": "Parâmetro \"meta\" inválido." }`      |

#### Estrutura da resposta

```json
{
  "meta_valor": 5000.00,
  "realizado": 3200.00,
  "percentual": 64.0,
  "lucro_realizado": 1500.00,
  "caixinha": 150.00
}
```

| Campo              | Descrição                               |
| ------------------ | --------------------------------------- |
| `meta_valor`       | Valor da meta informada                 |
| `realizado`        | Total de vendas realizadas no mês       |
| `percentual`       | `(realizado / meta_valor) * 100`        |
| `lucro_realizado`  | Soma dos lucros no mês                  |
| `caixinha`         | 10% do `lucro_realizado` (reserva)      |
