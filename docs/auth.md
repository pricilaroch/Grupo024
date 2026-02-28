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

| Status | Descrição                                        |
| ------ | ------------------------------------------------ |
| `200`  | Login bem-sucedido; retorna token e dados do usuário |
| `400`  | Campos inválidos ou ausentes                     |
| `401`  | Credenciais inválidas ou usuário não aprovado    |
| `500`  | Erro interno do servidor                         |

#### `200` OK

```json
{
  "message": "Login realizado com sucesso.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwic3RhdHVzIjoiYXByb3ZhZG8iLCJyb2xlIjoidXNlciJ9.abc123",
  "user": {
    "id": 1,
    "nome": "Maria Silva",
    "nome_fantasia": "Doces da Maria",
    "email": "maria@email.com",
    "cpf": "123.456.789-00",
    "status": "aprovado",
    "role": "user"
  }
}
```

#### `400` Bad Request

```json
{ "error": "O CPF é obrigatório." }
```

#### `401` Unauthorized

```json
{ "error": "Credenciais inválidas." }
```

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
