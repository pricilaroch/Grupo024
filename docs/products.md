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

| Status | Corpo                              |
| ------ | ---------------------------------- |
| `201`  | `{ id, nome, descricao, ... }`     |
| `400`  | `{ "error": "<validação>" }`       |
| `401`  | `{ "error": "Token inválido..." }` |
| `500`  | `{ "error": "Erro interno..." }`   |

---

## GET `/products`

Lista todos os produtos do usuário autenticado.

### Respostas

| Status | Corpo                                    |
| ------ | ---------------------------------------- |
| `200`  | `[ { id, nome, preco_venda, ... }, ... ]`|
| `401`  | `{ "error": "Token inválido..." }`       |

---

## GET `/products/:id`

Retorna um produto específico do usuário.

### Parâmetros de Rota

| Parâmetro | Tipo     | Descrição       |
| --------- | -------- | --------------- |
| `id`      | `number` | ID do produto   |

### Respostas

| Status | Corpo                                                           |
| ------ | --------------------------------------------------------------- |
| `200`  | `{ id, nome, descricao, preco_venda, ... }`                    |
| `400`  | `{ "error": "ID inválido" }`                                   |
| `404`  | `{ "error": "Produto não encontrado ou acesso negado." }`      |

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

| Status | Corpo                                                           |
| ------ | --------------------------------------------------------------- |
| `200`  | `{ id, nome, descricao, preco_venda, ... }`                    |
| `400`  | `{ "error": "ID inválido" }` ou `{ "error": "Nenhum campo..." }`|
| `404`  | `{ "error": "Produto não encontrado ou acesso negado." }`      |

---

## DELETE `/products/:id`

Remove um produto.

### Parâmetros de Rota

| Parâmetro | Tipo     | Descrição       |
| --------- | -------- | --------------- |
| `id`      | `number` | ID do produto   |

### Respostas

| Status | Corpo                                                           |
| ------ | --------------------------------------------------------------- |
| `204`  | Sem corpo                                                       |
| `400`  | `{ "error": "ID inválido" }`                                   |
| `404`  | `{ "error": "Produto não encontrado ou acesso negado." }`      |
