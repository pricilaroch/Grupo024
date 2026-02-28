import { SaleService } from '../../src/services/SaleService';
import { ISaleRepository, ISaleService, SaleData, CreateSaleDTO, UpdateSaleDTO } from '../../src/models/Sale';
import { IOrderRepository, OrderData, OrderItemData, UpdateOrderDTO } from '../../src/models/Order';
import { IClientRepository, ClientData, CreateClientDTO, UpdateClientDTO } from '../../src/models/Client';
import { NotFoundError } from '../../src/errors/AppError';

// ─── Mocks ───────────────────────────────────────────────

function createMockSaleRepo(): jest.Mocked<ISaleRepository> {
  return {
    create: jest.fn(),
    findById: jest.fn(),
    findByUserId: jest.fn(),
    findByOrderId: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
}

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

function createMockClientRepo(): jest.Mocked<IClientRepository> {
  return {
    create: jest.fn(),
    findById: jest.fn(),
    findByUserId: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
}

// ─── Helpers ─────────────────────────────────────────────

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

function makeOrder(overrides: Partial<OrderData> = {}): OrderData {
  return {
    id: 10,
    user_id: 1,
    client_id: 1,
    status: 'entregue',
    status_pagamento: 'pago',
    tipo_entrega: 'retirada',
    taxa_entrega: 0,
    valor_subtotal: 200,
    desconto: 0,
    valor_total: 200,
    valor_lucro_total: 100,
    forma_pagamento: 'pix',
    created_at: '2026-02-25',
    updated_at: '2026-02-25',
    items: [],
    ...overrides,
  };
}

function makeSale(overrides: Partial<SaleData> = {}): SaleData {
  return {
    id: 1,
    user_id: 1,
    client_id: 1,
    order_id: null,
    valor_total: 150,
    valor_lucro: 45,
    forma_pagamento: 'pix',
    data_venda: '2026-02-25T10:00:00.000Z',
    descricao: 'Venda manual',
    created_at: '2026-02-25',
    updated_at: '2026-02-25',
    ...overrides,
  };
}

function makeSaleDTO(overrides: Partial<CreateSaleDTO> = {}): CreateSaleDTO {
  return {
    valor_total: 150,
    forma_pagamento: 'pix',
    descricao: 'Venda rápida',
    ...overrides,
  };
}

// ═════════════════════════════════════════════════════════
//  Tests
// ═════════════════════════════════════════════════════════

describe('SaleService', () => {
  let service: SaleService;
  let saleRepo: jest.Mocked<ISaleRepository>;
  let orderRepo: jest.Mocked<IOrderRepository>;
  let clientRepo: jest.Mocked<IClientRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    saleRepo = createMockSaleRepo();
    orderRepo = createMockOrderRepo();
    clientRepo = createMockClientRepo();
    service = new SaleService(saleRepo, orderRepo, clientRepo);
  });

  // ═══════════════════════════════════════════════════════
  //  createSale — Vendas manuais
  // ═══════════════════════════════════════════════════════

  describe('createSale — vendas manuais', () => {
    it('deve criar uma venda manual básica com lucro informado', async () => {
      const dto = makeSaleDTO({ valor_total: 100, valor_lucro: 40 });
      saleRepo.create.mockImplementation(async (sale) => ({ ...sale, id: 1 }));

      const result = await service.createSale(dto, 1);

      expect(saleRepo.create).toHaveBeenCalledTimes(1);
      expect(result.valor_total).toBe(100);
      expect(result.valor_lucro).toBe(40);
      expect(result.order_id).toBeNull();
      expect(result.user_id).toBe(1);
    });

    it('deve calcular lucro com margem padrão (30%) quando valor_lucro não é informado', async () => {
      const dto = makeSaleDTO({ valor_total: 200 });
      // valor_lucro não definido → 200 * 0.3 = 60
      saleRepo.create.mockImplementation(async (sale) => ({ ...sale, id: 1 }));

      const result = await service.createSale(dto, 1);

      expect(result.valor_lucro).toBe(60);
    });

    it('deve aceitar valor_lucro = 0 explicitamente (sem usar margem padrão)', async () => {
      const dto = makeSaleDTO({ valor_total: 100, valor_lucro: 0 });
      saleRepo.create.mockImplementation(async (sale) => ({ ...sale, id: 1 }));

      const result = await service.createSale(dto, 1);

      expect(result.valor_lucro).toBe(0);
    });

    it('deve validar client_id quando fornecido', async () => {
      const dto = makeSaleDTO({ client_id: 1 });
      clientRepo.findById.mockResolvedValue(makeClient({ id: 1, user_id: 1 }));
      saleRepo.create.mockImplementation(async (sale) => ({ ...sale, id: 1 }));

      const result = await service.createSale(dto, 1);

      expect(clientRepo.findById).toHaveBeenCalledWith(1);
      expect(result.client_id).toBe(1);
    });

    it('deve lançar NotFoundError se client_id não pertence ao usuário', async () => {
      const dto = makeSaleDTO({ client_id: 99 });
      clientRepo.findById.mockResolvedValue(null);

      await expect(service.createSale(dto, 1))
        .rejects.toThrow(NotFoundError);
    });

    it('deve lançar NotFoundError se client_id pertence a outro usuário', async () => {
      const dto = makeSaleDTO({ client_id: 1 });
      clientRepo.findById.mockResolvedValue(makeClient({ id: 1, user_id: 999 }));

      await expect(service.createSale(dto, 1))
        .rejects.toThrow(NotFoundError);
    });

    it('deve criar venda sem client_id (venda anônima)', async () => {
      const dto = makeSaleDTO(); // sem client_id
      saleRepo.create.mockImplementation(async (sale) => ({ ...sale, id: 1 }));

      const result = await service.createSale(dto, 1);

      expect(result.client_id).toBeNull();
      expect(clientRepo.findById).not.toHaveBeenCalled();
    });

    it('deve propagar data_venda e descricao para o repositório', async () => {
      const dto = makeSaleDTO({
        data_venda: '2026-03-01T10:00:00.000Z',
        descricao: 'Venda feira',
      });
      saleRepo.create.mockImplementation(async (sale) => ({ ...sale, id: 1 }));

      const result = await service.createSale(dto, 1);

      expect(result.data_venda).toBe('2026-03-01T10:00:00.000Z');
      expect(result.descricao).toBe('Venda feira');
    });
  });

  // ═══════════════════════════════════════════════════════
  //  createFromOrder — Transposição de encomenda
  // ═══════════════════════════════════════════════════════

  describe('createFromOrder — transposição de encomenda', () => {
    it('deve criar uma sale a partir de uma encomenda existente', async () => {
      const order = makeOrder({ id: 10, valor_total: 300, valor_lucro_total: 150, forma_pagamento: 'pix' });
      orderRepo.findById.mockResolvedValue(order);
      saleRepo.findByOrderId.mockResolvedValue(null);
      saleRepo.create.mockImplementation(async (sale) => ({ ...sale, id: 1 }));

      const result = await service.createFromOrder(10, 1);

      expect(result.order_id).toBe(10);
      expect(result.valor_total).toBe(300);
      expect(result.valor_lucro).toBe(150);
      expect(result.forma_pagamento).toBe('pix');
      expect(result.client_id).toBe(order.client_id);
      expect(result.descricao).toBe('Encomenda #10');
    });

    it('deve transpor valor_lucro_total como valor_lucro', async () => {
      const order = makeOrder({ id: 5, valor_total: 500, valor_lucro_total: 220 });
      orderRepo.findById.mockResolvedValue(order);
      saleRepo.findByOrderId.mockResolvedValue(null);
      saleRepo.create.mockImplementation(async (sale) => ({ ...sale, id: 1 }));

      const result = await service.createFromOrder(5, 1);

      expect(result.valor_lucro).toBe(220);
    });

    it('deve usar 0 quando valor_lucro_total for undefined', async () => {
      const order = makeOrder({ id: 5, valor_lucro_total: undefined });
      orderRepo.findById.mockResolvedValue(order);
      saleRepo.findByOrderId.mockResolvedValue(null);
      saleRepo.create.mockImplementation(async (sale) => ({ ...sale, id: 1 }));

      const result = await service.createFromOrder(5, 1);

      expect(result.valor_lucro).toBe(0);
    });

    it('deve usar "dinheiro" como fallback quando forma_pagamento não definida', async () => {
      const order = makeOrder({ id: 5, forma_pagamento: undefined });
      orderRepo.findById.mockResolvedValue(order);
      saleRepo.findByOrderId.mockResolvedValue(null);
      saleRepo.create.mockImplementation(async (sale) => ({ ...sale, id: 1 }));

      const result = await service.createFromOrder(5, 1);

      expect(result.forma_pagamento).toBe('dinheiro');
    });

    it('não deve duplicar se já existe sale para o mesmo order_id', async () => {
      const existingSale = makeSale({ id: 99, order_id: 10 });
      orderRepo.findById.mockResolvedValue(makeOrder({ id: 10 }));
      saleRepo.findByOrderId.mockResolvedValue(existingSale);

      const result = await service.createFromOrder(10, 1);

      expect(result.id).toBe(99);
      expect(saleRepo.create).not.toHaveBeenCalled();
    });

    it('deve lançar NotFoundError se encomenda não existe', async () => {
      orderRepo.findById.mockResolvedValue(null);

      await expect(service.createFromOrder(999, 1))
        .rejects.toThrow(NotFoundError);
    });

    it('deve lançar NotFoundError se encomenda pertence a outro usuário', async () => {
      orderRepo.findById.mockResolvedValue(makeOrder({ id: 10, user_id: 999 }));

      await expect(service.createFromOrder(10, 1))
        .rejects.toThrow(NotFoundError);
    });
  });

  // ═══════════════════════════════════════════════════════
  //  getSalesByUserId
  // ═══════════════════════════════════════════════════════

  describe('getSalesByUserId', () => {
    it('deve retornar vendas do usuário', async () => {
      const sales = [makeSale({ id: 1 }), makeSale({ id: 2 })];
      saleRepo.findByUserId.mockResolvedValue(sales);

      const result = await service.getSalesByUserId(1);

      expect(result).toHaveLength(2);
      expect(saleRepo.findByUserId).toHaveBeenCalledWith(1);
    });

    it('deve retornar array vazio se não há vendas', async () => {
      saleRepo.findByUserId.mockResolvedValue([]);

      const result = await service.getSalesByUserId(1);

      expect(result).toEqual([]);
    });
  });

  // ═══════════════════════════════════════════════════════
  //  updateSale
  // ═══════════════════════════════════════════════════════

  describe('updateSale', () => {
    it('deve atualizar campos da venda do próprio usuário', async () => {
      const existing = makeSale({ id: 1, user_id: 1, valor_total: 100 });
      saleRepo.findById.mockResolvedValue(existing);
      saleRepo.update.mockResolvedValue({ ...existing, valor_total: 200, descricao: 'Atualizada' });

      const result = await service.updateSale(1, { valor_total: 200, descricao: 'Atualizada' }, 1);

      expect(saleRepo.update).toHaveBeenCalledWith(1, { valor_total: 200, descricao: 'Atualizada' });
      expect(result.valor_total).toBe(200);
      expect(result.descricao).toBe('Atualizada');
    });

    it('deve lançar NotFoundError se a venda não existe', async () => {
      saleRepo.findById.mockResolvedValue(null);

      await expect(service.updateSale(999, { valor_total: 50 }, 1))
        .rejects.toThrow(NotFoundError);
      expect(saleRepo.update).not.toHaveBeenCalled();
    });

    it('deve lançar NotFoundError se a venda pertence a outro usuário', async () => {
      saleRepo.findById.mockResolvedValue(makeSale({ id: 1, user_id: 999 }));

      await expect(service.updateSale(1, { valor_total: 50 }, 1))
        .rejects.toThrow(NotFoundError);
      expect(saleRepo.update).not.toHaveBeenCalled();
    });

    it('deve validar client_id quando fornecido na atualização', async () => {
      const existing = makeSale({ id: 1, user_id: 1 });
      saleRepo.findById.mockResolvedValue(existing);
      clientRepo.findById.mockResolvedValue(makeClient({ id: 2, user_id: 1 }));
      saleRepo.update.mockResolvedValue({ ...existing, client_id: 2 });

      const result = await service.updateSale(1, { client_id: 2 }, 1);

      expect(clientRepo.findById).toHaveBeenCalledWith(2);
      expect(result.client_id).toBe(2);
    });

    it('deve lançar NotFoundError se client_id de outro usuário', async () => {
      saleRepo.findById.mockResolvedValue(makeSale({ id: 1, user_id: 1 }));
      clientRepo.findById.mockResolvedValue(makeClient({ id: 2, user_id: 999 }));

      await expect(service.updateSale(1, { client_id: 2 }, 1))
        .rejects.toThrow(NotFoundError);
    });

    it('deve permitir client_id = null (remover cliente)', async () => {
      const existing = makeSale({ id: 1, user_id: 1, client_id: 1 });
      saleRepo.findById.mockResolvedValue(existing);
      saleRepo.update.mockResolvedValue({ ...existing, client_id: null });

      const result = await service.updateSale(1, { client_id: null }, 1);

      expect(clientRepo.findById).not.toHaveBeenCalled();
      expect(result.client_id).toBeNull();
    });
  });

  // ═══════════════════════════════════════════════════════
  //  deleteSale
  // ═══════════════════════════════════════════════════════

  describe('deleteSale', () => {
    it('deve excluir venda do próprio usuário', async () => {
      saleRepo.findById.mockResolvedValue(makeSale({ id: 1, user_id: 1 }));
      saleRepo.delete.mockResolvedValue(true);

      const result = await service.deleteSale(1, 1);

      expect(result).toBe(true);
      expect(saleRepo.delete).toHaveBeenCalledWith(1);
    });

    it('deve retornar false se a venda não existe', async () => {
      saleRepo.findById.mockResolvedValue(null);

      const result = await service.deleteSale(999, 1);

      expect(result).toBe(false);
      expect(saleRepo.delete).not.toHaveBeenCalled();
    });

    it('deve retornar false se a venda pertence a outro usuário (multi-tenancy)', async () => {
      saleRepo.findById.mockResolvedValue(makeSale({ id: 1, user_id: 999 }));

      const result = await service.deleteSale(1, 1);

      expect(result).toBe(false);
      expect(saleRepo.delete).not.toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════════
  //  Multi-tenancy
  // ═══════════════════════════════════════════════════════

  describe('multi-tenancy', () => {
    it('createSale deve isolar dados por user_id', async () => {
      const dto = makeSaleDTO({ valor_total: 100, valor_lucro: 30 });
      saleRepo.create.mockImplementation(async (sale) => ({ ...sale, id: 1 }));

      const result = await service.createSale(dto, 42);

      expect(result.user_id).toBe(42);
    });

    it('createFromOrder deve rejeitar encomenda de outro usuário', async () => {
      orderRepo.findById.mockResolvedValue(makeOrder({ id: 10, user_id: 2 }));

      await expect(service.createFromOrder(10, 1))
        .rejects.toThrow(NotFoundError);
    });
  });
});

// ═════════════════════════════════════════════════════════
//  Integration: OrderService → SaleService
// ═════════════════════════════════════════════════════════

describe('OrderService → SaleService integration', () => {
  let orderService: any; // use 'any' to access setSaleService
  let orderRepo: jest.Mocked<IOrderRepository>;
  let clientRepo: jest.Mocked<IClientRepository>;
  let saleService: jest.Mocked<ISaleService>;

  // We need the actual OrderService class
  const { OrderService } = require('../../src/services/OrderService');
  const { IProductRepository } = require('../../src/models/Product');

  function createMockProductRepo() {
    return {
      create: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
  }

  function createMockSaleService(): jest.Mocked<ISaleService> {
    return {
      createSale: jest.fn(),
      createFromOrder: jest.fn(),
      getSalesByUserId: jest.fn(),
      updateSale: jest.fn(),
      deleteSale: jest.fn(),
    };
  }

  beforeEach(() => {
    jest.clearAllMocks();
    orderRepo = createMockOrderRepo();
    clientRepo = createMockClientRepo();
    saleService = createMockSaleService();

    const productRepo = createMockProductRepo();
    orderService = new OrderService(orderRepo, productRepo, clientRepo);
    orderService.setSaleService(saleService);
  });

  it('deve chamar createFromOrder quando pagamento é marcado como "pago"', async () => {
    const order = makeOrder({ id: 10, user_id: 1, status_pagamento: 'pendente' });
    orderRepo.findById.mockResolvedValue(order);
    orderRepo.updatePaymentStatus.mockResolvedValue({ ...order, status_pagamento: 'pago' });
    saleService.createFromOrder.mockResolvedValue(makeSale({ order_id: 10 }));

    await orderService.updatePaymentStatus(10, 'pago', 1);

    expect(saleService.createFromOrder).toHaveBeenCalledWith(10, 1);
  });

  it('NÃO deve chamar createFromOrder quando status é "pendente"', async () => {
    const order = makeOrder({ id: 10, user_id: 1, status_pagamento: 'pago' });
    orderRepo.findById.mockResolvedValue(order);
    orderRepo.updatePaymentStatus.mockResolvedValue({ ...order, status_pagamento: 'pendente' });

    await orderService.updatePaymentStatus(10, 'pendente', 1);

    expect(saleService.createFromOrder).not.toHaveBeenCalled();
  });

  it('NÃO deve chamar createFromOrder quando status é "parcial"', async () => {
    const order = makeOrder({ id: 10, user_id: 1, status_pagamento: 'pendente' });
    orderRepo.findById.mockResolvedValue(order);
    orderRepo.updatePaymentStatus.mockResolvedValue({ ...order, status_pagamento: 'parcial' });

    await orderService.updatePaymentStatus(10, 'parcial', 1);

    expect(saleService.createFromOrder).not.toHaveBeenCalled();
  });

  it('deve retornar a order atualizada mesmo se createFromOrder falhar', async () => {
    const order = makeOrder({ id: 10, user_id: 1, status_pagamento: 'pendente' });
    const updatedOrder = { ...order, status_pagamento: 'pago' };
    orderRepo.findById.mockResolvedValue(order);
    orderRepo.updatePaymentStatus.mockResolvedValue(updatedOrder);
    saleService.createFromOrder.mockRejectedValue(new Error('DB error'));

    // Não deve lançar erro
    const result = await orderService.updatePaymentStatus(10, 'pago', 1);

    expect(result).toEqual(updatedOrder);
    expect(saleService.createFromOrder).toHaveBeenCalledWith(10, 1);
  });

  it('deve respeitar multi-tenancy — não registra sale para encomenda de outro user', async () => {
    orderRepo.findById.mockResolvedValue(makeOrder({ id: 10, user_id: 999 }));

    const result = await orderService.updatePaymentStatus(10, 'pago', 1);

    expect(result).toBeNull();
    expect(saleService.createFromOrder).not.toHaveBeenCalled();
  });
});
