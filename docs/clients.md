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

| Status | Corpo                                          |
| ------ | ---------------------------------------------- |
| `201`  | `{ id, nome, telefone, email, endereco, ... }` |
| `400`  | `{ "error": "<validação>" }`                   |
| `401`  | `{ "error": "Token inválido..." }`             |

---

## GET `/clients`

Lista todos os clientes do usuário autenticado.

### Respostas

| Status | Corpo                                          |
| ------ | ---------------------------------------------- |
| `200`  | `[ { id, nome, telefone, ... }, ... ]`         |

---

## GET `/clients/:id`

Retorna um cliente específico.

### Parâmetros de Rota

| Parâmetro | Tipo     | Descrição       |
| --------- | -------- | --------------- |
| `id`      | `number` | ID do cliente   |

### Respostas

| Status | Corpo                                                           |
| ------ | --------------------------------------------------------------- |
| `200`  | `{ id, nome, telefone, email, endereco, ... }`                 |
| `400`  | `{ "error": "ID inválido" }`                                   |
| `404`  | `{ "error": "Cliente não encontrado ou acesso negado." }`      |

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

| Status | Corpo                                                           |
| ------ | --------------------------------------------------------------- |
| `200`  | `{ id, nome, telefone, email, endereco, ... }`                 |
| `400`  | `{ "error": "ID inválido" }` ou `{ "error": "Nenhum campo..." }`|
| `404`  | `{ "error": "Cliente não encontrado ou acesso negado." }`      |

---

## DELETE `/clients/:id`

Remove um cliente.

### Parâmetros de Rota

| Parâmetro | Tipo     | Descrição       |
| --------- | -------- | --------------- |
| `id`      | `number` | ID do cliente   |

### Respostas

| Status | Corpo                                                           |
| ------ | --------------------------------------------------------------- |
| `204`  | Sem corpo                                                       |
| `400`  | `{ "error": "ID inválido" }`                                   |
| `404`  | `{ "error": "Cliente não encontrado ou acesso negado." }`      |
