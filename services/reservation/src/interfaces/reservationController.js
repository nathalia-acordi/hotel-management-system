import express from 'express';
import { ReservationRepository } from '../infrastructure/ReservationRepository.js';
import { ReservationService } from '../application/ReservationService.js';

const router = express.Router();
const reservationRepository = new ReservationRepository();
const reservationService = new ReservationService(reservationRepository);

router.post('/reservations', (req, res) => {
  try {
    const { userId, roomId, checkIn, checkOut } = req.body;
    const reservation = reservationService.createReservation({ userId, roomId, checkIn, checkOut });
    res.status(201).json(reservation);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/reservations', (req, res) => {
  res.json(reservationService.getAllReservations());
});

export default router;
