import { Guest } from '../src/domain/Guest.js';

describe('Guest Document Validation', () => {
  it('permite cadastro com CPF válido', () => {
    const cpf = '529.982.247-25';
    expect(() => new Guest({ id: 1, name: 'João', document: cpf })).not.toThrow();
  });

  it('não permite cadastro com CPF inválido', () => {
    const cpf = '123.456.789-00';
    expect(() => new Guest({ id: 2, name: 'Maria', document: cpf })).toThrow('Documento inválido');
  });

  it('permite cadastro com RG válido', () => {
    const rg = '12345678';
    expect(() => new Guest({ id: 3, name: 'Carlos', document: rg })).not.toThrow();
  });

  it('permite cadastro com RG válido com X', () => {
    const rg = '1234567X';
    expect(() => new Guest({ id: 4, name: 'Ana', document: rg })).not.toThrow();
  });

  it('não permite cadastro com RG muito curto', () => {
    const rg = '1234';
    expect(() => new Guest({ id: 5, name: 'Pedro', document: rg })).toThrow('Documento inválido');
  });

  it('não permite cadastro sem documento', () => {
    expect(() => new Guest({ id: 6, name: 'SemDoc', document: '' })).toThrow('Documento inválido');
  });
});
