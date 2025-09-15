// PaymentStrategy.js
// Implementa o padrão Strategy (GoF) para cálculo de desconto conforme o método de pagamento.
// Permite adicionar novas estratégias sem alterar o fluxo principal do serviço.

// Interface base para estratégias de pagamento
export class PaymentStrategy {
  // Método a ser implementado pelas estratégias concretas
  calculate(amount) {
    throw new Error('Método não implementado');
  }
}

// Estratégia: desconto de 5% para pagamentos via PIX
export class PixDiscountStrategy extends PaymentStrategy {
  calculate(amount) {
    return amount * 0.95; // 5% de desconto para PIX
  }
}

// Estratégia: sem desconto para cartão
export class CardNoDiscountStrategy extends PaymentStrategy {
  calculate(amount) {
    return amount; // Sem desconto para cartão
  }
}

// Estratégia: desconto de 3% para dinheiro
export class CashDiscountStrategy extends PaymentStrategy {
  calculate(amount) {
    return amount * 0.97; // 3% de desconto para dinheiro
  }
}
