import { jest } from '@jest/globals';
const mockAxios = { post: jest.fn() };
const mockRabbit = {
  publishLoginEvent: jest.fn(),
  createLoginEvent: jest.fn(() => ({ type: 'auth.login' }))
};
jest.unstable_mockModule && jest.unstable_mockModule('axios', () => ({ default: mockAxios }));
jest.unstable_mockModule && jest.unstable_mockModule('../src/infrastructure/rabbitmq.js', () => mockRabbit);

let login;
let request;
let express;
let app;

beforeAll(async () => {
  express = (await import('express')).default;
  request = (await import('supertest')).default;
  ({ login } = await import('../src/interfaces/authController.js'));
  app = express();
  app.use(express.json());
  app.post('/login', login);
});

describe('Auth Service - POST /login', () => {
  let axios;
  let rabbit;


  beforeEach(() => {
    axios = mockAxios;
    rabbit = mockRabbit;
    axios.post.mockReset();
    rabbit.publishLoginEvent.mockReset();
  });

  it('retorna token se usuário válido', async () => {
    axios.post.mockResolvedValue({ data: { valid: true, id: 1, role: 'user' } });
    const res = await request(app).post('/login').send({ username: 'test', password: '123' });
    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(rabbit.publishLoginEvent).toHaveBeenCalled();
  });

  it('retorna 401 se usuário inválido', async () => {
    axios.post.mockResolvedValue({ data: { valid: false } });
    const res = await request(app).post('/login').send({ username: 'test', password: 'errada' });
    expect(res.statusCode).toBe(401);
    expect(res.body.token).toBeUndefined();
  });

  it('retorna 401 se erro na requisição', async () => {
    axios.post.mockRejectedValue(new Error('erro')); // simula erro de rede
    const res = await request(app).post('/login').send({ username: 'test', password: '123' });
    expect(res.statusCode).toBe(401);
    expect(res.body.token).toBeUndefined();
  });
});
