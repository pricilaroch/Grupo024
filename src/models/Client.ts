import { FastifyReply, FastifyRequest } from "fastify";

export interface ClientData {
  id?: number;
  user_id: number;
  nome: string;
  telefone: string;
  email?: string;
  endereco: string;
  created_at?: string;
  updated_at?: string;
}

// O que vem do frontend
export interface CreateClientDTO {
  nome: string;
  telefone: string;
  email?: string;
  endereco: string;
}

export type UpdateClientDTO = Partial<CreateClientDTO>;

export interface IClientRepository {
    create(client: CreateClientDTO, user_id: number): Promise<ClientData>;
    findById(id: number): Promise<ClientData | null>;
    findByUserId(user_id: number): Promise<ClientData[]>;
    update(id: number, client: UpdateClientDTO): Promise<ClientData | null>;
    delete(id: number): Promise<boolean>;
}

export interface IClientService {
    createClient(client: CreateClientDTO, user_id: number): Promise<ClientData>;
    getClientById(id: number, user_id: number): Promise<ClientData | null>;
    getClientsByUserId(user_id: number): Promise<ClientData[]>;
    updateClient(id: number, client: UpdateClientDTO, user_id: number): Promise<ClientData | null>;
    deleteClient(id: number, user_id: number): Promise<boolean>;
}

export interface IClientController {
    create(request: FastifyRequest, reply: FastifyReply): Promise<void>;
    getById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply): Promise<void>;
    getByUserId(request: FastifyRequest, reply: FastifyReply): Promise<void>;
    update(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply): Promise<void>;
    delete(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply): Promise<void>;
}