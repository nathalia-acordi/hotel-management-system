


export class Room {
  constructor(number, type, price, capacity, status = 'free', maintenance = false) {
    this.number = number;
    this.type = type; 
    this.price = price; 
    this.capacity = capacity; 
    this.status = status; 
    this.maintenance = maintenance;
  }
}
