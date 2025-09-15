
// RoomFactory — Implementação do padrão Factory (GoF)
// Responsável por criar instâncias de Room de acordo com o tipo, encapsulando a lógica de construção e regras de negócio.
import { Room } from '../models/Room.js';

export class RoomFactory {
  /**
   * Cria uma instância de Room de acordo com o tipo informado.
   * @param {string} type - Tipo do quarto ('single', 'double', 'suite')
   * @param {number} number - Número do quarto
   * @param {number} price - Preço do quarto
   * @returns {Room}
   * @throws {Error} Se o tipo for inválido
   */
  static create(type, number, price) {
    switch (type) {
      case 'single': // Quarto de solteiro, capacidade 1
        return new Room(number, 'single', price, 1);
      case 'double': // Quarto de casal, capacidade 2
        return new Room(number, 'double', price, 2);
      case 'suite': // Suíte, capacidade 4
        return new Room(number, 'suite', price, 4);
      default:
        // Regra de negócio: só aceita tipos válidos
        throw new Error('Tipo de quarto inválido');
    }
  }
}
