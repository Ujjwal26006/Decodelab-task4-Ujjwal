'use strict';

const mongoose = require('mongoose');
const validator = require('validator');

const subscriberSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email address is required.'],
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: (v) => validator.isEmail(v),
        message: 'Please provide a valid email address.',
      },
    },
  },
  {
    timestamps: true, // subscribedAt = createdAt
    versionKey: false,
  }
);

// Unique index enforces duplicate prevention at DB level
subscriberSchema.index({ email: 1 }, { unique: true });

module.exports = mongoose.model('Subscriber', subscriberSchema);
