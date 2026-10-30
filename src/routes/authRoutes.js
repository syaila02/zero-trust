const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Endpoint Login (Menerbitkan Short-Lived Access Token)
router.post('/login', authController.login);

// Endpoint Mock Helper untuk pengujian Postman (Menghasilkan token kedaluwarsa)
router.get('/mock-expired-token', authController.generateExpiredToken);

module.exports = router;
