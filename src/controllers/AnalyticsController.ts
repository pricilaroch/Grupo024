import { FastifyRequest, FastifyReply } from "fastify";
import { IAnalyticsController, IAnalyticsService } from "../models/Analytics";

export class AnalyticsController implements IAnalyticsController {
    private analyticsService: IAnalyticsService;

    constructor(analyticsService: IAnalyticsService) {
        this.analyticsService = analyticsService;
    }

    async movements(request: FastifyRequest, reply: FastifyReply): Promise<void> {
        const user_id = request.user.id;
        const data = await this.analyticsService.getMovements(user_id);
        reply.status(200).send(data);
    }

    async balance(request: FastifyRequest, reply: FastifyReply): Promise<void> {
        const user_id = request.user.id;
        const data = await this.analyticsService.getBalance(user_id);
        reply.status(200).send(data);
    }

    async goalSummary(request: FastifyRequest, reply: FastifyReply): Promise<void> {
        const user_id = request.user.id;
        const { meta } = request.query as { meta?: string };
        const metaValor = meta ? parseFloat(meta) : 0;

        if (isNaN(metaValor) || metaValor < 0) {
            reply.status(400).send({ error: 'Parâmetro "meta" inválido.' });
            return;
        }

        const data = await this.analyticsService.getGoalSummary(user_id, metaValor);
        reply.status(200).send(data);
    }
}
