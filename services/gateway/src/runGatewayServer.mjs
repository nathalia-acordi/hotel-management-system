import './index.js';

// Keep the process alive until explicitly killed by globalTeardown
setInterval(() => {}, 1 << 30);
