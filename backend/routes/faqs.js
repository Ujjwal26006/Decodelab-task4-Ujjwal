'use strict';

const { Router } = require('express');
const {
  getAllFaqsHandler,
  createFaqHandler,
  updateFaqHandler,
  deleteFaqHandler,
} = require('../controllers/faqsController');

const router = Router();

router.get('/', getAllFaqsHandler);
router.post('/', createFaqHandler);
router.put('/:id', updateFaqHandler);
router.delete('/:id', deleteFaqHandler);

module.exports = router;
