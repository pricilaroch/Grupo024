# API /clients — Documentação

Visão geral
- Recurso: Clientes (clients).
- Base URL (no projeto): `http://{HOST}:{PORT}/clients`
- Autenticação: JWT obrigatório em todas as rotas; usuário precisa ter `status: 'aprovado'`.
- Multi-tenancy: clientes pertencem a um `user_id`; um usuário só pode ver/editar/excluir seus próprios clientes.

Schema (resumo)
- `nome` (string, obrigatório, min 3 caracteres)
- `telefone` (string, obrigatório, formato `(XX) 9XXXX-XXXX` ou `XXXXXXXXXXX`)
- `email` (string, opcional)
- `endereco` (string, obrigatório, min 5 caracteres)

Cabeçalhos / Auth
- `Authorization: Bearer <JWT>`

Endpoints

- Criar cliente
  - Método: POST
  - URL: `/clients`
  - Body (exemplo):
```json
{
  "nome": "João da Silva",
  "telefone": "(34) 99999-9999",
  "email": "joao@example.com",
  "endereco": "Rua A, 123, Bairro B"
}
```
  - Respostas:
    - 201: cliente criado (objeto cliente)
    - 400: validação Zod ou telefone inválido
    - 401: JWT inválido/expirado

- Listar clientes do usuário
  - Método: GET
  - URL: `/clients`
  - Retorno 200: array de clientes pertencentes ao usuário

- Obter cliente por id
  - Método: GET
  - URL: `/clients/:id`
  - Retorno:
    - 200: cliente (se pertencer ao usuário)
    - 404: não encontrado ou pertence a outro usuário

- Atualizar cliente
  - Método: PUT
  - URL: `/clients/:id`
  - Body: mesmo schema (todos campos obrigatórios no PUT) — o controller/serviço aplica validações adicionais
  - Retorno:
    - 200: cliente atualizado
    - 400: dados inválidos
    - 404: não encontrado ou sem permissão

- Deletar cliente
  - Método: DELETE
  - URL: `/clients/:id`
  - Retorno:
    - 204: sucesso
    - 404: não encontrado ou sem permissão

Regras e observações
- O telefone é normalizado (numeros apenas) no `ClientService` e validado quanto ao tamanho.
- A exclusão usa `ON DELETE CASCADE` nas FK relacionadas (ex.: se um usuário for removido) conforme migrations.
- Sempre verifique o `user_id` do token para garantir multi-tenancy.

Arquivos relevantes
- `src/models/Client.ts`
- `src/schemas/client.schema.ts`
- `src/repositories/ClientRepository.ts`
- `src/services/ClientService.ts`
- `src/controllers/ClientController.ts`
- `src/routes/clientRoutes.ts`

Quer exemplos curl para esses endpoints ou um OpenAPI/Swagger gerado automaticamente?