'use strict';

const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    // ── Relationships ────────────────────────────────────────────────────
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student reference is required.'],
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course reference is required.'],
    },

    // ── Denormalised snapshot (avoids populate cost on every read) ───────
    studentName: {
      type: String,
      trim: true,
    },
    studentEmail: {
      type: String,
      lowercase: true,
      trim: true,
    },
    courseTitle: {
      type: String,
      trim: true,
    },

    // ── Amount ───────────────────────────────────────────────────────────
    amount: {
      type: Number,
      required: [true, 'Payment amount is required.'],
      min: [0, 'Amount cannot be negative.'],
    },

    // ── Payment method & gateway details ───────────────────────────────────
    paymentMethod: {
      type: String,
      required: [true, 'Payment method is required.'],
      enum: {
        values: ['upi', 'card', 'netbanking', 'wallet'],
        message: 'Payment method must be one of: upi, card, netbanking, wallet.',
      },
    },
    transactionId: {
      type: String,
      required: [true, 'Transaction id is required.'],
      trim: true,
      unique: true,
    },

    // ── Status ───────────────────────────────────────────────────────────
    paymentStatus: {
      type: String,
      enum: {
        values: ['pending', 'success', 'failed'],
        message: 'Payment status must be one of: pending, success, failed.',
      },
      default: 'pending',
    },

    paidAt: {
      type: Date,
    },

    // ── Gateway metadata (kept generic so a real gateway can slot in later) ─
    gateway: {
      type: String,
      default: 'dummy', // will become 'razorpay' etc. when a real gateway is wired in
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

paymentSchema.index({ studentId: 1, courseId: 1 });
paymentSchema.index({ paymentStatus: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
