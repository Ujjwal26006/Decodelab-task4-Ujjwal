'use strict';

const mongoose = require('mongoose');

const moduleSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course reference is required.'],
    },
    title: {
      type: String,
      required: [true, 'Module title is required.'],
      trim: true,
      minlength: [2, 'Title must be at least 2 characters.'],
      maxlength: [100, 'Title must not exceed 100 characters.'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    order: {
      type: Number,
      required: [true, 'Module order is required.'],
      min: [1, 'Order must be at least 1.'],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

moduleSchema.index({ courseId: 1, order: 1 });

module.exports = mongoose.model('Module', moduleSchema);
