module.exports = {
  PORT: process.env.PORT || 3000,
  JWT_SECRET: process.env.JWT_SECRET || 'sintesys-super-secret-zero-trust-key-2026',
  // Short-Lived Token: Masa berlaku 5 menit (300 detik) sesuai prinsip Zero Trust
  JWT_EXPIRES_IN: '5m'
};
