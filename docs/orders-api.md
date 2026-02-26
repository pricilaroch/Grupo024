# API /orders — Documentação

Visão geral
- Recurso: Encomendas (orders) e Itens de Encomenda (order_items).
- Base URL (no projeto): `http://{HOST}:{PORT}/orders`
- Autenticação: JWT obrigatório em todas as rotas (exceto partes públicas se existirem). O JWT deve representar um usuário com `status: 'aprovado'`.
- Multi-tenancy: Usuário só pode atuar sobre seus próprios clientes e produtos; o `user_id` vem do token.

Comportamento importante
- Criação é transacional: `Order` + `OrderItems` são inseridos dentro de uma transação.
- Snapshot de preços: Ao criar a encomenda, salvamos `preco_venda_unitario` e `preco_custo_unitario` de cada produto para preservar histórico.
- Cálculos realizados no backend:
  - `valor_subtotal` = sum(preco_venda_unitario * quantidade)
  - `valor_total` = (valor_subtotal + taxa_entrega) - desconto
  - `valor_lucro_total` = (valor_subtotal - custo_total) - desconto

Cabeçalhos / Auth
- `Authorization: Bearer <JWT>`

Schemas (resumo)
- CreateOrder (request body):
  - `client_id` (number, obrigatório)
  - `forma_pagamento` ("pix"|"dinheiro"|"cartao_credito"|"cartao_debito") opcional
  - `tipo_entrega` ("retirada"|"entrega") default `retirada`
  - `taxa_entrega` (number) opcional
  - `desconto` (number) opcional
  - `data_entrega` (string) opcional
  - `observacoes` (string) opcional
  - `items` (array) obrigatório — cada item: `{ product_id: number, quantidade: number }`

Principais endpoints

- Criar encomenda
  - Método: POST
  - URL: `/orders`
  - Autorização: required
  - Body (exemplo):

```json
{
  "client_id": 12,
  "forma_pagamento": "pix",
  "tipo_entrega": "entrega",
  "taxa_entrega": 5.00,
  "desconto": 2.50,
  "observacoes": "Entrega até às 18h",
  "items": [
    { "product_id": 3, "quantidade": 2 },
    { "product_id": 7, "quantidade": 1 }
  ]
}
```
  - Resposta (201): objeto `order` com itens e campos calculados (subtotal, total, lucro, timestamps).
  - Erros comuns:
    - 400: validação do body (Zod)
    - 401: token inválido/expirado
    - 404: cliente ou produto não encontrado / pertence a outro usuário

- Listar encomendas do usuário
  - Método: GET
  - URL: `/orders`
  - Resposta (200): lista de encomendas (cada uma com `items`)

- Buscar encomenda por id
  - Método: GET
  - URL: `/orders/:id`
  - Retorna 200 com o pedido (se pertencer ao usuário) ou 404

- Filtrar por status
  - Método: GET
  - URL: `/orders/status?status=pendente`
  - Status válidos: `pendente`, `em_producao`, `pronto`, `entregue`, `cancelado`

- Obter items de uma encomenda
  - Método: GET
  - URL: `/orders/:id/items`
  - Retorna array de items (cada item possui `preco_venda_unitario` e `preco_custo_unitario` — snapshot)

- Atualizar encomenda (parcial)
  - Método: PATCH
  - URL: `/orders/:id`
  - Body: campos permitidos (status, forma_pagamento, status_pagamento, tipo_entrega, taxa_entrega, desconto, data_entrega, observacoes)
  - Observação: alteração de desconto/taxa recalcula `valor_total` no repositório/service

- Deletar encomenda
  - Método: DELETE
  - URL: `/orders/:id`
  - Retorno: 204 se sucesso, 404 se não existir/permiso

Exemplos de respostas (simplificado)

- Exemplo de `order` retornada após criação:
```json
{
  "id": 42,
  "user_id": 5,
  "client_id": 12,
  "status": "pendente",
  "forma_pagamento": "pix",
  "status_pagamento": "pendente",
  "tipo_entrega": "entrega",
  "taxa_entrega": 5.00,
  "valor_subtotal": 150.00,
  "desconto": 2.50,
  "valor_total": 152.50,
  "valor_lucro_total": 50.00,
  "observacoes": "Entrega até 18h",
  "items": [
    { "id": 1, "product_id": 3, "quantidade": 2, "preco_venda_unitario": 50.00, "preco_custo_unitario": 20.00 },
    { "id": 2, "product_id": 7, "quantidade": 1, "preco_venda_unitario": 50.00, "preco_custo_unitario": 10.00 }
  ],
  "created_at": "2026-02-25 12:00:00",
  "updated_at": "2026-02-25 12:00:00"
}
```

Erros e códigos
- 400 — Validação (Zod) ou lógica (ex: desconto maior que total)
- 401 — JWT inválido/expirado ou usuário não aprovado
- 404 — Recurso não encontrado ou pertence a outro usuário
- 409 — Conflito (quando aplicável)
- 500 — Erro interno

Notas operacionais para desenvolvedores
- A criação chama `OrderService.createOrder` que valida propriedade do cliente e produtos, realiza snapshot de preços e chama `OrderRepository.create` para inserir `orders` e `order_items` dentro de uma transação.
- Ao adicionar novos campos aos itens ou à tabela de orders, atualize:
  - migration SQL (se necessário)
  - `models/Order.ts`
  - `schemas/order.schema.ts`
  - `repositories/OrderRepository.ts`
  - `services/OrderService.ts`
  - `controllers/OrderController.ts`

Arquivo(s) relevantes
- `src/models/Order.ts`
- `src/schemas/order.schema.ts`
- `src/repositories/OrderRepository.ts`
- `src/services/OrderService.ts`
- `src/controllers/OrderController.ts`
- `src/routes/orderRoutes.ts`

Quer que eu:
- gere exemplos de requests curl para cada endpoint, ou
- adicione documentação Swagger/OpenAPI automática baseada nos schemas?