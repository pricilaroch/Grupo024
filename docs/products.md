# Produtos — `/products`

CRUD completo de produtos. Todas as rotas exigem JWT de usuário com status **aprovado**. Cada usuário só acessa seus próprios produtos.

---

## POST `/products`

Cria um novo produto.

### Corpo da Requisição (JSON)

| Campo                    | Tipo      | Obrigatório | Regras                                           |
| ------------------------ | --------- | ----------- | ------------------------------------------------ |
| `nome`                   | `string`  | Sim         | Mínimo 3 caracteres                              |
| `descricao`              | `string`  | Sim         | Mínimo 5 caracteres                              |
| `preco_venda`            | `number`  | Sim         | Número positivo                                  |
| `preco_custo`            | `number`  | Não         | Número positivo                                  |
| `unidade_medida`         | `string`  | Não         | Mínimo 1 caractere                               |
| `quantidade_estoque`     | `number`  | Não         | Inteiro não negativo                             |
| `tempo_producao_minutos` | `number`  | Não         | Inteiro não negativo                             |
| `imagem_url`             | `string`  | Não         | URL válida ou string vazia                       |
| `categoria`              | `string`  | Sim         | Mínimo 3 caracteres                              |

#### Exemplo

```json
{
  "nome": "Bolo de Chocolate",
  "descricao": "Bolo caseiro de chocolate com cobertura",
  "preco_venda": 45.00,
  "preco_custo": 18.50,
  "unidade_medida": "unidade",
  "quantidade_estoque": 10,
  "tempo_producao_minutos": 120,
  "imagem_url": "",
  "categoria": "bolos"
}
```

### Respostas

| Status | Descrição                                        |
| ------ | ------------------------------------------------ |
| `201`  | Produto criado com sucesso                       |
| `400`  | Campos inválidos ou ausentes                     |
| `401`  | Token inválido ou usuário não aprovado           |
| `500`  | Erro interno do servidor                         |

#### `201` Created

```json
{
  "id": 3,
  "user_id": 1,
  "nome": "Bolo de Chocolate",
  "descricao": "Bolo caseiro de chocolate com cobertura",
  "preco_venda": 45.00,
  "preco_custo": 18.50,
  "unidade_medida": "unidade",
  "quantidade_estoque": 10,
  "tempo_producao_minutos": 120,
  "imagem_url": "",
  "categoria": "bolos",
  "ativo": true,
  "created_at": "2026-02-28T15:00:00.000Z"
}
```

#### `400` Bad Request

```json
{ "error": "O nome do produto deve ter pelo menos 3 caracteres." }
```

---

## GET `/products`

Lista todos os produtos do usuário autenticado.

### Respostas

| Status | Descrição                          |
| ------ | -------------------------------- |
| `200`  | Lista de produtos do usuário     |
| `401`  | Token inválido                   |

#### `200` OK

```json
[
  {
    "id": 3,
    "user_id": 1,
    "nome": "Bolo de Chocolate",
    "descricao": "Bolo caseiro de chocolate com cobertura",
    "preco_venda": 45.00,
    "preco_custo": 18.50,
    "unidade_medida": "unidade",
    "quantidade_estoque": 10,
    "tempo_producao_minutos": 120,
    "imagem_url": "",
    "categoria": "bolos",
    "ativo": true
  }
]
```

---

## GET `/products/:id`

Retorna um produto específico do usuário.

### Parâmetros de Rota

| Parâmetro | Tipo     | Descrição       |
| --------- | -------- | --------------- |
| `id`      | `number` | ID do produto   |

### Respostas

| Status | Descrição                                          |
| ------ | -------------------------------------------------- |
| `200`  | Produto encontrado                                |
| `400`  | ID inválido                                       |
| `404`  | Produto não encontrado ou não pertence ao usuário  |

#### `200` OK

```json
{
  "id": 3,
  "user_id": 1,
  "nome": "Bolo de Chocolate",
  "descricao": "Bolo caseiro de chocolate com cobertura",
  "preco_venda": 45.00,
  "preco_custo": 18.50,
  "unidade_medida": "unidade",
  "quantidade_estoque": 10,
  "tempo_producao_minutos": 120,
  "imagem_url": "",
  "categoria": "bolos",
  "ativo": true
}
```

#### `404` Not Found

```json
{ "error": "Produto não encontrado ou acesso negado." }
```

---

## PATCH `/products/:id`

Atualiza parcialmente um produto. Todos os campos são opcionais.

### Parâmetros de Rota

| Parâmetro | Tipo     | Descrição       |
| --------- | -------- | --------------- |
| `id`      | `number` | ID do produto   |

### Corpo da Requisição (JSON)

| Campo                    | Tipo      | Obrigatório | Regras                          |
| ------------------------ | --------- | ----------- | ------------------------------- |
| `nome`                   | `string`  | Não         | Mínimo 3 caracteres             |
| `descricao`              | `string`  | Não         | Mínimo 5 caracteres             |
| `preco_venda`            | `number`  | Não         | Número positivo                 |
| `preco_custo`            | `number`  | Não         | Número positivo                 |
| `unidade_medida`         | `string`  | Não         | Mínimo 1 caractere              |
| `quantidade_estoque`     | `number`  | Não         | Inteiro não negativo            |
| `tempo_producao_minutos` | `number`  | Não         | Inteiro não negativo            |
| `imagem_url`             | `string`  | Não         | URL válida ou string vazia      |
| `categoria`              | `string`  | Não         | Mínimo 3 caracteres             |
| `ativo`                  | `boolean` | Não         | Ativa/desativa o produto        |

### Respostas

| Status | Descrição                                          |
| ------ | -------------------------------------------------- |
| `200`  | Produto atualizado                                |
| `400`  | ID inválido ou nenhum campo enviado               |
| `404`  | Produto não encontrado ou não pertence ao usuário  |

#### `200` OK

```json
{
  "id": 3,
  "user_id": 1,
  "nome": "Bolo de Chocolate Premium",
  "descricao": "Bolo caseiro de chocolate com cobertura",
  "preco_venda": 50.00,
  "preco_custo": 18.50,
  "unidade_medida": "unidade",
  "quantidade_estoque": 8,
  "tempo_producao_minutos": 120,
  "imagem_url": "",
  "categoria": "bolos",
  "ativo": true
}
```

#### `400` Bad Request

```json
{ "error": "Nenhum campo recebido para atualização" }
```

#### `404` Not Found

```json
{ "error": "Produto não encontrado ou acesso negado." }
```

---

## DELETE `/products/:id`

Remove um produto.

### Parâmetros de Rota

| Parâmetro | Tipo     | Descrição       |
| --------- | -------- | --------------- |
| `id`      | `number` | ID do produto   |

### Respostas

| Status | Descrição                                          |
| ------ | -------------------------------------------------- |
| `204`  | Produto removido (sem corpo)                      |
| `400`  | ID inválido                                       |
| `404`  | Produto não encontrado ou não pertence ao usuário  |

#### `400` Bad Request

```json
{ "error": "ID inválido" }
```

#### `404` Not Found

```json
{ "error": "Produto não encontrado ou acesso negado." }
```
