export interface UserData {
  id?: number;
  nome: string;
  cpf_cnpj: string;
  email: string;
  telefone: string;
  data_nascimento: string;
  observacao?: string;
  endereco: string;
  senha: string;
  status?: string;
  motivo_reprovacao?: string;
  created_at?: string;
}

export class User {
  public id?: number;
  public nome: string;
  public cpf_cnpj: string;
  public email: string;
  public telefone: string;
  public data_nascimento: string;
  public observacao: string;
  public endereco: string;
  public senha: string;
  public status: string;
  public motivo_reprovacao: string;
  public created_at?: string;

  constructor(data: UserData) {
    this.id = data.id;
    this.nome = data.nome;
    this.cpf_cnpj = data.cpf_cnpj;
    this.email = data.email;
    this.telefone = data.telefone;
    this.data_nascimento = data.data_nascimento;
    this.observacao = data.observacao ?? '';
    this.endereco = data.endereco;
    this.senha = data.senha;
    this.status = data.status ?? 'pendente';
    this.motivo_reprovacao = data.motivo_reprovacao ?? '';
    this.created_at = data.created_at;
  }

  public toPublicJSON(): object {
    return {
      id: this.id,
      nome: this.nome,
      cpf_cnpj: this.cpf_cnpj,
      email: this.email,
      telefone: this.telefone,
      data_nascimento: this.data_nascimento,
      observacao: this.observacao,
      endereco: this.endereco,
      status: this.status,
      motivo_reprovacao: this.motivo_reprovacao,
      created_at: this.created_at,
    };
  }
}
