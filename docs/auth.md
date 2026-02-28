# Autenticação — `/login`

Rota pública para autenticação de usuários via CPF e senha, retornando um token JWT.

---

## POST `/login`

Autentica o usuário e retorna um JWT junto com dados públicos do perfil.

### Autenticação

Nenhuma (rota pública).

### Corpo da Requisição (JSON)

| Campo  | Tipo     | Obrigatório | Regras             |
| ------ | -------- | ----------- | ------------------ |
| `cpf`  | `string` | Sim         | Não pode ser vazio |
| `senha`| `string` | Sim         | Não pode ser vazio |

#### Exemplo

```json
{
  "cpf": "123.456.789-00",
  "senha": "minha_senha_segura"
}
```

### Respostas

| Status | Corpo                                                                                         |
| ------ | --------------------------------------------------------------------------------------------- |
| `200`  | `{ "message": "Login realizado com sucesso.", "token": "<JWT>", "user": { ... } }`           |
| `400`  | `{ "error": "<mensagem de validação>" }` — campos inválidos ou ausentes                      |
| `401`  | `{ "error": "..." }` — credenciais inválidas ou usuário não aprovado                         |
| `500`  | `{ "error": "Erro interno do servidor." }`                                                   |

### Sobre o Token JWT

O token retornado deve ser enviado nas rotas protegidas via header:

```
Authorization: Bearer <token>
```

**Payload do token:**

```json
{
  "id": 1,
  "status": "aprovado",
  "role": "user"
}
```
