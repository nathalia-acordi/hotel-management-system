export class Guest {
  constructor({ id, name, document, email, phone }) {
    this.id = id;
    this.name = name;
    this.document = document; // CPF, RG, passaporte, etc.
    this.email = email;
    this.phone = phone;
  }
}
