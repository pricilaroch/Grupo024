import { FastifyRequest, FastifyReply } from "fastify";
import { IExpenseController, IExpenseService, CreateExpenseDTO, UpdateExpenseDTO } from "../models/Expense";
import { createExpenseSchema, updateExpenseSchema } from "../schemas/expense.schema";

export class ExpenseController implements IExpenseController {
    private expenseService: IExpenseService;

    constructor(expenseService: IExpenseService) {
        this.expenseService = expenseService;
    }

    async create(request: FastifyRequest, reply: FastifyReply): Promise<void> {
        const user_id = request.user.id;
        const dto: CreateExpenseDTO = createExpenseSchema.parse(request.body);

        const expense = await this.expenseService.createExpense(dto, user_id);
        reply.status(201).send(expense);
    }

    async getByUserId(request: FastifyRequest, reply: FastifyReply): Promise<void> {
        const user_id = request.user.id;
        const { status } = request.query as { status?: string };

        let expenses;
        if (status) {
            expenses = await this.expenseService.getExpensesByStatus(user_id, status);
        } else {
            expenses = await this.expenseService.getExpensesByUserId(user_id);
        }

        reply.status(200).send(expenses);
    }

    async pay(
        request: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply
    ): Promise<void> {
        const user_id = request.user.id;
        const id = Number(request.params.id);
        if (isNaN(id)) {
            reply.status(400).send({ error: 'ID inválido' });
            return;
        }

        const expense = await this.expenseService.payExpense(id, user_id);
        reply.status(200).send(expense);
    }

    async update(
        request: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply
    ): Promise<void> {
        const user_id = request.user.id;
        const id = Number(request.params.id);
        if (isNaN(id)) {
            reply.status(400).send({ error: 'ID inválido' });
            return;
        }

        const dto: UpdateExpenseDTO = updateExpenseSchema.parse(request.body);
        const expense = await this.expenseService.updateExpense(id, dto, user_id);
        reply.status(200).send(expense);
    }

    async delete(
        request: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply
    ): Promise<void> {
        const user_id = request.user.id;
        const id = Number(request.params.id);
        if (isNaN(id)) {
            reply.status(400).send({ error: 'ID inválido' });
            return;
        }

        const deleted = await this.expenseService.deleteExpense(id, user_id);
        if (!deleted) {
            reply.status(404).send({ error: 'Despesa não encontrada ou acesso negado.' });
            return;
        }
        reply.status(204).send();
    }

    async summary(request: FastifyRequest, reply: FastifyReply): Promise<void> {
        const user_id = request.user.id;
        const data = await this.expenseService.getMonthlySummary(user_id);
        reply.status(200).send(data);
    }
}
