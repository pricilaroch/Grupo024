import { ClientService } from '../../src/services/ClientService';
import { ClientData, CreateClientDTO, IClientRepository, UpdateClientDTO } from '../../src/models/Client';

// -----------  Mock do ClientRepository  -----------

function createMockRepo(): jest.Mocked<IClientRepository> {
  return {
    create: jest.fn(),
    findById: jest.fn(),
    findByUserId: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
}

// -----------  Helpers  -----------

function makeClientDTO(overrides: Partial<CreateClientDTO> = {}): CreateClientDTO {
  return {
    nome: 'João da Silva',
    telefone: '(34) 99999-9999',
    email: 'joao@example.com',
    endereco: 'Rua A, 123, Bairro B',
    ...overrides,
  };
}

function makeClient(overrides: Partial<ClientData> = {}): ClientData {
  return {
    id: 1,
    user_id: 1,
    nome: 'João da Silva',
    telefone: '34999999999',
    email: 'joao@example.com',
    endereco: 'Rua A, 123, Bairro B',
    created_at: '2026-02-25 12:00:00',
    updated_at: '2026-02-25 12:00:00',
    ...overrides,
  };
}

// =============================================
//  Tests
// =============================================

describe('ClientService', () => {
  let service: ClientService;
  let repo: jest.Mocked<IClientRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = createMockRepo();
    service = new ClientService(repo);
  });

  // ----------- createClient -----------

  describe('createClient', () => {
    it('deve sanitizar o telefone e criar o cliente', async () => {
      repo.create.mockResolvedValue(makeClient());

      const dto = makeClientDTO({ telefone: '(34) 99999-9999' });
      await service.createClient(dto, 1);

      // Deve ter chamado create com telefone limpo (apenas dígitos)
      expect(repo.create).toHaveBeenCalledTimes(1);
      const savedDTO = repo.create.mock.calls[0][0];
      expect(savedDTO.telefone).toBe('34999999999');
    });

    it('deve aceitar telefone já sanitizado (11 dígitos)', async () => {
      repo.create.mockResolvedValue(makeClient());

      await service.createClient(makeClientDTO({ telefone: '34999999999' }), 1);

      const savedDTO = repo.create.mock.calls[0][0];
      expect(savedDTO.telefone).toBe('34999999999');
    });

    it('deve aceitar telefone fixo (10 dígitos)', async () => {
      repo.create.mockResolvedValue(makeClient({ telefone: '3433221100' }));

      await service.createClient(makeClientDTO({ telefone: '(34) 3322-1100' }), 1);

      const savedDTO = repo.create.mock.calls[0][0];
      expect(savedDTO.telefone).toBe('3433221100');
    });

    it('deve lançar erro para telefone muito curto', async () => {
      await expect(
        service.createClient(makeClientDTO({ telefone: '1234' }), 1)
      ).rejects.toThrow('Telefone inválido');

      expect(repo.create).not.toHaveBeenCalled();
    });

    it('deve lançar erro para telefone muito longo', async () => {
      await expect(
        service.createClient(makeClientDTO({ telefone: '123456789012' }), 1)
      ).rejects.toThrow('Telefone inválido');

      expect(repo.create).not.toHaveBeenCalled();
    });
  });

  // ----------- getClientById -----------

  describe('getClientById', () => {
    it('deve retornar o cliente quando pertence ao usuário', async () => {
      const client = makeClient({ id: 5, user_id: 1 });
      repo.findById.mockResolvedValue(client);

      const result = await service.getClientById(5, 1);

      expect(result).toEqual(client);
    });

    it('deve retornar null quando o cliente pertence a outro usuário', async () => {
      repo.findById.mockResolvedValue(makeClient({ user_id: 99 }));

      const result = await service.getClientById(1, 1);

      expect(result).toBeNull();
    });

    it('deve retornar null quando o cliente não existe', async () => {
      repo.findById.mockResolvedValue(null);

      const result = await service.getClientById(999, 1);

      expect(result).toBeNull();
    });
  });

  // ----------- getClientsByUserId -----------

  describe('getClientsByUserId', () => {
    it('deve retornar lista de clientes do usuário', async () => {
      const clients = [makeClient({ id: 1 }), makeClient({ id: 2, nome: 'Maria' })];
      repo.findByUserId.mockResolvedValue(clients);

      const result = await service.getClientsByUserId(1);

      expect(repo.findByUserId).toHaveBeenCalledWith(1);
      expect(result).toHaveLength(2);
    });

    it('deve retornar lista vazia quando não há clientes', async () => {
      repo.findByUserId.mockResolvedValue([]);

      const result = await service.getClientsByUserId(1);

      expect(result).toEqual([]);
    });
  });

  // ----------- updateClient -----------

  describe('updateClient', () => {
    it('deve atualizar o cliente do próprio usuário', async () => {
      const existing = makeClient({ id: 3, user_id: 1 });
      const updated = makeClient({ id: 3, user_id: 1, nome: 'Nome Atualizado' });
      repo.findById.mockResolvedValue(existing);
      repo.update.mockResolvedValue(updated);

      const result = await service.updateClient(3, { nome: 'Nome Atualizado' }, 1);

      expect(repo.update).toHaveBeenCalled();
      expect(result?.nome).toBe('Nome Atualizado');
    });

    it('deve sanitizar o telefone ao atualizar', async () => {
      const existing = makeClient({ id: 3, user_id: 1 });
      repo.findById.mockResolvedValue(existing);
      repo.update.mockResolvedValue(makeClient({ telefone: '34888887777' }));

      await service.updateClient(3, { telefone: '(34) 88888-7777' }, 1);

      const savedDTO = repo.update.mock.calls[0][1];
      expect(savedDTO.telefone).toBe('34888887777');
    });

    it('deve retornar null para telefone inválido na atualização', async () => {
      repo.findById.mockResolvedValue(makeClient({ id: 3, user_id: 1 }));

      const result = await service.updateClient(3, { telefone: '123' }, 1);

      expect(repo.update).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('deve retornar null quando o cliente pertence a outro usuário', async () => {
      repo.findById.mockResolvedValue(makeClient({ user_id: 99 }));

      const result = await service.updateClient(1, { nome: 'X' }, 1);

      expect(repo.update).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  // ----------- deleteClient -----------

  describe('deleteClient', () => {
    it('deve excluir o cliente do próprio usuário', async () => {
      repo.findById.mockResolvedValue(makeClient({ id: 5, user_id: 1 }));
      repo.delete.mockResolvedValue(true);

      const result = await service.deleteClient(5, 1);

      expect(repo.delete).toHaveBeenCalledWith(5);
      expect(result).toBe(true);
    });

    it('deve retornar false quando o cliente pertence a outro usuário', async () => {
      repo.findById.mockResolvedValue(makeClient({ user_id: 99 }));

      const result = await service.deleteClient(1, 1);

      expect(repo.delete).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });
});
