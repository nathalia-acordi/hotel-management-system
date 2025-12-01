import mongoose from "mongoose";
import { IRoomRepository } from "../domain/IRoomRepository.js";
import { HttpError } from "../application/HttpError.js";

const roomSchema = new mongoose.Schema(
  {
    number: { type: Number, required: true, unique: true, index: true },
    type: {
      type: String,
      required: true,
      enum: ["standard", "deluxe", "suite"],
    },
    capacity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["free", "occupied", "maintenance"],
      default: "free",
    },
    maintenance: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const RoomModel = mongoose.model("Room", roomSchema);

export class MongoRoomRepository extends IRoomRepository {
  async create(room) {
    console.log("[MongoRoomRepository] Tentando criar quarto:", {
      number: room?.number,
      type: room?.type,
    });
    try {
      const newRoom = new RoomModel(room);
      const savedRoom = await newRoom.save();
      console.log("[MongoRoomRepository] Quarto criado com sucesso:", {
        id: savedRoom._id,
        number: savedRoom.number,
      });
      return { ...savedRoom.toObject(), id: savedRoom._id };
    } catch (error) {
      console.error(
        "[MongoRoomRepository] Erro ao criar quarto:",
        error.message
      );
      if (error.code === 11000) {
        throw new HttpError(409, "Conflito: quarto já existe");
      }
      if (error.name === "ValidationError") {
        throw new HttpError(400, "Dados inválidos");
      }
      throw new HttpError(500, "Erro interno do servidor");
    }
  }

  async findById(id) {
    console.log("[MongoRoomRepository] Tentando buscar quarto por ID:", id);
    try {
      const room = await RoomModel.findById(id);
      console.log(
        "[MongoRoomRepository] Quarto encontrado:",
        room ? { id: room._id, number: room.number } : null
      );
      return room ? { ...room.toObject(), id: room._id } : null;
    } catch (error) {
      console.error(
        "[MongoRoomRepository] Erro ao buscar quarto por ID:",
        error.message
      );
      throw new HttpError(500, "Erro interno do servidor");
    }
  }

  async findAll() {
    console.log("[MongoRoomRepository] Tentando buscar todos os quartos");
    try {
      const rooms = await RoomModel.find();
      console.log("[MongoRoomRepository] Quartos encontrados:", rooms.length);
      return rooms.map((room) => ({ ...room.toObject(), id: room._id }));
    } catch (error) {
      console.error(
        "[MongoRoomRepository] Erro ao buscar todos os quartos:",
        error.message
      );
      throw new HttpError(500, "Erro interno do servidor");
    }
  }

  async findByNumber(number) {
    console.log(
      "[MongoRoomRepository] Tentando buscar quarto por número:",
      number
    );
    try {
      const room = await RoomModel.findOne({ number });
      console.log(
        "[MongoRoomRepository] Quarto encontrado:",
        room ? { id: room._id, number: room.number } : null
      );
      return room ? { ...room.toObject(), id: room._id } : null;
    } catch (error) {
      console.error(
        "[MongoRoomRepository] Erro ao buscar quarto por número:",
        error.message
      );
      throw new HttpError(500, "Erro interno do servidor");
    }
  }

  async update(id, data) {
    console.log("[MongoRoomRepository] Tentando atualizar quarto:", {
      id,
      fields: Object.keys(data || {}),
    });
    try {
      const updatedRoom = await RoomModel.findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true,
      });
      if (!updatedRoom) {
        throw new HttpError(404, "Recurso não encontrado");
      }
      console.log("[MongoRoomRepository] Quarto atualizado com sucesso:", {
        id: updatedRoom._id,
        number: updatedRoom.number,
      });
      return { ...updatedRoom.toObject(), id: updatedRoom._id };
    } catch (error) {
      console.error(
        "[MongoRoomRepository] Erro ao atualizar quarto:",
        error.message
      );
      if (error instanceof HttpError) throw error;
      if (error.code === 11000)
        throw new HttpError(409, "Conflito: quarto já existe");
      if (error.name === "ValidationError")
        throw new HttpError(400, "Dados inválidos");
      throw new HttpError(500, "Erro interno do servidor");
    }
  }

  async delete(id) {
    console.log("[MongoRoomRepository] Tentando remover quarto:", id);
    try {
      const deletedRoom = await RoomModel.findByIdAndDelete(id);
      if (!deletedRoom) {
        throw new HttpError(404, "Recurso não encontrado");
      }
      console.log("[MongoRoomRepository] Quarto removido com sucesso:", {
        id: deletedRoom._id,
        number: deletedRoom.number,
      });
      return { ...deletedRoom.toObject(), id: deletedRoom._id };
    } catch (error) {
      console.error(
        "[MongoRoomRepository] Erro ao remover quarto:",
        error.message
      );
      if (error instanceof HttpError) throw error;
      throw new HttpError(500, "Erro interno do servidor");
    }
  }

  async setStatus(id, status) {
    console.log("[MongoRoomRepository] Atualizando status do quarto:", {
      id,
      status,
    });
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        console.error("[MongoRoomRepository] ID inválido:", id);
        throw new HttpError(400, "Dados inválidos");
      }
      const objectId = new mongoose.Types.ObjectId(id);
      console.log(
        "[MongoRoomRepository] ID convertido para ObjectId:",
        objectId
      );

      const updatedRoom = await RoomModel.findByIdAndUpdate(
        objectId,
        { status },
        { new: true, runValidators: true }
      );
      if (!updatedRoom) {
        console.error("[MongoRoomRepository] Quarto não encontrado:", id);
        throw new HttpError(404, "Recurso não encontrado");
      }
      console.log(
        "[MongoRoomRepository] Status do quarto atualizado com sucesso:",
        { id: updatedRoom._id, status: updatedRoom.status }
      );
      return { ...updatedRoom.toObject(), id: updatedRoom._id };
    } catch (error) {
      console.error(
        "[MongoRoomRepository] Erro ao atualizar status do quarto:",
        error.message
      );
      if (error instanceof HttpError) throw error;
      if (error.name === "ValidationError")
        throw new HttpError(400, "Dados inválidos");
      throw new HttpError(500, "Erro interno do servidor");
    }
  }

  async markAsUnderMaintenance(id) {
    try {
      const updated = await RoomModel.findByIdAndUpdate(
        id,
        { status: "maintenance", maintenance: true },
        { new: true, runValidators: true }
      );
      if (!updated) throw new HttpError(404, "Recurso não encontrado");
      return { ...updated.toObject(), id: updated._id };
    } catch (error) {
      if (error instanceof HttpError) throw error;
      if (error.name === "ValidationError")
        throw new HttpError(400, "Dados inválidos");
      throw new HttpError(500, "Erro interno do servidor");
    }
  }

  async markAsAvailable(id) {
    try {
      const updated = await RoomModel.findByIdAndUpdate(
        id,
        { status: "free", maintenance: false },
        { new: true, runValidators: true }
      );
      if (!updated) throw new HttpError(404, "Recurso não encontrado");
      return { ...updated.toObject(), id: updated._id };
    } catch (error) {
      if (error instanceof HttpError) throw error;
      if (error.name === "ValidationError")
        throw new HttpError(400, "Dados inválidos");
      throw new HttpError(500, "Erro interno do servidor");
    }
  }
}
