export class Reservation {
  constructor({ id, userId, guestId, roomId, checkIn, checkOut, createdAt, checkInStatus, checkOutStatus, cancelled, paymentStatus }) {
    this.id = id;
    this.userId = userId;
    this.guestId = guestId; // pode ser igual ao userId ou diferente
    this.roomId = roomId;
    this.checkIn = checkIn;
    this.checkOut = checkOut;
    this.createdAt = createdAt || new Date().toISOString();
    this.checkInStatus = checkInStatus || false;
    this.checkOutStatus = checkOutStatus || false;
    this.cancelled = cancelled || false;
    this.paymentStatus = paymentStatus || 'pendente'; // pendente, pago, cancelado
  }
}
