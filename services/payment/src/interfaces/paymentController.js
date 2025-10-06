// paymentController.js
// Controller responsável por orquestrar requisições HTTP relacionadas a pagamentos
// Não contém lógica de negócio, apenas delega para o PaymentService

export function createPaymentController(paymentService) {
  return {
    async createPayment(req, res) {
      try {
        const result = await paymentService.createPayment(req.body);
        res.status(result.status).json(result.body);
      } catch (err) {
        res.status(500).json({ error: 'Erro interno ao criar pagamento' });
      }
    },
    async listPayments(req, res) {
      try {
        const result = await paymentService.listPayments();
        res.json(result);
      } catch (err) {
        res.status(500).json({ error: 'Erro ao listar pagamentos' });
      }
    },
    health(req, res) {
      res.send('Payment Service running');
    }
  };
}
