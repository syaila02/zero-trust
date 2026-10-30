const jwt = require('jsonwebtoken');
const { users } = require('../data/db');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config');

/**
 * Controller Otentikasi Sintesys
 * Mengeluarkan Short-Lived Token (AccessToken berdurasi singkat)
 */
function login(req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      status: 'ERROR',
      message: 'Username dan password wajib disertakan.'
    });
  }

  const user = users.find(u => u.username === username && u.password === password);

  if (!user) {
    return res.status(401).json({
      status: 'DENY',
      message: 'Kredensial tidak valid. Otentikasi gagal.'
    });
  }

  // Payload Token memuat subjek, peran, dan batasan hak kepemilikan kelas/kursus
  const payload = {
    id: user.id,
    sub: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    assignedCourses: user.assignedCourses || [],
    enrolledCourses: user.enrolledCourses || []
  };

  // Terbitkan Short-Lived Token (5 Menit)
  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });

  return res.json({
    status: 'SUCCESS',
    message: 'Otentikasi berhasil. Short-Lived Token diterbitkan.',
    tokenType: 'Bearer',
    expiresIn: JWT_EXPIRES_IN,
    accessToken: token,
    userInfo: {
      id: user.id,
      name: user.name,
      role: user.role,
      assignedCourses: user.assignedCourses || []
    }
  });
}

/**
 * Helper endpoint khusus praktikum: membuat token kedaluwarsa secara instan
 * untuk mendemonstrasikan pengujian kegagalan masa berlaku token pada Zero Trust PEP.
 */
function generateExpiredToken(req, res) {
  const expiredPayload = {
    sub: 'DOSEN001',
    username: 'dosen_budi',
    role: 'DOSEN',
    assignedCourses: ['IF301']
  };

  // Dibuat dengan exp masa lalu (-60 detik yang lalu)
  const expiredToken = jwt.sign(expiredPayload, JWT_SECRET, { expiresIn: '-1s' });

  return res.json({
    status: 'SUCCESS',
    message: 'Token kedaluwarsa berhasil dibuat untuk simulasi testing Postman.',
    expiredToken
  });
}

module.exports = {
  login,
  generateExpiredToken
};
