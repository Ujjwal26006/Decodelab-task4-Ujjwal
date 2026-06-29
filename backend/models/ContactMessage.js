'use strict';

const mongoose = require('mongoose');
const validator = require('validator');

const contactMessageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required.'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters.'],
      maxlength: [50, 'Name must not exceed 50 characters.'],
    },
    email: {
      type: String,
      required: [true, 'Email address is required.'],
      lowercase: true,
      trim: true,
      validate: {
        validator: (v) => validator.isEmail(v),
        message: 'Please provide a valid email address.',
      },
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required.'],
      trim: true,
      validate: {
        validator: (v) => /^\d{10,15}$/.test(v.replace(/[\s\-+()]/g, '')),
        message: 'Phone number must contain 10–15 digits.',
      },
    },
    message: {
      type: String,
      required: [true, 'Message is required.'],
      trim: true,
      minlength: [10, 'Message must be at least 10 characters.'],
      maxlength: [1000, 'Message must not exceed 1000 characters.'],
    },
  },
  {
    timestamps: true, // createdAt = submission time
    versionKey: false,
  }
);

contactMessageSchema.index({ email: 1 });
contactMessageSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ContactMessage', contactMessageSchema);
