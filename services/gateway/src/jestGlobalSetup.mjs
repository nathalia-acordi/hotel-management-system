import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import http from 'http';

const root = process.cwd();
const script = path.join(root, 'src', 'runGatewayServer.mjs');

export default async function globalSetup() {
  // Spawn a detached Node process to run the gateway server.
  const nodeArgs = [script];
  const child = spawn(process.execPath, nodeArgs, {
    cwd: root,
    detached: true,
    stdio: 'ignore',
    // propagate the parent's environment (including JWT_SECRET, PORT, etc.)
    env: { ...process.env }
  });
  // Detach and let it run independently
  child.unref();

  const pidFile = path.join(root, '.gateway_test_server.pid');
  fs.writeFileSync(pidFile, String(child.pid), 'utf8');

  // Wait until the gateway server is responsive before returning. This
  // prevents tests from attempting axios requests before the server is ready.
  const url = `http://localhost:${process.env.PORT || 3005}/health`;
  const deadline = Date.now() + 8000;
  async function waitForReady() {
    while (Date.now() < deadline) {
      try {
        await new Promise((resolve, reject) => {
          const req = http.get(url, (res) => {
            res.resume();
            resolve();
          });
          req.on('error', reject);
          req.setTimeout(2000, () => {
            req.destroy(new Error('timeout'));
          });
        });
        return;
      } catch (e) {
        await new Promise(r => setTimeout(r, 200));
      }
    }
    // If not ready after timeout, continue anyway; tests may still fail but
    // we don't block indefinitely.
  }

  await waitForReady();
}
