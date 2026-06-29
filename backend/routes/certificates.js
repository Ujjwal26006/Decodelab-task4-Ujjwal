'use strict';
const { Router } = require('express');
const { getMyCertificatesHandler, verifyCertificateHandler } = require('../controllers/certificateController');
const { authenticate } = require('../middleware/authenticate');
const router = Router();

router.get('/',                      authenticate, getMyCertificatesHandler);
router.get('/verify/:certNumber',    verifyCertificateHandler);

module.exports = router;
