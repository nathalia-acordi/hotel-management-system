(async ()=>{
  try {
    const mod = await import('/app/src/monitoring/metrics.js');
    console.log('exports keys:', Object.keys(mod));
    console.log('attachMetrics type:', typeof mod.attachMetrics);
    if (mod.attachMetrics) console.log('attachMetrics.toString():', mod.attachMetrics.toString().slice(0,400));
  } catch (e) {
    console.error('ERR', e && e.stack ? e.stack : e);
    process.exit(1);
  }
})();
