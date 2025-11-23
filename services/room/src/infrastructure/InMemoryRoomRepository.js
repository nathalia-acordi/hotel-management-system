









import { IRoomRepository } from '../domain/IRoomRepository.js';

export class InMemoryRoomRepository extends IRoomRepository {
  constructor() {
    super();
    this.rooms = [];
    this.nextRoomId = 1;
  }

  async create(room) {
    room.id = this.nextRoomId++;
    this.rooms.push(room);
    return room;
  }

  async findByNumber(number) {
    return this.rooms.find(r => r.number === number) || null;
  }

  async findById(id) {
    return this.rooms.find(r => r.id === id) || null;
  }

  async findAll() {
    return this.rooms;
  }

  async update(id, data) {
    const idx = this.rooms.findIndex(r => r.id === id);
    if (idx === -1) return null;
    this.rooms[idx] = { ...this.rooms[idx], ...data };
    return this.rooms[idx];
  }

  async delete(id) {
    const idx = this.rooms.findIndex(r => r.id === id);
    if (idx === -1) return null;
    const removed = this.rooms.splice(idx, 1)[0];
    return removed;
  }

  async setStatus(id, status) {
    const room = await this.findById(id);
    if (!room) return null;
    room.status = status;
    return room;
  }

  async markAsUnderMaintenance(id) {
    const room = await this.findById(id);
    if (!room) return null;
    room.maintenance = true;
    room.status = 'maintenance';
    return room;
  }

  async markAsAvailable(id) {
    const room = await this.findById(id);
    if (!room) return null;
    room.maintenance = false;
    room.status = 'free';
    return room;
  }
}
