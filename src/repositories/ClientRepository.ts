import { ClientData, CreateClientDTO, IClientRepository } from "../models/Client";
import { Database } from 'sqlite';

export class ClientRepository implements IClientRepository {
    private db: Database;
    
    constructor(db: Database) {
        this.db = db;
    }

    async create(client: CreateClientDTO, user_id: number): Promise<ClientData> {
        const result = await this.db.run(
            `INSERT INTO clients (user_id, nome, telefone, email, endereco) VALUES (?, ?, ?, ?, ?)`,
            user_id,
            client.nome,
            client.telefone,
            client.email || null,
            client.endereco
        );

        if (result.lastID === undefined) {
            throw new Error('Erro ao criar cliente');
        }

        const data = await this.findById(result.lastID);

        if (!data) {
            throw new Error('Erro ao criar cliente');
        }

        return data;
    }

    async findById(id: number): Promise<ClientData | null> {
        const client: ClientData | undefined = await this.db.get(
            `SELECT * FROM clients WHERE id = ?`,
            id
        );

        if (!client) {
            return null;
        }

        return {
            id: client.id,
            user_id: client.user_id,
            nome: client.nome,
            telefone: client.telefone,
            email: client.email,
            endereco: client.endereco,
            created_at: client.created_at,
            updated_at: client.updated_at
        };
    }

    async findByUserId(user_id: number): Promise<ClientData[]> {
        const clients: ClientData[] = await this.db.all(
            `SELECT * FROM clients WHERE user_id = ?`,
            user_id
        );

        return clients.map(client => ({
            id: client.id,
            user_id: client.user_id,
            nome: client.nome,
            telefone: client.telefone,
            email: client.email,
            endereco: client.endereco,
            created_at: client.created_at,
            updated_at: client.updated_at
        }));
    }

    async update(id: number, client: CreateClientDTO): Promise<ClientData | null> {
        const result = await this.db.run(
            `UPDATE clients SET nome = ?, telefone = ?, email = ?, endereco = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            client.nome,
            client.telefone,
            client.email || null,
            client.endereco,
            id
        );

        if (result.changes === 0) {
            return null;
        }

        return this.findById(id);
    }

    async delete(id: number): Promise<boolean> {
        const result = await this.db.run(
            `DELETE FROM clients WHERE id = ?`,
            id
        );

        return result.changes ? true : false;
    }
}