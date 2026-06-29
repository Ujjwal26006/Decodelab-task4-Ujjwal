'use strict';

const { Router } = require('express');
const {
  getAllTestimonialsHandler,
  createTestimonialHandler,
  updateTestimonialHandler,
  deleteTestimonialHandler,
} = require('../controllers/testimonialsController');

const router = Router();

router.get('/', getAllTestimonialsHandler);
router.post('/', createTestimonialHandler);
router.put('/:id', updateTestimonialHandler);
router.delete('/:id', deleteTestimonialHandler);

module.exports = router;
