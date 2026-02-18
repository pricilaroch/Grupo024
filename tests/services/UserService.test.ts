import bcrypt from 'bcrypt';
import { UserService, RegisterDTO } from '../../src/services/UserService';
import { UserRepository } from '../../src/repositories/UserRepository';
import { User } from '../../src/models/User';
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '../../src/errors/AppError';

// -----------  Mock do UserRepository  -----------

jest.mock('../../src/repositories/UserRepository');

function createMockRepo(): jest.Mocked<UserRepository> {
  return {
    findByCpf: jest.fn(),
    create: jest.fn(),
    findPending: jest.fn(),
    findById: jest.fn(),
    updateStatus: jest.fn(),
  } as unknown as jest.Mocked<UserRepository>;
}

// -----------  Helper  -----------

function makeDTO(overrides: Partial<RegisterDTO> = {}): RegisterDTO {
  return {
    nome: 'Maria Souza',
    cpf: '12345678900',
    nome_fantasia: 'Fazenda da Maria',
    categoria_producao: 'Frutas',
    email: 'maria@example.com',
    telefone: '(34) 99999-0000',
    data_nascimento: '1995-06-15',
    endereco: 'Rua A, 123',
    senha: 'senha123',
    ...overrides,
  };
}

function makeUser(overrides: Partial<User> = {}): User {
  return new User({
    id: 1,
    nome: 'Maria Souza',
    cpf: '12345678900',
    nome_fantasia: 'Fazenda da Maria',
    categoria_producao: 'Frutas',
    email: 'maria@example.com',
    telefone: '(34) 99999-0000',
    data_nascimento: '1995-06-15',
    endereco: 'Rua A, 123',
    senha: '$2b$10$hashedpasswordplaceholder',
    status: 'pendente',
    ...overrides,
  });
}

// =============================================
//  Tests
// =============================================

describe('UserService', () => {
  let service: UserService;
  let repo: jest.Mocked<UserRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = createMockRepo();
    service = new UserService(repo);
  });

  // ----------- register -----------

  describe('register', () => {
    it('deve registrar um novo usuário com sucesso', async () => {
      repo.findByCpf.mockResolvedValue(null);
      repo.create.mockImplementation(async (user: User) => {
        user.id = 1;
        return user;
      });

      const dto = makeDTO();
      const result = await service.register(dto);

      expect(repo.findByCpf).toHaveBeenCalledWith(dto.cpf);
      expect(repo.create).toHaveBeenCalledTimes(1);

      // O usuário salvo deve ter status 'pendente' e senha hash (não texto plano)
      const savedUser = repo.create.mock.calls[0][0];
      expect(savedUser.status).toBe('pendente');
      expect(savedUser.senha).not.toBe(dto.senha);
      expect(result.id).toBe(1);
    });

    it('deve gerar hash bcrypt para a senha', async () => {
      repo.findByCpf.mockResolvedValue(null);
      repo.create.mockImplementation(async (user: User) => user);

      await service.register(makeDTO({ senha: 'minhasenha' }));

      const savedUser = repo.create.mock.calls[0][0];
      const isValid = await bcrypt.compare('minhasenha', savedUser.senha);
      expect(isValid).toBe(true);
    });

    it('deve lançar ConflictError se CPF já existe', async () => {
      repo.findByCpf.mockResolvedValue(makeUser());

      await expect(service.register(makeDTO())).rejects.toThrow(ConflictError);
      await expect(service.register(makeDTO())).rejects.toThrow(
        'CPF já cadastrado no sistema.'
      );
      expect(repo.create).not.toHaveBeenCalled();
    });
  });

  // ----------- authenticate -----------

  describe('authenticate', () => {
    it('deve autenticar com sucesso quando credenciais estão corretas', async () => {
      const hashedPwd = await bcrypt.hash('senha123', 4); // salt 4 para rapidez nos testes
      const user = makeUser({ senha: hashedPwd });
      repo.findByCpf.mockResolvedValue(user);

      const result = await service.authenticate('12345678900', 'senha123');

      expect(result).toEqual(user);
      expect(repo.findByCpf).toHaveBeenCalledWith('12345678900');
    });

    it('deve lançar UnauthorizedError se CPF não encontrado', async () => {
      repo.findByCpf.mockResolvedValue(null);

      await expect(
        service.authenticate('000.000.000-00', 'senha123')
      ).rejects.toThrow(UnauthorizedError);
    });

    it('deve lançar UnauthorizedError se senha está incorreta', async () => {
      const hashedPwd = await bcrypt.hash('senha123', 4);
      repo.findByCpf.mockResolvedValue(makeUser({ senha: hashedPwd }));

      await expect(
        service.authenticate('123.456.789-00', 'senhaerrada')
      ).rejects.toThrow(UnauthorizedError);
    });
  });

  // ----------- listPendingUsers -----------

  describe('listPendingUsers', () => {
    it('deve retornar lista de usuários pendentes', async () => {
      const users = [makeUser({ id: 1 }), makeUser({ id: 2, nome: 'João' })];
      repo.findPending.mockResolvedValue(users);

      const result = await service.listPendingUsers();

      expect(result).toEqual(users);
      expect(repo.findPending).toHaveBeenCalledTimes(1);
    });

    it('deve retornar lista vazia quando não há pendentes', async () => {
      repo.findPending.mockResolvedValue([]);

      const result = await service.listPendingUsers();

      expect(result).toEqual([]);
    });
  });

  // ----------- updateUserStatus -----------

  describe('updateUserStatus', () => {
    it('deve aprovar um usuário pendente', async () => {
      const user = makeUser({ id: 5, status: 'pendente' });
      repo.findById.mockResolvedValue(user);
      repo.updateStatus.mockResolvedValue(undefined);

      const result = await service.updateUserStatus(5, 'aprovado');

      expect(result.status).toBe('aprovado');
      expect(repo.updateStatus).toHaveBeenCalledWith(5, 'aprovado', '');
    });

    it('deve reprovar um usuário pendente com motivo', async () => {
      const user = makeUser({ id: 5, status: 'pendente' });
      repo.findById.mockResolvedValue(user);
      repo.updateStatus.mockResolvedValue(undefined);

      const result = await service.updateUserStatus(
        5,
        'reprovado',
        'Documentação incompleta'
      );

      expect(result.status).toBe('reprovado');
      expect(result.motivo_reprovacao).toBe('Documentação incompleta');
      expect(repo.updateStatus).toHaveBeenCalledWith(
        5,
        'reprovado',
        'Documentação incompleta'
      );
    });

    it('deve lançar NotFoundError se o usuário não existe', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.updateUserStatus(999, 'aprovado')).rejects.toThrow(
        NotFoundError
      );
    });

    it('deve lançar ValidationError se o usuário não está pendente', async () => {
      repo.findById.mockResolvedValue(makeUser({ status: 'aprovado' }));

      await expect(service.updateUserStatus(1, 'reprovado', 'motivo')).rejects.toThrow(
        ValidationError
      );
    });

    it('deve lançar ValidationError se reprovar sem motivo', async () => {
      repo.findById.mockResolvedValue(makeUser({ status: 'pendente' }));

      await expect(service.updateUserStatus(1, 'reprovado')).rejects.toThrow(
        ValidationError
      );
      await expect(
        service.updateUserStatus(1, 'reprovado', '')
      ).rejects.toThrow(ValidationError);
      await expect(
        service.updateUserStatus(1, 'reprovado', '   ')
      ).rejects.toThrow(ValidationError);
    });
  });
});
