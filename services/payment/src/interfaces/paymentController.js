



export function createPaymentController(paymentService) {
  return {
    async createPayment(req, res) {
      try {
        console.log('[PAYMENT][Controller] Body recebido:', req.body);
        const result = await paymentService.createPayment(req.body);
        res.status(result.status).json(result.body);
      } catch (err) {
        console.error('[PAYMENT][Controller] Erro ao processar pagamento:', err);
        res.status(500).json({ erro: 'Erro interno ao processar pagamento' });
      }
    },

    async listPayments(req, res) {
      try {
        const result = await paymentService.listPayments();
        res.json(result);
      } catch (err) {
        res.status(500).json({ erro: 'Erro ao listar pagamentos' });
      }
    },

    async getPaymentStatus(req, res) {
      try {
        const status = await paymentService.getPaymentStatus(req.params.id);
        if (!status) {
          return res.status(404).json({ erro: 'Pagamento não encontrado' });
        }
        res.json(status);
      } catch (err) {
        res.status(500).json({ erro: 'Erro ao consultar status do pagamento' });
      }
    }
  };
}
