import http from 'http';

// Start simple HTTP servers that mount given express apps on provided ports.
// Returns an array of servers so tests can close them if needed.
export async function startTestStubs(mapping = {}) {
  const servers = [];
  const start = (port, expressApp) => new Promise((resolve, reject) => {
    if (!expressApp) return resolve(null);
    const server = http.createServer(expressApp);
    server.on('error', (err) => reject(err));
    server.listen(port, '127.0.0.1', () => {
      try { server.unref(); } catch (e) { }
      resolve(server);
    });
  });

  // preferred test ports (unlikely to conflict)
  const ports = {
    user: process.env.TEST_USER_PORT || 3100,
    auth: process.env.TEST_AUTH_PORT || 3101,
    reservation: process.env.TEST_RESERVATION_PORT || 3102,
    payment: process.env.TEST_PAYMENT_PORT || 3103,
    room: process.env.TEST_ROOM_PORT || 3104,
  };

  if (mapping.userApp) {
    const s = await start(ports.user, mapping.userApp);
    if (s) servers.push({ name: 'user', server: s, port: ports.user });
  }
  if (mapping.authApp) {
    const s = await start(ports.auth, mapping.authApp);
    if (s) servers.push({ name: 'auth', server: s, port: ports.auth });
  }
  if (mapping.reservationApp) {
    const s = await start(ports.reservation, mapping.reservationApp);
    if (s) servers.push({ name: 'reservation', server: s, port: ports.reservation });
  }
  if (mapping.paymentApp) {
    const s = await start(ports.payment, mapping.paymentApp);
    if (s) servers.push({ name: 'payment', server: s, port: ports.payment });
  }
  if (mapping.roomApp) {
    const s = await start(ports.room, mapping.roomApp);
    if (s) servers.push({ name: 'room', server: s, port: ports.room });
  }

  return { servers, ports };
}

export async function stopTestStubs(servers = []) {
  for (const { server } of servers) {
    try { server.close(); } catch (e) { }
  }
}
