// Domain entity for Room (no persistence concerns here)
export class Room {
  constructor(number, type, price, capacity, status = 'free', maintenance = false) {
    this.number = number;
    this.type = type; // 'standard' | 'deluxe' | 'suite'
    this.price = price; // >= 0
    this.capacity = capacity; // >= 1
    this.status = status; // 'free' | 'occupied' | 'maintenance'
    this.maintenance = maintenance;
  }
}
