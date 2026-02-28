# Usuários — `/users`

Rotas públicas para registro de novos usuários na plataforma.

---

## POST `/users/register`

Cadastra um novo usuário. O usuário ficará com status **pendente** até ser aprovado por um administrador.

### Autenticação

Nenhuma (rota pública).

### Corpo da Requisição (JSON)

| Campo                | Tipo     | Obrigatório | Regras                                                        |
| -------------------- | -------- | ----------- | ------------------------------------------------------------- |
| `nome`               | `string` | Sim         | Mínimo 3 caracteres                                          |
| `cpf`                | `string` | Sim         | 11–14 caracteres; apenas dígitos, pontos e hífens             |
| `cnpj`               | `string` | Não         | Máx. 18 caracteres; apenas dígitos, pontos, hífens ou barras  |
| `nome_fantasia`      | `string` | Sim         | Mínimo 2 caracteres                                          |
| `categoria_producao` | `string` | Sim         | Mínimo 1 caractere                                           |
| `email`              | `string` | Sim         | E-mail válido                                                 |
| `telefone`           | `string` | Sim         | Mínimo 10 caracteres                                         |
| `data_nascimento`    | `string` | Sim         | Formato `AAAA-MM-DD`                                         |
| `observacao`         | `string` | Não         | Texto livre                                                   |
| `endereco`           | `string` | Sim         | Mínimo 5 caracteres                                          |
| `senha`              | `string` | Sim         | Mínimo 6 caracteres                                          |

#### Exemplo

```json
{
  "nome": "Maria Silva",
  "cpf": "123.456.789-00",
  "cnpj": "",
  "nome_fantasia": "Doces da Maria",
  "categoria_producao": "confeitaria",
  "email": "maria@email.com",
  "telefone": "(34) 99999-9999",
  "data_nascimento": "1990-05-15",
  "observacao": "",
  "endereco": "Rua das Flores, 123",
  "senha": "minha_senha_segura"
}
```

### Respostas

| Status | Descrição                                                         |
| ------ | ----------------------------------------------------------------- |
| `201`  | Usuário criado com sucesso (aguardando aprovação)                 |
| `400`  | Campos inválidos ou ausentes                                      |
| `409`  | CPF ou e-mail já cadastrado                                       |
| `500`  | Erro interno do servidor                                          |

#### `201` Created

```json
{
  "message": "Cadastro realizado com sucesso! Aguarde a aprovação do administrador.",
  "user": {
    "id": 7,
    "nome": "Maria Silva",
    "nome_fantasia": "Doces da Maria",
    "email": "maria@email.com",
    "cpf": "123.456.789-00",
    "telefone": "(34) 99999-9999",
    "categoria_producao": "confeitaria",
    "status": "pendente",
    "role": "user",
    "created_at": "2026-02-28T14:30:00.000Z"
  }
}
```

#### `400` Bad Request

```json
{ "error": "O nome deve ter pelo menos 3 caracteres.; E-mail inválido." }
```

#### `500` Internal Server Error

```json
{ "error": "Erro interno do servidor." }
```
