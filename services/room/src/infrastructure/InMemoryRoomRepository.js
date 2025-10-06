// InMemoryRoomRepository.js
// Implementação concreta do RoomRepository (SRP, DIP)
import { RoomRepository } from '../domain/RoomRepository.js';

export class InMemoryRoomRepository extends RoomRepository {
  constructor() {
    super();
    this.rooms = [];
    this.nextRoomId = 1;
  }

  add(room) {
    room.id = this.nextRoomId++;
    this.rooms.push(room);
    return room;
  }

  findByNumber(number) {
    return this.rooms.find(r => r.number === number);
  }

  getAll() {
    return this.rooms;
  }
}
