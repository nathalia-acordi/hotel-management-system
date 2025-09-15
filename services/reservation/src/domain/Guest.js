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

  // Validação de CPF
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

  // Validação de RG (mínimo 5, máximo 14 caracteres, pode conter X/x no final)
  static isValidRG(rg) {
    if (!rg) return false;
    // Aceita números e, opcionalmente, um X/x no final, mínimo 5 caracteres
    const rgPattern = /^\d{4,13}[\dxX]?$/;
    if (!rgPattern.test(rg)) return false;
    // Garante mínimo de 5 caracteres (ex: 4 números + 1 letra)
    return rg.replace(/\D/g, '').length + (/[xX]$/.test(rg) ? 1 : 0) >= 5;
  }

  static isValidDocument(doc) {
    if (!doc) return false;
    const onlyNumbers = doc.replace(/\D/g, '');
    // CPF deve ser só números, RG pode ter X/x no final
    return Guest.isValidCPF(onlyNumbers) || Guest.isValidRG(doc);
  }
}
