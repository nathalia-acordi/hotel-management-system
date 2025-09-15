// RoomFactory.js — Exemplo de Factory (GoF)
import { Room } from '../models/Room.js';

export class RoomFactory {
  static create(type, number, price) {
    switch (type) {
      case 'single':
        return new Room(number, 'single', price, 1);
      case 'double':
        return new Room(number, 'double', price, 2);
      case 'suite':
        return new Room(number, 'suite', price, 4);
      default:
        throw new Error('Tipo de quarto inválido');
    }
  }
}
