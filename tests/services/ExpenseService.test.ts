import { ExpenseService } from '../../src/services/ExpenseService';
import { IExpenseRepository, IExpenseService, ExpenseData, CreateExpenseDTO, UpdateExpenseDTO, ExpenseSummary } from '../../src/models/Expense';
import { NotFoundError, ValidationError } from '../../src/errors/AppError';

// ─── Mocks ───────────────────────────────────────────────

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

function makeExpense(overrides: Partial<ExpenseData> = {}): ExpenseData {
  return {
    id: 1,
    user_id: 1,
    valor: 150,
    categoria: 'materia_prima',
    descricao: 'Farinha de trigo 25kg',
    data_emissao: '2026-02-28T00:00:00.000Z',
    data_vencimento: '2026-03-15',
    status: 'pendente',
    created_at: '2026-02-28T00:00:00.000Z',
    updated_at: '2026-02-28T00:00:00.000Z',
    ...overrides,
  };
}

// ═════════════════════════════════════════════════════════
//  UNIT TESTS
// ═════════════════════════════════════════════════════════

describe('ExpenseService', () => {
  let repo: jest.Mocked<IExpenseRepository>;
  let service: IExpenseService;

  beforeEach(() => {
    repo = createMockExpenseRepo();
    service = new ExpenseService(repo);
  });

  // ── createExpense ──────────────────────────────────────

  describe('createExpense', () => {
    it('deve criar uma despesa com status pendente', async () => {
      const dto: CreateExpenseDTO = {
        valor: 200,
        categoria: 'materia_prima',
        descricao: 'Chocolate em barra',
        data_vencimento: '2026-03-10',
      };

      const created = makeExpense({ id: 1, valor: 200, descricao: 'Chocolate em barra' });
      repo.create.mockResolvedValue(created);

      const result = await service.createExpense(dto, 1);

      expect(repo.create).toHaveBeenCalledTimes(1);
      const arg = repo.create.mock.calls[0][0];
      expect(arg.user_id).toBe(1);
      expect(arg.valor).toBe(200);
      expect(arg.status).toBe('pendente');
      expect(result.id).toBe(1);
    });

    it('deve usar data atual se data_emissao não fornecida', async () => {
      const dto: CreateExpenseDTO = {
        valor: 50,
        categoria: 'embalagem',
      };

      repo.create.mockResolvedValue(makeExpense({ valor: 50, categoria: 'embalagem' }));

      await service.createExpense(dto, 1);

      const arg = repo.create.mock.calls[0][0];
      expect(arg.data_emissao).toBeDefined();
    });
  });

  // ── getExpensesByUserId ────────────────────────────────

  describe('getExpensesByUserId', () => {
    it('deve retornar todas as despesas do usuário', async () => {
      const expenses = [makeExpense({ id: 1 }), makeExpense({ id: 2 })];
      repo.findByUserId.mockResolvedValue(expenses);

      const result = await service.getExpensesByUserId(1);

      expect(repo.findByUserId).toHaveBeenCalledWith(1);
      expect(result).toHaveLength(2);
    });
  });

  // ── getExpensesByStatus ────────────────────────────────

  describe('getExpensesByStatus', () => {
    it('deve filtrar despesas por status pendente', async () => {
      const pending = [makeExpense({ status: 'pendente' })];
      repo.findByStatus.mockResolvedValue(pending);

      const result = await service.getExpensesByStatus(1, 'pendente');

      expect(repo.findByStatus).toHaveBeenCalledWith(1, 'pendente');
      expect(result).toHaveLength(1);
    });

    it('deve filtrar despesas por status pago', async () => {
      repo.findByStatus.mockResolvedValue([makeExpense({ status: 'pago' })]);

      const result = await service.getExpensesByStatus(1, 'pago');

      expect(repo.findByStatus).toHaveBeenCalledWith(1, 'pago');
      expect(result).toHaveLength(1);
    });

    it('deve rejeitar status inválido', async () => {
      await expect(service.getExpensesByStatus(1, 'cancelado'))
        .rejects.toThrow(ValidationError);
    });
  });

  // ── payExpense ─────────────────────────────────────────

  describe('payExpense', () => {
    it('deve dar baixa em despesa pendente → pago', async () => {
      const expense = makeExpense({ id: 5, status: 'pendente' });
      const paid = makeExpense({ id: 5, status: 'pago' });

      repo.findById.mockResolvedValue(expense);
      repo.updateStatus.mockResolvedValue(paid);

      const result = await service.payExpense(5, 1);

      expect(repo.updateStatus).toHaveBeenCalledWith(5, 'pago');
      expect(result.status).toBe('pago');
    });

    it('deve rejeitar se despesa não encontrada', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.payExpense(99, 1))
        .rejects.toThrow(NotFoundError);
    });

    it('deve rejeitar se despesa pertence a outro usuário', async () => {
      repo.findById.mockResolvedValue(makeExpense({ user_id: 2 }));

      await expect(service.payExpense(1, 1))
        .rejects.toThrow(NotFoundError);
    });

    it('deve rejeitar se despesa já está paga', async () => {
      repo.findById.mockResolvedValue(makeExpense({ status: 'pago' }));

      await expect(service.payExpense(1, 1))
        .rejects.toThrow(ValidationError);
    });
  });

  // ── updateExpense ──────────────────────────────────────

  describe('updateExpense', () => {
    it('deve atualizar campos da despesa', async () => {
      const expense = makeExpense({ id: 3 });
      const updated = makeExpense({ id: 3, valor: 300 });

      repo.findById.mockResolvedValue(expense);
      repo.update.mockResolvedValue(updated);

      const result = await service.updateExpense(3, { valor: 300 }, 1);

      expect(repo.update).toHaveBeenCalledWith(3, { valor: 300 });
      expect(result.valor).toBe(300);
    });

    it('deve rejeitar se despesa não encontrada', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.updateExpense(99, { valor: 100 }, 1))
        .rejects.toThrow(NotFoundError);
    });

    it('deve rejeitar se despesa pertence a outro usuário', async () => {
      repo.findById.mockResolvedValue(makeExpense({ user_id: 2 }));

      await expect(service.updateExpense(1, { valor: 100 }, 1))
        .rejects.toThrow(NotFoundError);
    });
  });

  // ── deleteExpense ──────────────────────────────────────

  describe('deleteExpense', () => {
    it('deve excluir despesa com sucesso', async () => {
      repo.findById.mockResolvedValue(makeExpense({ id: 4 }));
      repo.delete.mockResolvedValue(true);

      const result = await service.deleteExpense(4, 1);

      expect(repo.delete).toHaveBeenCalledWith(4);
      expect(result).toBe(true);
    });

    it('deve retornar false se despesa não encontrada', async () => {
      repo.findById.mockResolvedValue(null);

      const result = await service.deleteExpense(99, 1);

      expect(result).toBe(false);
    });

    it('deve retornar false se pertence a outro usuário', async () => {
      repo.findById.mockResolvedValue(makeExpense({ user_id: 2 }));

      const result = await service.deleteExpense(1, 1);

      expect(result).toBe(false);
    });
  });

  // ── getMonthlySummary ──────────────────────────────────

  describe('getMonthlySummary', () => {
    it('deve retornar resumo mensal agrupado', async () => {
      const summary: ExpenseSummary[] = [
        { month: '2026-02', total: 500, count: 3, by_category: { materia_prima: 300, embalagem: 200 } },
        { month: '2026-01', total: 400, count: 2, by_category: { aluguel: 400 } },
      ];
      repo.getMonthlySummary.mockResolvedValue(summary);

      const result = await service.getMonthlySummary(1);

      expect(repo.getMonthlySummary).toHaveBeenCalledWith(1);
      expect(result).toHaveLength(2);
      expect(result[0].total).toBe(500);
    });
  });
});
