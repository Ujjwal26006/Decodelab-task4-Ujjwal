'use strict';

const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema(
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

    // ── Payment linkage ────────────────────────────────────────────────────
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      required: [true, 'Payment reference is required.'],
    },
    amount: {
      type: Number,
      required: [true, 'Enrollment amount is required.'],
      min: [0, 'Amount cannot be negative.'],
    },

    // ── Status ───────────────────────────────────────────────────────────
    // 'active'    = paid and currently has course access
    // 'refunded'  = payment was refunded, access revoked
    // 'cancelled' = enrollment cancelled by student/admin, access revoked
    status: {
      type: String,
      enum: {
        values: ['active', 'refunded', 'cancelled'],
        message: 'Status must be one of: active, refunded, cancelled.',
      },
      default: 'active',
    },

    enrolledAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Prevent a student from enrolling in the same course twice
enrollmentSchema.index({ studentId: 1, courseId: 1 }, { unique: true });
enrollmentSchema.index({ studentEmail: 1, courseId: 1 });
enrollmentSchema.index({ status: 1 });

module.exports = mongoose.model('Enrollment', enrollmentSchema);
