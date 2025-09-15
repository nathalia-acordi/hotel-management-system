export class GuestRepository {
  constructor() {
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
