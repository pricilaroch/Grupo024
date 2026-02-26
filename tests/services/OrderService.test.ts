import { OrderService } from '../../src/services/OrderService';
import { IOrderRepository, OrderData, OrderItemData, CreateOrderDTO, UpdateOrderDTO } from '../../src/models/Order';
import { IProductRepository, ProductData, PublicProduct, ProductDTO } from '../../src/models/Product';
import { IClientRepository, ClientData, CreateClientDTO, UpdateClientDTO } from '../../src/models/Client';
import { NotFoundError, ValidationError } from '../../src/errors/AppError';

// -----------  Mocks  -----------

function createMockOrderRepo(): jest.Mocked<IOrderRepository> {
  return {
    create: jest.fn(),
    findById: jest.fn(),
    findByUserId: jest.fn(),
    findByUserIdAndStatus: jest.fn(),
    update: jest.fn(),
    replaceItems: jest.fn(),
    updateStatus: jest.fn(),
    updatePaymentStatus: jest.fn(),
    delete: jest.fn(),
    findItemsByOrderId: jest.fn(),
  };
}

function createMockProductRepo(): jest.Mocked<IProductRepository> {
  return {
    create: jest.fn(),
    findById: jest.fn(),
    findByUserId: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
}

function createMockClientRepo(): jest.Mocked<IClientRepository> {
  return {
    create: jest.fn(),
    findById: jest.fn(),
    findByUserId: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
}

// -----------  Helpers  -----------

function makeProduct(overrides: Partial<ProductData> = {}): ProductData {
  return {
    id: 1,
    user_id: 1,
    nome: 'Bolo de Chocolate',
    preco_venda: 50.0,
    preco_custo: 20.0,
    ativo: true,
    quantidade_estoque: 10,
    created_at: '2026-02-25',
    updated_at: '2026-02-25',
    ...overrides,
  };
}

function makeClient(overrides: Partial<ClientData> = {}): ClientData {
  return {
    id: 1,
    user_id: 1,
    nome: 'João',
    telefone: '34999999999',
    endereco: 'Rua A, 123',
    created_at: '2026-02-25',
    updated_at: '2026-02-25',
    ...overrides,
  };
}

function makeOrderDTO(overrides: Partial<CreateOrderDTO> = {}): CreateOrderDTO {
  return {
    client_id: 1,
    tipo_entrega: 'retirada',
    taxa_entrega: 0,
    desconto: 0,
    items: [
      { product_id: 1, quantidade: 2 },
      { product_id: 2, quantidade: 3 },
    ],
    ...overrides,
  };
}

function makeOrder(overrides: Partial<OrderData> = {}): OrderData {
  return {
    id: 1,
    user_id: 1,
    client_id: 1,
    status: 'pendente',
    status_pagamento: 'pendente',
    tipo_entrega: 'retirada',
    taxa_entrega: 0,
    valor_subtotal: 250,
    desconto: 0,
    valor_total: 250,
    valor_lucro_total: 130,
    created_at: '2026-02-25',
    updated_at: '2026-02-25',
    items: [],
    ...overrides,
  };
}

// =============================================
//  Tests
// =============================================

describe('OrderService', () => {
  let service: OrderService;
  let orderRepo: jest.Mocked<IOrderRepository>;
  let productRepo: jest.Mocked<IProductRepository>;
  let clientRepo: jest.Mocked<IClientRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    orderRepo = createMockOrderRepo();
    productRepo = createMockProductRepo();
    clientRepo = createMockClientRepo();
    service = new OrderService(orderRepo, productRepo, clientRepo);
  });

  // ==========================================================
  //  createOrder — Cálculos financeiros
  // ==========================================================

  describe('createOrder — cálculos financeiros', () => {
    beforeEach(() => {
      // Cenário padrão: 2 produtos pertencentes ao user_id=1
      clientRepo.findById.mockResolvedValue(makeClient({ id: 1, user_id: 1 }));

      productRepo.findById.mockImplementation(async (id: number) => {
        if (id === 1) return makeProduct({ id: 1, preco_venda: 50, preco_custo: 20 });
        if (id === 2) return makeProduct({ id: 2, preco_venda: 30, preco_custo: 10 });
        return null;
      });

      orderRepo.create.mockImplementation(async (order, items) => ({
        ...order,
        id: 1,
        items,
      }));
    });

    it('deve calcular subtotal corretamente (soma de preço × quantidade)', async () => {
      // Prod 1: 50 × 2 = 100 | Prod 2: 30 × 3 = 90 => subtotal = 190
      const dto = makeOrderDTO({ taxa_entrega: 0, desconto: 0 });
      const result = await service.createOrder(dto, 1);

      expect(result.valor_subtotal).toBe(190);
    });

    it('deve calcular valor_total = (subtotal + taxa) - desconto', async () => {
      const dto = makeOrderDTO({ taxa_entrega: 15, desconto: 5 });
      // subtotal = 190, total = (190 + 15) - 5 = 200
      const result = await service.createOrder(dto, 1);

      expect(result.valor_total).toBe(200);
    });

    it('deve calcular lucro = (subtotal - custo_total) - desconto', async () => {
      // custo: (20×2)+(10×3) = 40+30 = 70
      // lucro = (190 - 70) - 5 = 115
      const dto = makeOrderDTO({ desconto: 5 });
      const result = await service.createOrder(dto, 1);

      expect(result.valor_lucro_total).toBe(115);
    });

    it('deve aplicar taxa_entrega e desconto combinados', async () => {
      const dto = makeOrderDTO({ taxa_entrega: 20, desconto: 10 });
      // subtotal = 190, total = (190+20)-10 = 200, lucro = (190-70)-10 = 110
      const result = await service.createOrder(dto, 1);

      expect(result.valor_subtotal).toBe(190);
      expect(result.valor_total).toBe(200);
      expect(result.valor_lucro_total).toBe(110);
    });

    it('deve retornar valor_total mínimo de 0 (não negativo)', async () => {
      // Não deve acontecer na prática (validação impede), mas Math.max garante
      const dto = makeOrderDTO({
        taxa_entrega: 0,
        desconto: 0,
        items: [{ product_id: 1, quantidade: 1 }],
      });
      // subtotal = 50, total = 50
      const result = await service.createOrder(dto, 1);

      expect(result.valor_total).toBeGreaterThanOrEqual(0);
    });
  });

  // ==========================================================
  //  createOrder — Snapshot de preços
  // ==========================================================

  describe('createOrder — snapshot de preços', () => {
    it('deve salvar snapshot com preco_venda e preco_custo no momento da criação', async () => {
      clientRepo.findById.mockResolvedValue(makeClient());
      productRepo.findById.mockResolvedValue(makeProduct({ preco_venda: 99.90, preco_custo: 45.50 }));

      orderRepo.create.mockImplementation(async (order, items) => ({
        ...order,
        id: 1,
        items,
      }));

      const dto = makeOrderDTO({ items: [{ product_id: 1, quantidade: 1 }] });
      const result = await service.createOrder(dto, 1);

      expect(result.items![0].preco_venda_unitario).toBe(99.90);
      expect(result.items![0].preco_custo_unitario).toBe(45.50);
    });

    it('deve usar preco_custo = 0 se o produto não tiver custo definido', async () => {
      clientRepo.findById.mockResolvedValue(makeClient());
      productRepo.findById.mockResolvedValue(makeProduct({ preco_venda: 30, preco_custo: undefined }));

      orderRepo.create.mockImplementation(async (order, items) => ({
        ...order,
        id: 1,
        items,
      }));

      const dto = makeOrderDTO({ items: [{ product_id: 1, quantidade: 2 }] });
      const result = await service.createOrder(dto, 1);

      expect(result.items![0].preco_custo_unitario).toBe(0);
      // lucro = (60 - 0) - 0 = 60
      expect(result.valor_lucro_total).toBe(60);
    });
  });

  // ==========================================================
  //  createOrder — Validação de desconto
  // ==========================================================

  describe('createOrder — desconto', () => {
    it('deve lançar ValidationError se desconto > subtotal + taxa', async () => {
      clientRepo.findById.mockResolvedValue(makeClient());
      productRepo.findById.mockResolvedValue(makeProduct({ preco_venda: 10, preco_custo: 5 }));

      const dto = makeOrderDTO({
        items: [{ product_id: 1, quantidade: 1 }],
        taxa_entrega: 0,
        desconto: 999, // 999 > 10
      });

      await expect(service.createOrder(dto, 1)).rejects.toThrow(ValidationError);
      await expect(service.createOrder(dto, 1)).rejects.toThrow(
        'O desconto não pode ser maior que o valor total da encomenda.'
      );
      expect(orderRepo.create).not.toHaveBeenCalled();
    });

    it('deve aceitar desconto igual ao subtotal + taxa (total = 0)', async () => {
      clientRepo.findById.mockResolvedValue(makeClient());
      productRepo.findById.mockResolvedValue(makeProduct({ preco_venda: 50, preco_custo: 20 }));

      orderRepo.create.mockImplementation(async (order, items) => ({
        ...order,
        id: 1,
        items,
      }));

      const dto = makeOrderDTO({
        items: [{ product_id: 1, quantidade: 2 }],
        taxa_entrega: 0,
        desconto: 100, // subtotal = 100, desconto = 100
      });

      const result = await service.createOrder(dto, 1);

      expect(result.valor_total).toBe(0);
    });
  });

  // ==========================================================
  //  createOrder — Rollback (simulação de falha)
  // ==========================================================

  describe('createOrder — rollback em caso de falha', () => {
    it('deve propagar erro quando o repositório falha na criação (transação abortada)', async () => {
      clientRepo.findById.mockResolvedValue(makeClient());
      productRepo.findById.mockResolvedValue(makeProduct());

      orderRepo.create.mockRejectedValue(new Error('Falha no banco de dados'));

      await expect(service.createOrder(makeOrderDTO(), 1)).rejects.toThrow('Falha no banco de dados');
    });
  });

  // ==========================================================
  //  createOrder — Multi-tenancy (segurança)
  // ==========================================================

  describe('createOrder — multi-tenancy', () => {
    it('deve lançar NotFoundError se o cliente pertence a outro usuário', async () => {
      clientRepo.findById.mockResolvedValue(makeClient({ user_id: 99 }));

      await expect(service.createOrder(makeOrderDTO(), 1)).rejects.toThrow(NotFoundError);
      await expect(service.createOrder(makeOrderDTO(), 1)).rejects.toThrow(
        'Cliente não encontrado ou não pertence ao usuário.'
      );
      expect(orderRepo.create).not.toHaveBeenCalled();
    });

    it('deve lançar NotFoundError se o cliente não existe', async () => {
      clientRepo.findById.mockResolvedValue(null);

      await expect(service.createOrder(makeOrderDTO(), 1)).rejects.toThrow(NotFoundError);
      expect(orderRepo.create).not.toHaveBeenCalled();
    });

    it('deve lançar NotFoundError se um produto pertence a outro usuário', async () => {
      clientRepo.findById.mockResolvedValue(makeClient());
      productRepo.findById.mockResolvedValue(makeProduct({ user_id: 99 }));

      await expect(service.createOrder(makeOrderDTO(), 1)).rejects.toThrow(NotFoundError);
      expect(orderRepo.create).not.toHaveBeenCalled();
    });

    it('deve lançar NotFoundError se um produto não existe', async () => {
      clientRepo.findById.mockResolvedValue(makeClient());
      productRepo.findById.mockResolvedValue(null);

      await expect(service.createOrder(makeOrderDTO(), 1)).rejects.toThrow(NotFoundError);
    });

    it('deve lançar ValidationError se um produto está inativo', async () => {
      clientRepo.findById.mockResolvedValue(makeClient());
      productRepo.findById.mockResolvedValue(makeProduct({ ativo: false }));

      await expect(service.createOrder(makeOrderDTO(), 1)).rejects.toThrow(ValidationError);
    });
  });

  // ==========================================================
  //  getOrderById
  // ==========================================================

  describe('getOrderById', () => {
    it('deve retornar o pedido quando pertence ao usuário', async () => {
      const order = makeOrder({ id: 10, user_id: 1 });
      orderRepo.findById.mockResolvedValue(order);

      const result = await service.getOrderById(10, 1);

      expect(result).toEqual(order);
    });

    it('deve retornar null quando o pedido pertence a outro usuário', async () => {
      orderRepo.findById.mockResolvedValue(makeOrder({ user_id: 99 }));

      const result = await service.getOrderById(1, 1);

      expect(result).toBeNull();
    });

    it('deve retornar null quando o pedido não existe', async () => {
      orderRepo.findById.mockResolvedValue(null);

      const result = await service.getOrderById(999, 1);

      expect(result).toBeNull();
    });
  });

  // ==========================================================
  //  getOrdersByUserId
  // ==========================================================

  describe('getOrdersByUserId', () => {
    it('deve retornar lista de encomendas do usuário', async () => {
      const orders = [makeOrder({ id: 1 }), makeOrder({ id: 2 })];
      orderRepo.findByUserId.mockResolvedValue(orders);

      const result = await service.getOrdersByUserId(1);

      expect(result).toHaveLength(2);
    });
  });

  // ==========================================================
  //  updateOrder
  // ==========================================================

  describe('updateOrder', () => {
    it('deve atualizar um pedido do próprio usuário', async () => {
      const existing = makeOrder({ id: 5, user_id: 1 });
      const updated = makeOrder({ id: 5, status: 'em_producao' });
      orderRepo.findById.mockResolvedValue(existing);
      orderRepo.update.mockResolvedValue(updated);

      const result = await service.updateOrder(5, { status: 'em_producao' }, 1);

      expect(result?.status).toBe('em_producao');
    });

    it('deve retornar null quando o pedido pertence a outro usuário', async () => {
      orderRepo.findById.mockResolvedValue(makeOrder({ user_id: 99 }));

      const result = await service.updateOrder(1, { status: 'pronto' }, 1);

      expect(result).toBeNull();
    });
  });

  // ==========================================================
  //  deleteOrder
  // ==========================================================

  describe('deleteOrder', () => {
    it('deve excluir o pedido do próprio usuário', async () => {
      orderRepo.findById.mockResolvedValue(makeOrder({ id: 5, user_id: 1 }));
      orderRepo.delete.mockResolvedValue(true);

      const result = await service.deleteOrder(5, 1);

      expect(result).toBe(true);
    });

    it('deve retornar false quando o pedido pertence a outro usuário', async () => {
      orderRepo.findById.mockResolvedValue(makeOrder({ user_id: 99 }));

      const result = await service.deleteOrder(1, 1);

      expect(result).toBe(false);
    });
  });

  // ==========================================================
  //  updatePaymentStatus
  // ==========================================================

  describe('updatePaymentStatus', () => {
    it('deve atualizar status_pagamento para "pago"', async () => {
      const existing = makeOrder({ id: 1, user_id: 1, status_pagamento: 'pendente' });
      const updated = { ...existing, status_pagamento: 'pago' };
      orderRepo.findById.mockResolvedValue(existing);
      orderRepo.updatePaymentStatus.mockResolvedValue(updated);

      const result = await service.updatePaymentStatus(1, 'pago', 1);

      expect(result?.status_pagamento).toBe('pago');
      expect(orderRepo.updatePaymentStatus).toHaveBeenCalledWith(1, 'pago');
    });

    it('deve retornar null quando o pedido pertence a outro usuário', async () => {
      orderRepo.findById.mockResolvedValue(makeOrder({ id: 1, user_id: 99 }));

      const result = await service.updatePaymentStatus(1, 'pago', 1);

      expect(result).toBeNull();
      expect(orderRepo.updatePaymentStatus).not.toHaveBeenCalled();
    });

    it('deve retornar null quando o pedido não existe', async () => {
      orderRepo.findById.mockResolvedValue(null);

      const result = await service.updatePaymentStatus(999, 'pago', 1);

      expect(result).toBeNull();
      expect(orderRepo.updatePaymentStatus).not.toHaveBeenCalled();
    });

    it('deve permitir alterar pagamento mesmo em pedido entregue', async () => {
      const existing = makeOrder({ id: 1, user_id: 1, status: 'entregue', status_pagamento: 'pendente' });
      const updated = { ...existing, status_pagamento: 'pago' };
      orderRepo.findById.mockResolvedValue(existing);
      orderRepo.updatePaymentStatus.mockResolvedValue(updated);

      const result = await service.updatePaymentStatus(1, 'pago', 1);

      expect(result?.status_pagamento).toBe('pago');
    });
  });

  // ==========================================================
  //  updateOrder — bloqueio de pedidos finalizados
  // ==========================================================

  describe('updateOrder — bloqueio de status finalizado', () => {
    it('deve bloquear alteração em pedido entregue', async () => {
      orderRepo.findById.mockResolvedValue(makeOrder({ id: 1, user_id: 1, status: 'entregue' }));

      await expect(service.updateOrder(1, { observacoes: 'teste' }, 1)).rejects.toThrow(
        'Pedido finalizado ou cancelado não pode ser alterado.'
      );
    });

    it('deve bloquear alteração em pedido cancelado', async () => {
      orderRepo.findById.mockResolvedValue(makeOrder({ id: 1, user_id: 1, status: 'cancelado' }));

      await expect(service.updateOrder(1, { observacoes: 'teste' }, 1)).rejects.toThrow(
        'Pedido finalizado ou cancelado não pode ser alterado.'
      );
    });
  });
});
