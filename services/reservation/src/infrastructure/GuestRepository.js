import { GuestRepository as AbstractGuestRepository } from '../domain/GuestRepository.js';

export class GuestRepository extends AbstractGuestRepository {
  constructor() {
    super();
    this.guests = [];
    this.nextId = 1;
  }

  save(guest) {
    guest.id = this.nextId++;
    this.guests.push(guest);
    return guest;
  }

  findById(id) {
    return this.guests.find(g => g.id === id);
  }

  findAll() {
    return this.guests;
  }

  findByDocument(document) {
    return this.guests.find(g => g.document === document);
  }
}
