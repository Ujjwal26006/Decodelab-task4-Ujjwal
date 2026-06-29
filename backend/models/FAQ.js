'use strict';

const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: [true, 'Question is required.'],
      trim: true,
      minlength: [5, 'Question must be at least 5 characters.'],
      maxlength: [300, 'Question must not exceed 300 characters.'],
    },
    answer: {
      type: String,
      required: [true, 'Answer is required.'],
      trim: true,
      minlength: [5, 'Answer must be at least 5 characters.'],
      maxlength: [2000, 'Answer must not exceed 2000 characters.'],
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Return FAQs in display order by default
faqSchema.index({ order: 1 });

module.exports = mongoose.model('FAQ', faqSchema);
