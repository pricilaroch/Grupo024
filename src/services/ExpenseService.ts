import {
    CreateExpenseDTO,
    UpdateExpenseDTO,
    IExpenseRepository,
    IExpenseService,
    ExpenseData,
    ExpenseSummary,
} from "../models/Expense";
import { NotFoundError, ValidationError } from "../errors/AppError";

export class ExpenseService implements IExpenseService {
    private expenseRepository: IExpenseRepository;

    constructor(expenseRepository: IExpenseRepository) {
        this.expenseRepository = expenseRepository;
    }

    /**
     * Cria uma despesa (compromisso). Nasce como "pendente".
     * Se data_vencimento é futura → planejamento; passada e pendente → dívida atrasada.
     */
    async createExpense(dto: CreateExpenseDTO, user_id: number): Promise<ExpenseData> {
        const expenseData: ExpenseData = {
            user_id,
            valor: dto.valor,
            categoria: dto.categoria,
            descricao: dto.descricao,
            data_emissao: dto.data_emissao || new Date().toISOString(),
            data_vencimento: dto.data_vencimento,
            status: 'pendente',
        };

        return await this.expenseRepository.create(expenseData);
    }

    async getExpensesByUserId(user_id: number): Promise<ExpenseData[]> {
        return await this.expenseRepository.findByUserId(user_id);
    }

    async getExpensesByStatus(user_id: number, status: string): Promise<ExpenseData[]> {
        if (status !== 'pendente' && status !== 'pago') {
            throw new ValidationError('Status inválido. Use: pendente ou pago.');
        }
        return await this.expenseRepository.findByStatus(user_id, status);
    }

    /**
     * Dá baixa na despesa: transição pendente → pago.
     */
    async payExpense(id: number, user_id: number): Promise<ExpenseData> {
        const expense = await this.expenseRepository.findById(id);
        if (!expense || expense.user_id !== user_id) {
            throw new NotFoundError('Despesa não encontrada ou não pertence ao usuário.');
        }

        if (expense.status === 'pago') {
            throw new ValidationError('Esta despesa já foi paga.');
        }

        const updated = await this.expenseRepository.updateStatus(id, 'pago');
        if (!updated) {
            throw new NotFoundError('Erro ao atualizar status da despesa.');
        }
        return updated;
    }

    async updateExpense(id: number, dto: UpdateExpenseDTO, user_id: number): Promise<ExpenseData> {
        const expense = await this.expenseRepository.findById(id);
        if (!expense || expense.user_id !== user_id) {
            throw new NotFoundError('Despesa não encontrada ou não pertence ao usuário.');
        }

        const updated = await this.expenseRepository.update(id, dto as Partial<ExpenseData>);
        if (!updated) {
            throw new NotFoundError('Erro ao atualizar despesa.');
        }
        return updated;
    }

    async deleteExpense(id: number, user_id: number): Promise<boolean> {
        const expense = await this.expenseRepository.findById(id);
        if (!expense || expense.user_id !== user_id) {
            return false;
        }
        return await this.expenseRepository.delete(id);
    }

    async getMonthlySummary(user_id: number): Promise<ExpenseSummary[]> {
        return await this.expenseRepository.getMonthlySummary(user_id);
    }
}
