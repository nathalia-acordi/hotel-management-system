



export class User {
  
  constructor({ id, username, email, password, role = 'guest', document, phone, active = true, createdAt, updatedAt }) {
    this.id = id;
  this.username = username; 
    this.email = email;
  this.password = password; 
  this.role = role; 
    this.document = document; 
    this.phone = phone;
    this.active = active;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}