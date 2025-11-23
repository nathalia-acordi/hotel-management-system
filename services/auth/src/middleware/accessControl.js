











import { hasPermission } from '../domain/permissions.js';
import { verify } from '../infrastructure/tokenAdapter.js';


export function accessControl(action) {
  return (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(403).json({ erro: 'Acesso negado: token não fornecido' });
      }

      const token = authHeader.split(' ')[1];
      const decoded = verify(token);
      const userRole = decoded.role;

      if (!userRole) {
        return res.status(403).json({ erro: 'Acesso negado: papel não encontrado' });
      }

      if (!hasPermission(userRole, action)) {
        return res.status(403).json({ erro: 'Acesso negado: permissão insuficiente' });
      }

      next();
    } catch (err) {
      console.error('[ACCESS CONTROL] Erro ao verificar permissões:', err.message);
      return res.status(500).json({ erro: 'Erro interno ao verificar permissões' });
    }
  };
}