

import axios from 'axios';

describe('Cadastro e consulta de hóspedes (via gateway)', () => {
  const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:3005';
  let recepToken, guest;

  beforeAll(async () => {
  const username = `recep5_${Date.now()}`;
  await axios.post(`${GATEWAY_URL}/register`, { username, password: '123456', role: 'recepcionista' });
  recepToken = (await axios.post(`${GATEWAY_URL}/login`, { username, password: '123456' })).data.token;
  });

  it('cadastra hóspede com sucesso', async () => {
  const res = await axios.post(`${GATEWAY_URL}/guests`, {
      name: 'Hóspede Teste',
      document: '123456789',
      email: 'hospede@teste.com',
      phone: '99999999'
    }, {
      headers: { Authorization: `Bearer ${recepToken}` }
    });
    expect(res.status).toBe(201);
    guest = res.data;
    expect(guest.name).toBe('Hóspede Teste');
  });

  it('consulta hóspedes cadastrados', async () => {
  const res = await axios.get(`${GATEWAY_URL}/guests`, {
      headers: { Authorization: `Bearer ${recepToken}` }
    });
    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data.some(g => g.id === guest.id)).toBe(true);
  });
});
