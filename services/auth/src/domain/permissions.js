export const permissions = {
  autoCadastro: ["guest"],
  cadastrarHospede: ["admin", "receptionist"],
  gerenciarReservas: ["receptionist"],
  gerenciarQuartos: ["admin", "receptionist"],
  consultarRelatorios: ["admin", "receptionist"],
  efetuarPagamento: ["admin", "receptionist"],
  checkInOut: ["admin", "receptionist"],
  cancelarReserva: ["receptionist"],
};

export function hasPermission(role, action) {
  if (typeof role !== "string" || typeof action !== "string") {
    throw new Error("Os parâmetros role e action devem ser strings");
  }

  const allowedRoles = permissions[action];

  if (!allowedRoles) {
    throw new Error(`Ação desconhecida: ${action}`);
  }

  return allowedRoles.includes(role);
}
