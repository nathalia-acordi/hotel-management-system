// PaymentStrategy.js — Exemplo de Strategy (GoF)
export class PaymentStrategy {
  calculate(amount) {
    throw new Error('Método não implementado');
  }
}

export class PixDiscountStrategy extends PaymentStrategy {
  calculate(amount) {
    return amount * 0.95; // 5% de desconto para PIX
  }
}

export class CardNoDiscountStrategy extends PaymentStrategy {
  calculate(amount) {
    return amount; // Sem desconto para cartão
  }
}

export class CashDiscountStrategy extends PaymentStrategy {
  calculate(amount) {
    return amount * 0.97; // 3% de desconto para dinheiro
  }
}
