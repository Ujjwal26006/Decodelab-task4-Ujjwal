'use strict';

const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Reviewer name is required.'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters.'],
      maxlength: [50, 'Name must not exceed 50 characters.'],
    },
    course: {
      type: String,
      required: [true, 'Course name is required.'],
      trim: true,
    },
    review: {
      type: String,
      required: [true, 'Review text is required.'],
      trim: true,
      minlength: [10, 'Review must be at least 10 characters.'],
      maxlength: [1000, 'Review must not exceed 1000 characters.'],
    },
    avatar: {
      type: String,
      required: [true, 'Avatar initials are required.'],
      trim: true,
      maxlength: [3, 'Avatar must not exceed 3 characters.'],
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required.'],
      min: [1, 'Rating must be at least 1.'],
      max: [5, 'Rating must not exceed 5.'],
      default: 5,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model('Testimonial', testimonialSchema);
