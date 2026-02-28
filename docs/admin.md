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

| Status | Corpo                                                          |
| ------ | -------------------------------------------------------------- |
| `200`  | `{ "users": [ { ... }, ... ] }` — lista de usuários pendentes |
| `401`  | `{ "error": "Token inválido ou expirado." }`                  |
| `401`  | `{ "error": "Acesso restrito a administradores." }`            |
| `500`  | `{ "error": "Erro interno do servidor." }`                    |

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

| Status | Corpo                                                                   |
| ------ | ----------------------------------------------------------------------- |
| `200`  | `{ "message": "Usuário aprovado com sucesso.", "user": { ... } }`      |
| `400`  | `{ "error": "ID inválido." }` ou `{ "error": "<validação Zod>" }`     |
| `401`  | `{ "error": "Token inválido ou expirado." }`                           |
| `401`  | `{ "error": "Acesso restrito a administradores." }`                    |
| `404`  | `{ "error": "..." }` — usuário não encontrado                          |
| `500`  | `{ "error": "Erro interno do servidor." }`                             |
