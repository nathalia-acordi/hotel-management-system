(async ()=>{
  try {
    const mod = await import('/app/src/index.js');
    const app = mod.default;
    const routes = (app._router && app._router.stack) ? app._router.stack.map(l=>{
      if (l.route) return { path: l.route.path, methods: l.route.methods };
      if (l.name === 'router') return { name: 'router' };
      return { name: l.name };
    }) : [];
    console.log(JSON.stringify(routes, null, 2));
  } catch (e) {
    console.error('ERR', e && e.stack ? e.stack : e);
    process.exit(1);
  }
})();
