import { Room } from '../models/Room.js';

export class RoomFactory {
  
  static create(type, number, price) {
    switch (type) {
      case 'standard': 
        return new Room(number, 'standard', price, 2);
      case 'deluxe': 
        return new Room(number, 'deluxe', price, 3);
      case 'suite': 
        return new Room(number, 'suite', price, 4);
      default:
        
        throw new Error('Tipo de quarto inválido');
    }
  }
}
