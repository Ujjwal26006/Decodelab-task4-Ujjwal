'use strict';

const { Router } = require('express');
const { initiatePaymentHandler, verifyPaymentHandler } = require('../controllers/paymentController');
const { authenticate } = require('../middleware/authenticate');

const router = Router();

// Requirement: only authenticated students can purchase courses.
router.get('/initiate/:courseId', authenticate, initiatePaymentHandler);
router.post('/verify',             authenticate, verifyPaymentHandler);

module.exports = router;
