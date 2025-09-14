export class Reservation {
  constructor({ id, userId, roomId, checkIn, checkOut, createdAt }) {
    this.id = id;
    this.userId = userId;
    this.roomId = roomId;
    this.checkIn = checkIn;
    this.checkOut = checkOut;
    this.createdAt = createdAt || new Date().toISOString();
  }
}
