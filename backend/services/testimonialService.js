'use strict';

const Testimonial = require('../models/Testimonial');

async function getAllTestimonials() {
  return Testimonial.find().sort({ createdAt: 1 }).lean();
}

async function createTestimonial(data) {
  const testimonial = new Testimonial(data);
  return testimonial.save();
}

async function updateTestimonial(id, data) {
  return Testimonial.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true, runValidators: true }
  ).lean();
}

async function deleteTestimonial(id) {
  return Testimonial.findByIdAndDelete(id).lean();
}

module.exports = { getAllTestimonials, createTestimonial, updateTestimonial, deleteTestimonial };
