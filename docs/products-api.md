# API /products — Documentação

Visão geral
- Recurso: Produtos (products).
- Base URL (no projeto): `http://{HOST}:{PORT}/products`
- Autenticação: algumas rotas são protegidas (criação, atualização, exclusão, rotas por usuário). A rota `GET /products` é pública e retorna apenas produtos ativos.
- Multi-tenancy: produtos pertencem a um `user_id`; apenas o dono pode criar/editar/deletar.

Schema (resumo) — criação (`createProductSchema`)
- `nome` (string, obrigatório, min 3)
- `descricao` (string, obrigatório, min 5)
- `preco_venda` (number, obrigatório, >0)
- `preco_custo` (number, opcional)
- `unidade_medida` (string, opcional)
- `quantidade_estoque` (int, opcional)
- `tempo_producao_minutos` (int, opcional)
- `imagem_url` (string, opcional, URL)
- `categoria` (string, obrigatório, min 3)

Cabeçalhos / Auth
- `Authorization: Bearer <JWT>` (para rotas protegidas)

Endpoints

- Criar produto
  - Método: POST
  - URL: `/products`
  - Requer: auth
  - Body (exemplo):
```json
{
  "nome": "Pão de Queijo",
  "descricao": "Pacote com 10 unidades",
  "preco_venda": 12.5,
  "preco_custo": 6.0,
  "unidade_medida": "pacote",
  "quantidade_estoque": 50,
  "tempo_producao_minutos": 30,
  "imagem_url": "https://example.com/img.jpg",
  "categoria": "salgados"
}
```
  - Retornos:
    - 201: produto criado
    - 400: validação Zod
    - 401: JWT inválido/expirado

- Listar todos produtos (público)
  - Método: GET
  - URL: `/products`
  - Retorno 200: lista de `PublicProduct` (apenas produtos `ativo = 1`)

- Obter produto por id (protegido)
  - Método: GET
  - URL: `/products/:id`
  - Retorno 200: produto se existir e for acessível pelo usuário (ou 404)

- Listar produtos do usuário
  - Método: GET
  - URL: `/products/user`
  - Requer: auth
  - Retorno 200: array de produtos do usuário

- Atualizar produto
  - Método: PATCH
  - URL: `/products/:id`
  - Requer: auth (só o dono pode atualizar)
  - Body: campos parciais permitidos (usar `updateProductSchema`)
  - Retorno: 200 produto atualizado / 404 se não encontrado ou sem permissão

- Deletar produto
  - Método: DELETE
  - URL: `/products/:id`
  - Requer: auth
  - Retorno: 204 ou 404

Regras e observações
- `ativo` controla visibilidade pública; `GET /products` retorna apenas `ativo = 1`.
- Valide sempre `user_id` do token para operações que modificam dados.
- Se alterar campos financeiros, verifique impacto em serviços que usam `preco_venda`/`preco_custo` (ex.: `OrderService`).

Arquivos relevantes
- `src/models/Product.ts`
- `src/schemas/product.schema.ts`
- `src/repositories/ProductRepository.ts`
- `src/services/ProductService.ts`
- `src/controllers/ProductController.ts`
- `src/routes/productRoutes.ts`

Quer exemplos curl para esses endpoints ou um OpenAPI/Swagger gerado automaticamente?