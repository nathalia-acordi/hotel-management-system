export class Guest {
  constructor({ id, name, document, email, phone }) {
    this.id = id;
    this.name = name;
    if (!Guest.isValidDocument(document)) {
      throw new Error('Documento inválido');
    }
    this.document = document;
    this.email = email;
    this.phone = phone;
  }

  
  static isValidCPF(cpf) {
    cpf = (cpf || '').replace(/\D/g, '');
    if (!cpf || cpf.length !== 11 || /^([0-9])\1+$/.test(cpf)) return false;
    let sum = 0, rest;
    for (let i = 1; i <= 9; i++) sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
    rest = (sum * 10) % 11;
    if (rest === 10 || rest === 11) rest = 0;
    if (rest !== parseInt(cpf.substring(9, 10))) return false;
    sum = 0;
    for (let i = 1; i <= 10; i++) sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
    rest = (sum * 10) % 11;
    if (rest === 10 || rest === 11) rest = 0;
    if (rest !== parseInt(cpf.substring(10, 11))) return false;
    return true;
  }

  
  static isValidRG(rg) {
    if (!rg) return false;
    
    const rgPattern = /^\d{4,13}[\dxX]?$/;
    if (!rgPattern.test(rg)) return false;
    
    return rg.replace(/\D/g, '').length + (/[xX]$/.test(rg) ? 1 : 0) >= 5;
  }

  static isValidDocument(doc) {
    if (!doc) return false;
    const onlyNumbers = doc.replace(/\D/g, '');
    
    return Guest.isValidCPF(onlyNumbers) || Guest.isValidRG(doc);
  }
}
