'use strict';

const { Router } = require('express');
const { subscribeHandler } = require('../controllers/newsletterController');

const router = Router();

router.post('/', subscribeHandler);

module.exports = router;
