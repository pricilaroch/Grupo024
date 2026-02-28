# Administração — `/admin`

Rotas restritas a usuários com `role = "admin"`. Todas as rotas exigem autenticação JWT com papel de administrador.

---

## GET `/admin/users/pending`

Lista todos os usuários com status **pendente** aguardando aprovação.

### Autenticação

JWT com `role = "admin"`.

### Parâmetros

Nenhum.

### Respostas

| Status | Descrição                                    |
| ------ | ------------------------------------------ |
| `200`  | Lista de usuários pendentes                 |
| `401`  | Token inválido ou sem permissão de admin    |
| `500`  | Erro interno do servidor                   |

#### `200` OK

```json
{
  "users": [
    {
      "id": 4,
      "nome": "Carlos Mendes",
      "nome_fantasia": "Arte do Carlos",
      "email": "carlos@email.com",
      "cpf": "987.654.321-00",
      "status": "pendente",
      "role": "user",
      "created_at": "2026-02-27T10:00:00.000Z"
    }
  ]
}
```

#### `401` Unauthorized

```json
{ "error": "Acesso restrito a administradores." }
```

---

## PATCH `/admin/users/:id/status`

Aprova ou reprova o cadastro de um usuário pendente.

### Autenticação

JWT com `role = "admin"`.

### Parâmetros de Rota

| Parâmetro | Tipo     | Descrição              |
| --------- | -------- | ---------------------- |
| `id`      | `number` | ID do usuário alvo     |

### Corpo da Requisição (JSON)

| Campo    | Tipo     | Obrigatório | Regras                                       |
| -------- | -------- | ----------- | -------------------------------------------- |
| `status` | `string` | Sim         | Valores aceitos: `"aprovado"`, `"reprovado"` |
| `motivo` | `string` | Não         | Texto livre (motivo da decisão)              |

#### Exemplo

```json
{
  "status": "aprovado",
  "motivo": "Documentação validada"
}
```

### Respostas

| Status | Descrição                                  |
| ------ | ---------------------------------------- |
| `200`  | Status atualizado com sucesso            |
| `400`  | ID ou campo inválido                     |
| `401`  | Token inválido ou sem permissão de admin  |
| `404`  | Usuário não encontrado                    |
| `500`  | Erro interno do servidor                 |

#### `200` OK

```json
{
  "message": "Usuário aprovado com sucesso.",
  "user": {
    "id": 4,
    "nome": "Carlos Mendes",
    "email": "carlos@email.com",
    "status": "aprovado",
    "role": "user"
  }
}
```

#### `400` Bad Request

```json
{ "error": "Status inválido. Use \"aprovado\" ou \"reprovado\"." }
```

#### `404` Not Found

```json
{ "error": "Usuário não encontrado." }
```
