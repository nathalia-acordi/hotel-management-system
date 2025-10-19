export class User {
  // Entidade de domínio: objeto imutável (conceitualmente) para um Usuário
  constructor({ id, username, email, password, role = 'guest', document, phone, active = true, createdAt, updatedAt }) {
    this.id = id;
  this.username = username; // mantido por compatibilidade retroativa
    this.email = email;
  this.password = password; // hasheado na camada de infraestrutura/serviço
  this.role = role; // 'admin' | 'receptionist' | 'guest'
    this.document = document; // CPF/RG
    this.phone = phone;
    this.active = active;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}