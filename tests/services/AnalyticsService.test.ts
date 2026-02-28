import { AnalyticsService } from '../../src/services/AnalyticsService';
import { ISaleRepository, SaleData } from '../../src/models/Sale';
import { IExpenseRepository, ExpenseData, ExpenseSummary } from '../../src/models/Expense';
import { IAnalyticsService } from '../../src/models/Analytics';

// ─── Mocks ───────────────────────────────────────────────

function createMockSaleRepo(): jest.Mocked<ISaleRepository> {
  return {
    create: jest.fn(),
    findById: jest.fn(),
    findByUserId: jest.fn(),
    findByOrderId: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    getFollowUpAvg: jest.fn(),
  };
}

function createMockExpenseRepo(): jest.Mocked<IExpenseRepository> {
  return {
    create: jest.fn(),
    findById: jest.fn(),
    findByUserId: jest.fn(),
    findByStatus: jest.fn(),
    findByDueDateRange: jest.fn(),
    update: jest.fn(),
    updateStatus: jest.fn(),
    delete: jest.fn(),
    getMonthlySummary: jest.fn(),
  };
}

// ─── Helpers ─────────────────────────────────────────────

function makeSale(overrides: Partial<SaleData> = {}): SaleData {
  return {
    id: 1,
    user_id: 1,
    client_id: null,
    order_id: null,
    valor_total: 500,
    valor_lucro: 150,
    forma_pagamento: 'pix',
    data_venda: '2026-02-15T10:00:00.000Z',
    descricao: 'Venda feira',
    created_at: '2026-02-15T10:00:00.000Z',
    updated_at: '2026-02-15T10:00:00.000Z',
    ...overrides,
  };
}

function makeExpense(overrides: Partial<ExpenseData> = {}): ExpenseData {
  return {
    id: 1,
    user_id: 1,
    valor: 100,
    categoria: 'materia_prima',
    descricao: 'Farinha',
    data_emissao: '2026-02-10T00:00:00.000Z',
    data_vencimento: '2026-03-01',
    status: 'pendente',
    created_at: '2026-02-10T00:00:00.000Z',
    updated_at: '2026-02-10T00:00:00.000Z',
    ...overrides,
  };
}

// ═════════════════════════════════════════════════════════
//  UNIT TESTS
// ═════════════════════════════════════════════════════════

describe('AnalyticsService', () => {
  let saleRepo: jest.Mocked<ISaleRepository>;
  let expenseRepo: jest.Mocked<IExpenseRepository>;
  let service: IAnalyticsService;

  beforeEach(() => {
    saleRepo = createMockSaleRepo();
    expenseRepo = createMockExpenseRepo();
    service = new AnalyticsService(saleRepo, expenseRepo);
  });

  // ══════════════════════════════════════════════════════
  //  getMovements
  // ══════════════════════════════════════════════════════

  describe('getMovements', () => {
    it('deve retornar entradas (sales) e saídas (expenses pagas) unificadas', async () => {
      saleRepo.findByUserId.mockResolvedValue([
        makeSale({ id: 1, data_venda: '2026-02-20T10:00:00.000Z' }),
        makeSale({ id: 2, data_venda: '2026-02-10T08:00:00.000Z', valor_total: 200 }),
      ]);
      expenseRepo.findByStatus.mockResolvedValue([
        makeExpense({ id: 10, status: 'pago', data_emissao: '2026-02-15T00:00:00.000Z', valor: 80 }),
      ]);

      const movements = await service.getMovements(1);

      expect(movements).toHaveLength(3);
      // Ordered by date desc: sale#1 (Feb 20), expense#10 (Feb 15), sale#2 (Feb 10)
      expect(movements[0].tipo).toBe('entrada');
      expect(movements[0].origem_id).toBe(1);
      expect(movements[1].tipo).toBe('saida');
      expect(movements[1].origem_id).toBe(10);
      expect(movements[2].tipo).toBe('entrada');
      expect(movements[2].origem_id).toBe(2);
    });

    it('deve retornar lista vazia quando não há vendas nem despesas pagas', async () => {
      saleRepo.findByUserId.mockResolvedValue([]);
      expenseRepo.findByStatus.mockResolvedValue([]);

      const movements = await service.getMovements(1);
      expect(movements).toHaveLength(0);
    });

    it('deve usar descricao da expense ou fallback para categoria', async () => {
      saleRepo.findByUserId.mockResolvedValue([]);
      expenseRepo.findByStatus.mockResolvedValue([
        makeExpense({ id: 5, status: 'pago', descricao: 'Conta de luz' }),
        makeExpense({ id: 6, status: 'pago', descricao: undefined }),
      ]);

      const movements = await service.getMovements(1);
      expect(movements[0].descricao).toBe('Conta de luz');
      expect(movements[1].descricao).toBe('materia_prima');
    });

    it('deve chamar findByStatus com "pago" para expenses', async () => {
      saleRepo.findByUserId.mockResolvedValue([]);
      expenseRepo.findByStatus.mockResolvedValue([]);

      await service.getMovements(1);
      expect(expenseRepo.findByStatus).toHaveBeenCalledWith(1, 'pago');
    });
  });

  // ══════════════════════════════════════════════════════
  //  getBalance
  // ══════════════════════════════════════════════════════

  describe('getBalance', () => {
    it('deve calcular saldo_real = vendas - despesas pagas', async () => {
      saleRepo.findByUserId.mockResolvedValue([
        makeSale({ valor_total: 1000 }),
        makeSale({ id: 2, valor_total: 500 }),
      ]);
      expenseRepo.findByStatus
        .mockResolvedValueOnce([makeExpense({ valor: 300, status: 'pago' })]) // pago
        .mockResolvedValueOnce([makeExpense({ id: 2, valor: 200, status: 'pendente' })]); // pendente

      const balance = await service.getBalance(1);

      expect(balance.total_vendas).toBe(1500);
      expect(balance.despesas_pagas).toBe(300);
      expect(balance.despesas_pendentes).toBe(200);
      expect(balance.saldo_real).toBe(1200);       // 1500 - 300
      expect(balance.saldo_projetado).toBe(1000);  // 1500 - 300 - 200
    });

    it('deve retornar zeros quando não há dados', async () => {
      saleRepo.findByUserId.mockResolvedValue([]);
      expenseRepo.findByStatus
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const balance = await service.getBalance(1);

      expect(balance.total_vendas).toBe(0);
      expect(balance.despesas_pagas).toBe(0);
      expect(balance.despesas_pendentes).toBe(0);
      expect(balance.saldo_real).toBe(0);
      expect(balance.saldo_projetado).toBe(0);
    });

    it('deve retornar saldo negativo quando despesas excedem vendas', async () => {
      saleRepo.findByUserId.mockResolvedValue([makeSale({ valor_total: 100 })]);
      expenseRepo.findByStatus
        .mockResolvedValueOnce([makeExpense({ valor: 500, status: 'pago' })])
        .mockResolvedValueOnce([makeExpense({ id: 2, valor: 200, status: 'pendente' })]);

      const balance = await service.getBalance(1);

      expect(balance.saldo_real).toBe(-400);      // 100 - 500
      expect(balance.saldo_projetado).toBe(-600); // 100 - 500 - 200
    });

    it('deve chamar findByStatus duas vezes: pago e pendente', async () => {
      saleRepo.findByUserId.mockResolvedValue([]);
      expenseRepo.findByStatus
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      await service.getBalance(1);
      expect(expenseRepo.findByStatus).toHaveBeenCalledTimes(2);
      expect(expenseRepo.findByStatus).toHaveBeenNthCalledWith(1, 1, 'pago');
      expect(expenseRepo.findByStatus).toHaveBeenNthCalledWith(2, 1, 'pendente');
    });
  });

  // ══════════════════════════════════════════════════════
  //  getGoalSummary
  // ══════════════════════════════════════════════════════

  describe('getGoalSummary', () => {
    it('deve calcular percentual da meta com vendas do mês corrente', async () => {
      const now = new Date();
      const thisMonth = now.toISOString().slice(0, 7); // e.g. "2026-02"

      saleRepo.findByUserId.mockResolvedValue([
        makeSale({ valor_total: 400, valor_lucro: 120, data_venda: `${thisMonth}-05T10:00:00.000Z` }),
        makeSale({ id: 2, valor_total: 600, valor_lucro: 180, data_venda: `${thisMonth}-15T10:00:00.000Z` }),
        // This one is from last month — should be excluded
        makeSale({ id: 3, valor_total: 999, valor_lucro: 299, data_venda: '2025-01-01T10:00:00.000Z' }),
      ]);

      const result = await service.getGoalSummary(1, 2000);

      expect(result.meta_valor).toBe(2000);
      expect(result.realizado).toBe(1000);         // 400 + 600
      expect(result.percentual).toBe(50);           // (1000/2000)*100
      expect(result.lucro_realizado).toBe(300);     // 120 + 180
      expect(result.caixinha).toBe(30);             // 300 * 0.1
    });

    it('deve retornar 0% quando meta é 0', async () => {
      saleRepo.findByUserId.mockResolvedValue([
        makeSale({ valor_total: 500, data_venda: new Date().toISOString() }),
      ]);

      const result = await service.getGoalSummary(1, 0);

      expect(result.meta_valor).toBe(0);
      expect(result.percentual).toBe(0);
      expect(result.realizado).toBe(500);
    });

    it('deve limitar percentual a 100% quando realizado > meta', async () => {
      const now = new Date();
      const thisMonth = now.toISOString().slice(0, 7);

      saleRepo.findByUserId.mockResolvedValue([
        makeSale({ valor_total: 2000, valor_lucro: 600, data_venda: `${thisMonth}-10T10:00:00.000Z` }),
      ]);

      const result = await service.getGoalSummary(1, 1000);

      expect(result.percentual).toBe(100);
      expect(result.realizado).toBe(2000);
    });

    it('deve retornar realizado 0 quando não há vendas no mês', async () => {
      saleRepo.findByUserId.mockResolvedValue([
        makeSale({ valor_total: 500, data_venda: '2024-06-01T10:00:00.000Z' }),
      ]);

      const result = await service.getGoalSummary(1, 1000);

      expect(result.realizado).toBe(0);
      expect(result.percentual).toBe(0);
      expect(result.caixinha).toBe(0);
    });
  });
});
