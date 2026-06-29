'use strict';
const { Router } = require('express');
const { registerHandler, loginHandler, logoutHandler, getMeHandler } = require('../controllers/authController');
const { authenticate } = require('../middleware/authenticate');
const router = Router();

router.post('/register', registerHandler);
router.post('/login',    loginHandler);
router.post('/logout',   authenticate, logoutHandler);
router.get('/me',        authenticate, getMeHandler);

module.exports = router;
