import mongoose from 'mongoose';
import { ReservationRepository } from '../domain/ReservationRepository.js';


const reservationSchema = new mongoose.Schema({
  
  userId: { type: mongoose.Schema.Types.Mixed, required: true, index: true },
  guestId: { type: mongoose.Schema.Types.Mixed, required: true, index: true },
  roomId: { type: mongoose.Schema.Types.Mixed, required: true, index: true },
  checkIn: { type: Date, required: true, index: true },
  checkOut: { type: Date, required: true, index: true },
  checkInStatus: { type: Boolean, default: false },
  checkOutStatus: { type: Boolean, default: false },
  cancelled: { type: Boolean, default: false, index: true },
  paymentStatus: { 
    type: String, 
    enum: ['pendente', 'pago', 'cancelado'], 
    default: 'pendente',
    index: true
  },
  amount: { type: Number, default: 0, min: 0 },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });


reservationSchema.index({ roomId: 1, checkIn: 1, checkOut: 1 });


reservationSchema.index({ cancelled: 1, checkOutStatus: 1 });

const ReservationModel = mongoose.model('Reservation', reservationSchema);

export class MongoReservationRepository extends ReservationRepository {
  async save(reservation) {
    console.log('[MongoReservationRepository] Tentando salvar reserva:', {
      userId: reservation?.userId,
      guestId: reservation?.guestId,
      roomId: reservation?.roomId,
      checkIn: reservation?.checkIn,
      checkOut: reservation?.checkOut
    });

    try {
      const newReservation = new ReservationModel(reservation);
      const savedReservation = await newReservation.save();
      
      console.log('[MongoReservationRepository] Reserva salva com sucesso:', {
        id: savedReservation._id,
        roomId: savedReservation.roomId
      });

      
      return {
        ...savedReservation.toObject(),
        id: savedReservation._id.toString()
      };
    } catch (error) {
      console.error('[MongoReservationRepository] Erro ao salvar reserva:', error.message);
      
      if (error.name === 'ValidationError') {
        
        let details = error.message;
        try {
          if (error.errors && typeof error.errors === 'object') {
            const parts = Object.values(error.errors).map(e => e && e.message).filter(Boolean);
            if (parts.length) details = parts.join('; ');
          }
        } catch (e) {
          
        }
        const err = new Error(`Dados de reserva inválidos: ${details}`);
        err.httpStatus = 400;
        throw err;
      }
      
      throw error;
    }
  }

  async findById(id) {
    console.log('[MongoReservationRepository] Buscando reserva por ID:', id);

    try {
      
      let query;
      if (mongoose.Types.ObjectId.isValid(id)) {
        query = { _id: id };
      } else {
        
        query = { _id: new mongoose.Types.ObjectId(id) };
      }

      const reservation = await ReservationModel.findOne(query);
      
      if (!reservation) {
        console.log('[MongoReservationRepository] Reserva não encontrada');
        return null;
      }

      console.log('[MongoReservationRepository] Reserva encontrada:', {
        id: reservation._id,
        roomId: reservation.roomId
      });

      return {
        ...reservation.toObject(),
        id: reservation._id.toString()
      };
    } catch (error) {
      console.error('[MongoReservationRepository] Erro ao buscar reserva:', error.message);
      throw error;
    }
  }

  async update(reservation) {
    console.log('[MongoReservationRepository] Atualizando reserva:', {
      id: reservation?.id,
      fields: Object.keys(reservation || {})
    });

    try {
      const { id, ...updateData } = reservation;
      
      const updatedReservation = await ReservationModel.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );

      if (!updatedReservation) {
        const err = new Error('Reserva não encontrada');
        err.httpStatus = 404;
        throw err;
      }

      console.log('[MongoReservationRepository] Reserva atualizada com sucesso:', {
        id: updatedReservation._id
      });

      return {
        ...updatedReservation.toObject(),
        id: updatedReservation._id.toString()
      };
    } catch (error) {
      console.error('[MongoReservationRepository] Erro ao atualizar reserva:', error.message);
      
      if (error.httpStatus) throw error;
      
      if (error.name === 'ValidationError') {
        let details = error.message;
        try {
          if (error.errors && typeof error.errors === 'object') {
            const parts = Object.values(error.errors).map(e => e && e.message).filter(Boolean);
            if (parts.length) details = parts.join('; ');
          }
        } catch (e) {}
        const err = new Error(`Dados de reserva inválidos: ${details}`);
        err.httpStatus = 400;
        throw err;
      }
      
      throw error;
    }
  }

  async findAll() {
    console.log('[MongoReservationRepository] Listando todas as reservas');

    try {
      const reservations = await ReservationModel.find().sort({ createdAt: -1 });
      
      console.log('[MongoReservationRepository] Reservas encontradas:', reservations.length);

      return reservations.map(r => ({
        ...r.toObject(),
        id: r._id.toString()
      }));
    } catch (error) {
      console.error('[MongoReservationRepository] Erro ao listar reservas:', error.message);
      throw error;
    }
  }

  async clear() {
    console.log('[MongoReservationRepository] Limpando todas as reservas');

    try {
      await ReservationModel.deleteMany({});
      console.log('[MongoReservationRepository] Todas as reservas removidas');
    } catch (error) {
      console.error('[MongoReservationRepository] Erro ao limpar reservas:', error.message);
      throw error;
    }
  }

  
  async findActive() {
    console.log('[MongoReservationRepository] Buscando reservas ativas');

    try {
      const reservations = await ReservationModel.find({
        cancelled: false,
        checkOutStatus: false
      }).sort({ checkIn: 1 });

      return reservations.map(r => ({
        ...r.toObject(),
        id: r._id.toString()
      }));
    } catch (error) {
      console.error('[MongoReservationRepository] Erro ao buscar reservas ativas:', error.message);
      throw error;
    }
  }

  
  async findConflicts(roomId, checkIn, checkOut, excludeId = null) {
    console.log('[MongoReservationRepository] Verificando conflitos:', {
      roomId,
      checkIn,
      checkOut,
      excludeId
    });

    try {
      const query = {
        roomId,
        cancelled: false,
        checkIn: { $lt: new Date(checkOut) },
        checkOut: { $gt: new Date(checkIn) }
      };

      if (excludeId) {
        query._id = { $ne: excludeId };
      }

      const conflicts = await ReservationModel.find(query);
      
      console.log('[MongoReservationRepository] Conflitos encontrados:', conflicts.length);

      return conflicts.map(r => ({
        ...r.toObject(),
        id: r._id.toString()
      }));
    } catch (error) {
      console.error('[MongoReservationRepository] Erro ao verificar conflitos:', error.message);
      throw error;
    }
  }

  
  async findByDateRange(startDate, endDate) {
    console.log('[MongoReservationRepository] Buscando reservas por período:', {
      startDate,
      endDate
    });

    try {
      const reservations = await ReservationModel.find({
        checkIn: { $gte: new Date(startDate) },
        checkOut: { $lte: new Date(endDate) }
      }).sort({ checkIn: 1 });

      return reservations.map(r => ({
        ...r.toObject(),
        id: r._id.toString()
      }));
    } catch (error) {
      console.error('[MongoReservationRepository] Erro ao buscar por período:', error.message);
      throw error;
    }
  }

  
  async findByPaymentStatus(status) {
    console.log('[MongoReservationRepository] Buscando reservas por status de pagamento:', status);

    try {
      const reservations = await ReservationModel.find({
        paymentStatus: status
      }).sort({ createdAt: -1 });

      return reservations.map(r => ({
        ...r.toObject(),
        id: r._id.toString()
      }));
    } catch (error) {
      console.error('[MongoReservationRepository] Erro ao buscar por status de pagamento:', error.message);
      throw error;
    }
  }
}