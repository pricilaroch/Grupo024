export interface UserData {
  id?: number;
  nome: string;
  cpf: string;
  cnpj?: string;
  nome_fantasia: string;
  categoria_producao: string;
  email: string;
  telefone: string;
  data_nascimento: string;
  observacao?: string;
  endereco: string;
  senha: string;
  status?: string;
  role?: string;
  motivo_reprovacao?: string;
  created_at?: string;
}

export interface PublicUser {
  id?: number;
  nome: string;
  cpf: string;
  cnpj: string;
  nome_fantasia: string;
  categoria_producao: string;
  email: string;
  telefone: string;
  data_nascimento: string;
  observacao: string;
  endereco: string;
  status: string;
  role: string;
  motivo_reprovacao: string;
  created_at?: string;
}

export class User {
  public id?: number;
  public nome: string;
  public cpf: string;
  public cnpj: string;
  public nome_fantasia: string;
  public categoria_producao: string;
  public email: string;
  public telefone: string;
  public data_nascimento: string;
  public observacao: string;
  public endereco: string;
  public senha: string;
  public status: string;
  public role: string;
  public motivo_reprovacao: string;
  public created_at?: string;

  constructor(data: UserData) {
    this.id = data.id;
    this.nome = data.nome;
    this.cpf = data.cpf;
    this.cnpj = data.cnpj ?? '';
    this.nome_fantasia = data.nome_fantasia;
    this.categoria_producao = data.categoria_producao;
    this.email = data.email;
    this.telefone = data.telefone;
    this.data_nascimento = data.data_nascimento;
    this.observacao = data.observacao ?? '';
    this.endereco = data.endereco;
    this.senha = data.senha;
    this.status = data.status ?? 'pendente';
    this.role = data.role ?? 'produtor';
    this.motivo_reprovacao = data.motivo_reprovacao ?? '';
    this.created_at = data.created_at;
  }

  public toPublicJSON(): PublicUser {
    return {
      id: this.id,
      nome: this.nome,
      cpf: this.cpf,
      cnpj: this.cnpj,
      nome_fantasia: this.nome_fantasia,
      categoria_producao: this.categoria_producao,
      email: this.email,
      telefone: this.telefone,
      data_nascimento: this.data_nascimento,
      observacao: this.observacao,
      endereco: this.endereco,
      status: this.status,
      role: this.role,
      motivo_reprovacao: this.motivo_reprovacao,
      created_at: this.created_at,
    };
  }
}
