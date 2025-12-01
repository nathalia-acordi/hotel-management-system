// uses global fetch available in Node 18+
(async () => {
  const base = 'http://127.0.0.1:3005';
  const username = `integ_test_${Date.now()}`;
  try {
    console.log('POST /register', { username });
    const reg = await fetch(`${base}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password: '123456', role: 'receptionist' })
    });
    console.log('register status', reg.status);
    console.log('register body:', await reg.text());

    console.log('POST /login', { username });
    const login = await fetch(`${base}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: username, password: '123456' })
    });
    console.log('login status', login.status);
    console.log('login body:', await login.text());
  } catch (err) {
    console.error('request error', err);
  }
})();
