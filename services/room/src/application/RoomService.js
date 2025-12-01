import { HttpError } from "./HttpError.js";

export class RoomService {
  constructor(roomRepository) {
    this.roomRepository = roomRepository;
  }

  async createRoom(room) {
    console.log("[RoomService] Tentando criar quarto:", room);
    if (
      room.number == null ||
      room.type == null ||
      room.price == null ||
      room.capacity == null
    ) {
      console.error("[RoomService] Dados do quarto incompletos:", room);
      throw new HttpError(400, "Dados do quarto incompletos");
    }

    if (
      typeof room.number !== "number" ||
      room.number <= 0 ||
      !Number.isInteger(room.number)
    ) {
      console.error("[RoomService] Número de quarto inválido:", room.number);
      throw new HttpError(400, "Número de quarto inválido");
    }

    if (typeof room.price !== "number" || room.price < 0) {
      console.error("[RoomService] Preço inválido:", room.price);
      throw new HttpError(400, "Preço inválido");
    }

    const validTypes = ["standard", "deluxe", "suite"];
    if (!validTypes.includes(room.type)) {
      console.error("[RoomService] Tipo de quarto inválido:", room.type);
      throw new HttpError(400, "Tipo de quarto inválido");
    }

    try {
      const existingRoom = await this.roomRepository.findByNumber(room.number);
      if (existingRoom) {
        console.error(
          "[RoomService] Número de quarto já cadastrado:",
          room.number
        );
        throw new HttpError(409, "Número de quarto já cadastrado");
      }
      const createdRoom = await this.roomRepository.create(room);
      console.log("[RoomService] Quarto criado com sucesso:", createdRoom);
      return createdRoom;
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }
      if (
        error?.code === 11000 ||
        /E?11000|duplicate key/i.test(error?.message || "")
      ) {
        throw new HttpError(409, "Número de quarto já cadastrado");
      }
      console.error("[RoomService] Erro ao criar quarto:", error.message);
      throw new HttpError(500, `Erro ao criar quarto: ${error.message}`);
    }
  }

  async listRooms() {
    console.log("[RoomService] Listando todos os quartos");
    try {
      const rooms = await this.roomRepository.findAll();
      console.log("[RoomService] Quartos encontrados:", rooms);
      return rooms;
    } catch (error) {
      console.error("[RoomService] Erro ao listar quartos:", error.message);
      throw new Error(`Erro ao listar quartos: ${error.message}`);
    }
  }

  async updateRoom(id, data) {
    console.log("[RoomService] Tentando atualizar quarto:", { id, data });
    const validTypes = ["standard", "deluxe", "suite"];
    if (data.type && !validTypes.includes(data.type)) {
      console.error("[RoomService] Tipo de quarto inválido:", data.type);
      throw new Error("Tipo de quarto inválido");
    }

    if (
      data.number &&
      (typeof data.number !== "number" ||
        data.number <= 0 ||
        !Number.isInteger(data.number))
    ) {
      console.error("[RoomService] Número de quarto inválido:", data.number);
      throw new Error("Número de quarto inválido");
    }

    if (
      data.price != null &&
      (typeof data.price !== "number" || data.price < 0)
    ) {
      console.error("[RoomService] Preço inválido:", data.price);
      throw new Error("Preço inválido");
    }

    try {
      const updatedRoom = await this.roomRepository.update(id, data);
      if (!updatedRoom) {
        console.error(
          "[RoomService] Quarto não encontrado para atualização:",
          id
        );
        throw new HttpError(404, "Quarto não encontrado");
      }
      console.log("[RoomService] Quarto atualizado com sucesso:", updatedRoom);
      return updatedRoom;
    } catch (error) {
      if (error?.code === 11000)
        throw new HttpError(409, "Número de quarto já cadastrado");
      console.error("[RoomService] Erro ao atualizar quarto:", error.message);
      throw error instanceof HttpError
        ? error
        : new HttpError(500, `Erro ao atualizar quarto: ${error.message}`);
    }
  }

  async deleteRoom(id) {
    console.log("[RoomService] Tentando remover quarto:", id);
    try {
      const deletedRoom = await this.roomRepository.delete(id);
      if (!deletedRoom) {
        console.error("[RoomService] Quarto não encontrado para remoção:", id);
        throw new HttpError(404, "Quarto não encontrado");
      }
      console.log("[RoomService] Quarto removido com sucesso:", deletedRoom);
      return deletedRoom;
    } catch (error) {
      console.error("[RoomService] Erro ao remover quarto:", error.message);
      throw error instanceof HttpError
        ? error
        : new HttpError(500, `Erro ao remover quarto: ${error.message}`);
    }
  }

  async updateRoomStatus(id, status) {
    console.log("[RoomService] Atualizando status do quarto:", { id, status });
    const validStatuses = ["free", "occupied", "maintenance"];
    if (!validStatuses.includes(status)) {
      console.error("[RoomService] Status inválido:", status);
      throw new HttpError(400, "Status inválido");
    }

    try {
      console.log(
        "[RoomService] Chamando setStatus no repositório com ID:",
        id
      );
      const updatedRoom = await this.roomRepository.setStatus(id, status);
      if (!updatedRoom) {
        console.error(
          "[RoomService] Quarto não encontrado para atualização de status:",
          id
        );
        throw new HttpError(404, "Quarto não encontrado");
      }
      console.log(
        "[RoomService] Status do quarto atualizado com sucesso:",
        updatedRoom
      );
      return updatedRoom;
    } catch (error) {
      if (error.message.includes("Quarto não encontrado"))
        throw new HttpError(404, error.message);
      if (error.message.includes("ValidationError"))
        throw new HttpError(400, error.message);
      console.error(
        "[RoomService] Erro ao atualizar status do quarto:",
        error.message
      );
      throw new HttpError(
        500,
        `Erro ao atualizar status do quarto: ${error.message}`
      );
    }
  }

  async setRoomUnderMaintenance(id) {
    console.log("[RoomService] Marcando quarto como em manutenção:", id);
    return this.updateRoomStatus(id, "maintenance");
  }

  async setRoomAvailable(id) {
    console.log("[RoomService] Marcando quarto como disponível:", id);
    return this.updateRoomStatus(id, "free");
  }
}
