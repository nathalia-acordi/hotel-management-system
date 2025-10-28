import jwt from 'jsonwebtoken';

export function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ erro: 'Não autenticado' });
  }

  const token = authHeader.split(' ')[1];
  try {
    // Não usar getSecret/readFromFile - usar direto a var de ambiente
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('[AUTH] JWT_SECRET não configurado');
      return res.status(500).json({ erro: 'Erro interno de configuração' });
    }

    // Não logar o token nem o payload completo
    const decoded = jwt.verify(token, secret);
    
    // Log sanitizado apenas com campos não sensíveis
    console.log('[AUTH] Token válido para usuário:', decoded.username, 'role:', decoded.role);
    
    req.user = {
      id: decoded.id,
      role: decoded.role,
      username: decoded.username
    };
    next();
  } catch (err) {
    // Log sanitizado do erro
    console.error('[AUTH] Erro na validação do token:', err.name);
    return res.status(403).json({ erro: 'Não autorizado' });
  }
}

export function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ erro: 'Não autenticado' });
    }
    
    if (!roles.includes(req.user.role)) {
      console.log('[AUTH] Acesso negado para role:', req.user.role);
      return res.status(403).json({ erro: 'Sem permissão para este recurso' });
    }
    
    next();
  };
}