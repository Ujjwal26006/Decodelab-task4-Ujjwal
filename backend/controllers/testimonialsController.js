'use strict';

const { getAllTestimonials, createTestimonial, updateTestimonial, deleteTestimonial } = require('../services/testimonialService');
const { sendSuccess, sendError } = require('../utils/response');

async function getAllTestimonialsHandler(req, res, next) {
  try {
    const testimonials = await getAllTestimonials();
    sendSuccess(res, 200, 'Testimonials retrieved successfully', testimonials);
  } catch (err) { next(err); }
}

async function createTestimonialHandler(req, res, next) {
  try {
    const testimonial = await createTestimonial(req.body);
    sendSuccess(res, 201, 'Testimonial created successfully', testimonial);
  } catch (err) { next(err); }
}

async function updateTestimonialHandler(req, res, next) {
  try {
    const testimonial = await updateTestimonial(req.params.id, req.body);
    if (!testimonial) return sendError(res, 404, `Testimonial with id '${req.params.id}' was not found.`);
    sendSuccess(res, 200, 'Testimonial updated successfully', testimonial);
  } catch (err) { next(err); }
}

async function deleteTestimonialHandler(req, res, next) {
  try {
    const testimonial = await deleteTestimonial(req.params.id);
    if (!testimonial) return sendError(res, 404, `Testimonial with id '${req.params.id}' was not found.`);
    sendSuccess(res, 200, 'Testimonial deleted successfully', null);
  } catch (err) { next(err); }
}

module.exports = { getAllTestimonialsHandler, createTestimonialHandler, updateTestimonialHandler, deleteTestimonialHandler };
