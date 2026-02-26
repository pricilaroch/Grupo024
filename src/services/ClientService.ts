import { ClientData, CreateClientDTO, IClientRepository, IClientService, UpdateClientDTO } from "../models/Client";


export class ClientService implements IClientService {
    private clientRepository: IClientRepository;

    constructor(clientRepository: IClientRepository) {
        this.clientRepository = clientRepository;
    }

    async createClient(client: CreateClientDTO, user_id: number): Promise<ClientData> {

        const telefoneLimpo = client.telefone.replace(/\D/g, '');
        if (telefoneLimpo.length < 10 || telefoneLimpo.length > 11) {
            throw new Error('Telefone inválido');
        }
        
        return await this.clientRepository.create({...client, telefone: telefoneLimpo}, user_id);
    }

    async getClientById(id: number, user_id: number): Promise<ClientData | null> {
        const client = await this.clientRepository.findById(id);
        if (client && client.user_id === user_id) {
            return client;
        }
        
        return null;
    }

    async getClientsByUserId(user_id: number): Promise<ClientData[]> {
        return await this.clientRepository.findByUserId(user_id);
    }

    async updateClient(id: number, client: UpdateClientDTO, user_id: number): Promise<ClientData | null> {
        const existingClient = await this.clientRepository.findById(id);
        if (!existingClient || existingClient.user_id !== user_id) {
            return null;
        }

        let updatedClient: UpdateClientDTO = client;

        if (client.telefone !== undefined && client.telefone !== null) {
            const telefoneLimpo = client.telefone.replace(/\D/g, '');
            if (telefoneLimpo.length < 10 || telefoneLimpo.length > 11) {
                return null; 
            }
            updatedClient = { ...client, telefone: telefoneLimpo };
        }

        return await this.clientRepository.update(id, updatedClient);
    }

    async deleteClient(id: number, user_id: number): Promise<boolean> {
        const existingClient = await this.clientRepository.findById(id);
        if (!existingClient || existingClient.user_id !== user_id) {
            return false;
        }
        return await this.clientRepository.delete(id);
    }
}