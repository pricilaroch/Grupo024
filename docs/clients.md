# Clientes — `/clients`

CRUD completo de clientes. Todas as rotas exigem JWT de usuário com status **aprovado**. Cada usuário só acessa seus próprios clientes.

---

## POST `/clients`

Cadastra um novo cliente.

### Corpo da Requisição (JSON)

| Campo     | Tipo     | Obrigatório | Regras                                              |
| --------- | -------- | ----------- | --------------------------------------------------- |
| `nome`    | `string` | Sim         | Mínimo 3 caracteres                                |
| `telefone`| `string` | Sim         | Formato `(XX) 9XXXX-XXXX` ou `XX9XXXXXXXX`         |
| `email`   | `string` | Não         | E-mail válido ou string vazia                       |
| `endereco`| `string` | Sim         | Mínimo 5 caracteres                                |

#### Exemplo

```json
{
  "nome": "João Souza",
  "telefone": "(34) 99888-7777",
  "email": "joao@email.com",
  "endereco": "Av. Brasil, 456"
}
```

### Respostas

| Status | Descrição                          |
| ------ | -------------------------------- |
| `201`  | Cliente criado com sucesso       |
| `400`  | Campos inválidos ou ausentes     |
| `401`  | Token inválido                   |

#### `201` Created

```json
{
  "id": 5,
  "user_id": 1,
  "nome": "João Souza",
  "telefone": "(34) 99888-7777",
  "email": "joao@email.com",
  "endereco": "Av. Brasil, 456",
  "created_at": "2026-02-28T16:00:00.000Z"
}
```

#### `400` Bad Request

```json
{ "error": "Telefone inválido. Use (XX) 9XXXX-XXXX" }
```

---

## GET `/clients`

Lista todos os clientes do usuário autenticado.

### Respostas

| Status | Descrição                          |
| ------ | -------------------------------- |
| `200`  | Lista de clientes do usuário     |

#### `200` OK

```json
[
  {
    "id": 5,
    "user_id": 1,
    "nome": "João Souza",
    "telefone": "(34) 99888-7777",
    "email": "joao@email.com",
    "endereco": "Av. Brasil, 456"
  },
  {
    "id": 6,
    "user_id": 1,
    "nome": "Ana Lima",
    "telefone": "(34) 99777-6666",
    "email": "",
    "endereco": "Rua Goiás, 789"
  }
]
```

---

## GET `/clients/:id`

Retorna um cliente específico.

### Parâmetros de Rota

| Parâmetro | Tipo     | Descrição       |
| --------- | -------- | --------------- |
| `id`      | `number` | ID do cliente   |

### Respostas

| Status | Descrição                                            |
| ------ | ---------------------------------------------------- |
| `200`  | Cliente encontrado                                  |
| `400`  | ID inválido                                         |
| `404`  | Cliente não encontrado ou não pertence ao usuário    |

#### `200` OK

```json
{
  "id": 5,
  "user_id": 1,
  "nome": "João Souza",
  "telefone": "(34) 99888-7777",
  "email": "joao@email.com",
  "endereco": "Av. Brasil, 456"
}
```

#### `404` Not Found

```json
{ "error": "Cliente não encontrado ou acesso negado." }
```

---

## PATCH `/clients/:id`

Atualiza parcialmente um cliente. Todos os campos são opcionais.

### Parâmetros de Rota

| Parâmetro | Tipo     | Descrição       |
| --------- | -------- | --------------- |
| `id`      | `number` | ID do cliente   |

### Corpo da Requisição (JSON)

| Campo     | Tipo     | Obrigatório | Regras                                              |
| --------- | -------- | ----------- | --------------------------------------------------- |
| `nome`    | `string` | Não         | Mínimo 3 caracteres                                |
| `telefone`| `string` | Não         | Formato `(XX) 9XXXX-XXXX` ou `XX9XXXXXXXX`         |
| `email`   | `string` | Não         | E-mail válido ou string vazia                       |
| `endereco`| `string` | Não         | Mínimo 5 caracteres                                |

### Respostas

| Status | Descrição                                            |
| ------ | ---------------------------------------------------- |
| `200`  | Cliente atualizado                                  |
| `400`  | ID inválido ou nenhum campo enviado                 |
| `404`  | Cliente não encontrado ou não pertence ao usuário    |

#### `200` OK

```json
{
  "id": 5,
  "user_id": 1,
  "nome": "João Souza",
  "telefone": "(34) 99888-7777",
  "email": "joao_novo@email.com",
  "endereco": "Av. Brasil, 456"
}
```

#### `400` Bad Request

```json
{ "error": "Nenhum campo para atualizar" }
```

#### `404` Not Found

```json
{ "error": "Cliente não encontrado ou acesso negado." }
```

---

## DELETE `/clients/:id`

Remove um cliente.

### Parâmetros de Rota

| Parâmetro | Tipo     | Descrição       |
| --------- | -------- | --------------- |
| `id`      | `number` | ID do cliente   |

### Respostas

| Status | Descrição                                            |
| ------ | ---------------------------------------------------- |
| `204`  | Cliente removido (sem corpo)                        |
| `400`  | ID inválido                                         |
| `404`  | Cliente não encontrado ou não pertence ao usuário    |

#### `400` Bad Request

```json
{ "error": "ID inválido" }
```

#### `404` Not Found

```json
{ "error": "Cliente não encontrado ou acesso negado." }
```
