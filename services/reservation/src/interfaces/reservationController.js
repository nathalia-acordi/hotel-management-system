import express from 'express';
import { InMemoryReservationRepository } from '../infrastructure/InMemoryReservationRepository.js';
import { ReservationService } from '../application/ReservationService.js';
import { Guest } from '../domain/Guest.js';
import { GuestRepository } from '../infrastructure/GuestRepository.js';
import { authenticateJWT, isAdmin, isReceptionist } from '../authMiddleware.js';





export default function reservationController({ authenticateJWT: authMW = authenticateJWT, isAdmin: adminMW = isAdmin, isRecepcionista: recepMW = isReceptionist } = {}) {
  const router = express.Router();
  
  
  const reservationRepository = global.__reservationRepository__ || new InMemoryReservationRepository();
  const reservationService = new ReservationService(reservationRepository);
  const guestRepository = new GuestRepository();

  
  
  router.patch('/reservations/:id/amount', authMW, recepMW, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { amount } = req.body;
      if (typeof amount !== 'number' || amount < 0) {
        return res.status(400).json({ error: 'amount deve ser um número positivo' });
      }
      let reservation = reservationRepository.findById(id);
      if (reservation && typeof reservation.then === 'function') reservation = await reservation;
      if (!reservation) {
        return res.status(404).json({ error: 'Reserva não encontrada' });
      }
      reservation.amount = amount;
      const up = reservationRepository.update(reservation);
      if (up && typeof up.then === 'function') await up;
      res.json(reservation);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  
  
  router.get('/reports/revenue', authMW, recepMW, async (req, res) => {
    const { start, end } = req.query;
    if (!start || !end) {
      return res.status(400).json({ error: 'Informe start e end no formato YYYY-MM-DD' });
    }
    const startDate = new Date(start);
    const endDate = new Date(end);
    let all = reservationRepository.findAll();
    if (all && typeof all.then === 'function') all = await all;
    
    const paid = (all || []).filter(r => r.paymentStatus === 'pago' && new Date(r.checkIn) >= startDate && new Date(r.checkOut) <= endDate);
    
    const total = paid.reduce((sum, r) => sum + (r.amount || 0), 0);
    res.json({ total, count: paid.length });
  });

  
  
  router.get('/rooms/occupancy', authMW, recepMW, async (req, res) => {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ error: 'Informe a data no formato YYYY-MM-DD' });
    }
    const target = new Date(date);
    let all = reservationRepository.findAll();
    if (all && typeof all.then === 'function') all = await all;
    
    const occupied = (all || []).filter(r => !r.cancelled && new Date(r.checkIn) <= target && target < new Date(r.checkOut));
    res.json(occupied.map(r => ({ roomId: r.roomId, reservationId: r.id, guestId: r.guestId, checkIn: r.checkIn, checkOut: r.checkOut })));
  });

  
  router.get('/reservations/active', authMW, recepMW, async (req, res) => {
    let all = reservationRepository.findAll();
    if (all && typeof all.then === 'function') all = await all;
    const active = (all || []).filter(r => !r.cancelled && !r.checkOutStatus);
    res.json(active);
  });

  
  router.post('/guests', authMW, recepMW, (req, res) => {
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

  
  router.get('/guests', authenticateJWT, isReceptionist, (req, res) => {
    res.json(guestRepository.findAll());
  });

  
  router.patch('/reservations/:id/payment', authenticateJWT, isReceptionist, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { paymentStatus } = req.body;
      if (!paymentStatus) {
        return res.status(400).json({ error: 'paymentStatus é obrigatório' });
      }
      const reservation = await reservationService.updatePaymentStatus(id, paymentStatus);
      res.json(reservation);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  
  router.post('/reservations/:id/checkin', authenticateJWT, isReceptionist, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const reservation = await reservationService.checkIn(id);
      res.json(reservation);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  
  router.post('/reservations/:id/checkout', authenticateJWT, isReceptionist, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const reservation = await reservationService.checkOut(id);
      res.json(reservation);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  
  router.post('/reservations/:id/cancel', authenticateJWT, isReceptionist, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const reservation = await reservationService.cancelReservation(id);
      res.json(reservation);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  
  
  router.post('/reservations', authenticateJWT, isReceptionist, async (req, res) => {
    try {
      console.log('POST /reservations body:', req.body);
      
      const authUserId = req.user && req.user.id ? req.user.id : undefined;
      const { userId: bodyUserId, guestId, roomId, checkIn, checkOut } = req.body || {};
      const userId = bodyUserId || authUserId;

      
      if (guestId != null) {
        
        let guest = guestRepository.findById(guestId);
        if (!guest) {
          const validateRemoteGuests = (process.env.VALIDATE_REMOTE_ENTITIES || 'true').toLowerCase() === 'true';
          if (validateRemoteGuests) {
            try {
              
              
              const userServiceUrl = process.env.USER_URL || 'http://user:3000';
              const listUrl = `${userServiceUrl.replace(/\/$/, '')}/users`;
              const headers = {};
              if (req.headers && req.headers.authorization) headers['Authorization'] = req.headers.authorization;
              const r = await fetch(listUrl, { method: 'GET', headers });
              if (r.status === 401 || r.status === 403) {
                return res.status(403).json({ error: 'Não autorizado para verificar guestId' });
              }
              if (!r.ok) {
                console.error('[Reservation] Erro ao listar usuários para validação de guestId:', r.status, await r.text());
                return res.status(502).json({ error: 'Falha ao validar guestId no User Service' });
              }
              const users = await r.json();
              const found = (users || []).find(u => {
                
                if (!u) return false;
                if (u.id && String(u.id) === String(guestId)) return true;
                if (u._id && String(u._id) === String(guestId)) return true;
                if (u.username && String(u.username) === String(guestId)) return true;
                if (u.document && String(u.document) === String(guestId)) return true;
                return false;
              });
              if (!found) {
                return res.status(400).json({ error: 'guestId informado não corresponde a um hóspede cadastrado' });
              }
            } catch (err) {
              console.error('[Reservation] Exceção ao validar guestId remoto:', err && err.stack ? err.stack : err);
              return res.status(502).json({ error: 'Erro ao validar guestId no User Service' });
            }
          } else {
            return res.status(400).json({ error: 'guestId informado não corresponde a um hóspede cadastrado' });
          }
        }
      }

      
      const validateRemote = (process.env.VALIDATE_REMOTE_ENTITIES || 'true').toLowerCase() === 'true';
      if (validateRemote) {
        try {
          if (roomId == null) {
            return res.status(400).json({ error: 'roomId é obrigatório' });
          }
          const roomServiceUrl = process.env.ROOM_URL || 'http://room:3004';
          const roomUrl = `${roomServiceUrl.replace(/\/$/, '')}/rooms/${encodeURIComponent(roomId)}`;
          const headers = {};
          if (req.headers && req.headers.authorization) headers['Authorization'] = req.headers.authorization;
          const r = await fetch(roomUrl, { method: 'GET', headers });
          if (r.status === 404) {
            return res.status(400).json({ error: 'roomId informado não corresponde a um quarto existente' });
          }
          if (r.status === 401 || r.status === 403) {
            
            return res.status(403).json({ error: 'Não autorizado para verificar roomId' });
          }
          if (!r.ok) {
            console.error('[Reservation] Erro ao validar roomId remoto:', r.status, await r.text());
            return res.status(502).json({ error: 'Falha ao validar roomId no Room Service' });
          }
        } catch (err) {
          console.error('[Reservation] Exceção ao validar roomId remoto:', err && err.stack ? err.stack : err);
          return res.status(502).json({ error: 'Erro ao validar roomId no Room Service' });
        }
      }

      

      const reservation = await reservationService.createReservation({ userId, guestId, roomId, checkIn, checkOut });
      res.status(201).json(reservation);
    } catch (err) {
      console.error('Erro ao criar reserva:', err.message);
      if (err.message && /quarto já reservado/i.test(err.message)) {
        return res.status(400).json({ error: 'Quarto já reservado para o período informado.' });
      }
      res.status(400).json({ error: err.message || 'Erro ao criar reserva.' });
    }
  });

  
  router.get('/reservations', authenticateJWT, isReceptionist, async (req, res) => {
    const all = await reservationService.getAllReservations();
    res.json(all);
  });

  return router;
}
