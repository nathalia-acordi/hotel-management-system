// Ensure a consistent JWT secret and gateway URL in Jest worker processes
process.env.JWT_SECRET = process.env.JWT_SECRET || 'segredo_super_secreto';
process.env.GATEWAY_URL = process.env.GATEWAY_URL || `http://localhost:${process.env.PORT || 3005}`;
