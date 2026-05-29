const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');
const { getProfile, updateProfile } = require('../controllers/authController');


router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authMiddleware(), authController.getUser);

router.get('/profile', authMiddleware(), getProfile);
router.put('/profile', authMiddleware(), updateProfile);

module.exports = router;