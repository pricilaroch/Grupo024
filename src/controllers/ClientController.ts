import { FastifyRequest, FastifyReply } from "fastify";
import { CreateClientDTO, IClientController, IClientService } from "../models/Client";
import { clientSchema, updateClientSchema } from "../schemas/client.schema";

export class ClientController implements IClientController {
    private clientService: IClientService;

    constructor(clientService: IClientService) {
        this.clientService = clientService;
    }

    async create(request: FastifyRequest, reply: FastifyReply): Promise<void> {
        const user_id = request.user.id;
        const clientDTO: CreateClientDTO = clientSchema.parse(request.body);
        
        const client = await this.clientService.createClient(clientDTO, user_id);

        if (!client) {
            reply.status(400).send({ error: 'Erro ao criar cliente' });
            return;
        }

        reply.status(201).send(client);
    }

    async getById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply): Promise<void> {
        const user_id = request.user.id;
        const id = Number(request.params.id);
        if (isNaN(id)) {
            reply.status(400).send({ error: 'ID inválido' });
            return;
        }
        const client = await this.clientService.getClientById(id, user_id);
        if (!client) {
            reply.status(404).send({ error: 'Cliente não encontrado ou acesso negado.' });
            return;
        }
        reply.status(200).send(client);
    }

    async getByUserId(request: FastifyRequest, reply: FastifyReply): Promise<void> {
        const user_id = request.user.id;
        const clients = await this.clientService.getClientsByUserId(user_id);
        reply.status(200).send(clients);
    }

    async update(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply): Promise<void> {
        const user_id = request.user.id;
        const id = Number(request.params.id);
        if (isNaN(id)) {
            reply.status(400).send({ error: 'ID inválido' });
            return;
        }
        const clientDTO = updateClientSchema.parse(request.body);
        if (!clientDTO || Object.keys(clientDTO).length === 0) {
            reply.status(400).send({ error: 'Nenhum campo para atualizar' });
            return;
        }
        const updatedClient = await this.clientService.updateClient(id, clientDTO, user_id);
        if (!updatedClient) {
            reply.status(404).send({ error: 'Cliente não encontrado ou acesso negado.' });
            return;
        }
        reply.status(200).send(updatedClient);
    }

    async delete(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply): Promise<void> {
        const user_id = request.user.id;
        const id = Number(request.params.id);
        if (isNaN(id)) {
            reply.status(400).send({ error: 'ID inválido' });
            return;
        }
        const success = await this.clientService.deleteClient(id, user_id);
        if (!success) {
            reply.status(404).send({ error: 'Cliente não encontrado ou acesso negado.' });
            return;
        }
        reply.status(204).send();
    }   
}