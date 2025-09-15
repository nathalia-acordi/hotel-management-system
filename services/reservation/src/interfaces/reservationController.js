import express from 'express';
import { ReservationRepository } from '../infrastructure/ReservationRepository.js';
import { ReservationService } from '../application/ReservationService.js';
import { Guest } from '../domain/Guest.js';
import { GuestRepository } from '../infrastructure/GuestRepository.js';
import { authenticateJWT, isAdmin, isRecepcionista } from '../authMiddleware.js';

export default function reservationController() {
  const router = express.Router();
  const reservationRepository = new ReservationRepository();
  const reservationService = new ReservationService(reservationRepository);
  const guestRepository = new GuestRepository();

  // Atualizar valor (amount) da reserva
  router.patch('/reservations/:id/amount', authenticateJWT, isRecepcionista, (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { amount } = req.body;
    if (typeof amount !== 'number' || amount < 0) {
      return res.status(400).json({ error: 'amount deve ser um número positivo' });
    }
    const reservation = reservationRepository.findById(id);
    if (!reservation) {
      return res.status(404).json({ error: 'Reserva não encontrada' });
    }
    reservation.amount = amount;
    reservationRepository.update(reservation);
    res.json(reservation);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

  // Relatório de faturamento por período
  router.get('/reports/revenue', authenticateJWT, isRecepcionista, (req, res) => {
  const { start, end } = req.query;
  if (!start || !end) {
    return res.status(400).json({ error: 'Informe start e end no formato YYYY-MM-DD' });
  }
  const startDate = new Date(start);
  const endDate = new Date(end);
  const all = reservationRepository.findAll();
  // Considera reservas pagas, com checkIn >= start e checkOut <= end
  const paid = all.filter(r => r.paymentStatus === 'pago' && new Date(r.checkIn) >= startDate && new Date(r.checkOut) <= endDate);
  // Somar valores pagos (assumindo que cada reserva tem amount, se não, retorna só a contagem)
  const total = paid.reduce((sum, r) => sum + (r.amount || 0), 0);
  res.json({ total, count: paid.length });
});

  // Consultar ocupação de quartos em uma data
  router.get('/rooms/occupancy', authenticateJWT, isRecepcionista, (req, res) => {
  const { date } = req.query;
  if (!date) {
    return res.status(400).json({ error: 'Informe a data no formato YYYY-MM-DD' });
  }
  const target = new Date(date);
  const all = reservationRepository.findAll();
  // Ocupado se a data estiver entre checkIn (inclusive) e checkOut (exclusive), e não cancelado
  const occupied = all.filter(r => !r.cancelled && new Date(r.checkIn) <= target && target < new Date(r.checkOut));
  // Retorna lista de quartos ocupados e reservas correspondentes
  res.json(occupied.map(r => ({ roomId: r.roomId, reservationId: r.id, guestId: r.guestId, checkIn: r.checkIn, checkOut: r.checkOut })));
});

  // Listar reservas ativas
  router.get('/reservations/active', authenticateJWT, isRecepcionista, (req, res) => {
  // Ativa = não cancelada e não finalizada (sem checkOutStatus true)
  const all = reservationRepository.findAll();
  const active = all.filter(r => !r.cancelled && !r.checkOutStatus);
  res.json(active);
});
  // Cadastro de hóspede
  router.post('/guests', authenticateJWT, isRecepcionista, (req, res) => {
  try {
    const { name, document, email, phone } = req.body;
    if (!name || !document) {
      return res.status(400).json({ error: 'Nome e documento são obrigatórios' });
    }
    let guest = guestRepository.findByDocument(document);
    if (guest) {
      return res.status(409).json({ error: 'Hóspede já cadastrado' });
    }
    guest = new Guest({ name, document, email, phone });
    guestRepository.save(guest);
    res.status(201).json(guest);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

  // Listar hóspedes
  router.get('/guests', authenticateJWT, isRecepcionista, (req, res) => {
  res.json(guestRepository.findAll());
});

  // Atualizar status de pagamento da reserva
  router.patch('/reservations/:id/payment', authenticateJWT, isRecepcionista, (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { paymentStatus } = req.body;
    if (!paymentStatus) {
      return res.status(400).json({ error: 'paymentStatus é obrigatório' });
    }
    const reservation = reservationService.updatePaymentStatus(id, paymentStatus);
    res.json(reservation);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

  // Check-in
  router.post('/reservations/:id/checkin', authenticateJWT, isRecepcionista, (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const reservation = reservationService.checkIn(id);
    res.json(reservation);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

  // Check-out
  router.post('/reservations/:id/checkout', authenticateJWT, isRecepcionista, (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const reservation = reservationService.checkOut(id);
    res.json(reservation);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

  // Cancelamento de reserva
  router.post('/reservations/:id/cancel', authenticateJWT, isRecepcionista, (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const reservation = reservationService.cancelReservation(id);
    res.json(reservation);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

  router.post('/reservations', authenticateJWT, isRecepcionista, (req, res) => {
  try {
    console.log('POST /reservations body:', req.body);
    const { userId, guestId, roomId, checkIn, checkOut } = req.body;
    const reservation = reservationService.createReservation({ userId, guestId, roomId, checkIn, checkOut });
    res.status(201).json(reservation);
  } catch (err) {
    console.error('Erro ao criar reserva:', err.message);
    if (err.message && /quarto já reservado/i.test(err.message)) {
      return res.status(400).json({ error: 'Quarto já reservado para o período informado.' });
    }
    res.status(400).json({ error: err.message || 'Erro ao criar reserva.' });
  }
});

  router.get('/reservations', authenticateJWT, isRecepcionista, (req, res) => {
  res.json(reservationService.getAllReservations());
});

  return router;
}
