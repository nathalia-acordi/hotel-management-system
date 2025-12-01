import fs from 'fs';
import path from 'path';

export default async function globalTeardown() {
  const pidFile = path.join(process.cwd(), '.gateway_test_server.pid');
  try {
    if (fs.existsSync(pidFile)) {
      const pid = parseInt(fs.readFileSync(pidFile, 'utf8'), 10);
      try { process.kill(pid); } catch (e) { /* ignore */ }
      try { fs.unlinkSync(pidFile); } catch (e) { }
    }
  } catch (e) {
    // best-effort
  }
}
