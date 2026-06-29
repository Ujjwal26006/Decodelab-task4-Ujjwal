'use strict';

const { Router } = require('express');
const { getAllEnrollmentsHandler } = require('../controllers/enrollmentsController');
const { authenticate } = require('../middleware/authenticate');

const router = Router();

// Enrollment request/approval workflow has been removed.
// Enrollments are now created exclusively via POST /api/payments/verify
// after a successful payment (see routes/payments.js).
router.get('/', authenticate, getAllEnrollmentsHandler);

module.exports = router;
