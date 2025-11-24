









import { IRoomRepository } from '../domain/IRoomRepository.js';
import crypto from 'crypto';

export class InMemoryRoomRepository extends IRoomRepository {
  constructor() {
    super();
    this.rooms = [];
    this.nextRoomId = 1;
  }

  async create(room) {
    // generate a stable-looking 24-char hex id compatible with ObjectId checks in tests
    room.id = crypto.randomBytes(12).toString('hex');
    this.rooms.push(room);
    return room;
  }

  async findByNumber(number) {
    return this.rooms.find(r => r.number === number) || null;
  }

  async findById(id) {
    const sid = String(id);
    return this.rooms.find(r => String(r.id) === sid) || null;
  }

  async findAll() {
    return this.rooms;
  }

  async update(id, data) {
    const sid = String(id);
    const idx = this.rooms.findIndex(r => String(r.id) === sid);
    if (idx === -1) return null;
    this.rooms[idx] = { ...this.rooms[idx], ...data };
    return this.rooms[idx];
  }

  async delete(id) {
    const sid = String(id);
    const idx = this.rooms.findIndex(r => String(r.id) === sid);
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
