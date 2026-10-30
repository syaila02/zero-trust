const app = require('./src/app');
const { PORT } = require('./src/config');

app.listen(PORT, () => {
  console.log('================================================================');
  console.log('🔒 SINTESYS - ZERO TRUST BACKEND SIMULATION (NIST SP 800-207)');
  console.log(`🚀 Server aktif dan mendengarkan di: http://localhost:${PORT}`);
  console.log('🛡️  PEP (Policy Enforcement Point): Active');
  console.log('🧠 PDP (Policy Decision Point): Active');
  console.log('================================================================\n');
});
