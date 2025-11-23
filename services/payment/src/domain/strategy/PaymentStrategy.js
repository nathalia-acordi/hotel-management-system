




export class PaymentStrategy {
  
  calculate(amount) {
    throw new Error('Método não implementado');
  }
}


export class PixDiscountStrategy extends PaymentStrategy {
  calculate(amount) {
    return amount * 0.95; 
  }
}


export class CardNoDiscountStrategy extends PaymentStrategy {
  calculate(amount) {
    return amount; 
  }
}


export class CashDiscountStrategy extends PaymentStrategy {
  calculate(amount) {
    return amount * 0.97; 
  }
}
