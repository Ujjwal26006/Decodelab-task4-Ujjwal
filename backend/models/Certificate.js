'use strict';

const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema(
  {
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
    certificateNumber: {
      type: String,
      required: [true, 'Certificate number is required.'],
      unique: true,
      trim: true,
    },
    issuedAt: {
      type: Date,
      default: Date.now,
    },
    // Snapshot fields — avoids re-populating on certificate display
    studentName: { type: String, trim: true },
    courseTitle:  { type: String, trim: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// A student earns at most one certificate per course
certificateSchema.index({ studentId: 1, courseId: 1 }, { unique: true });
certificateSchema.index({ certificateNumber: 1 }, { unique: true });

module.exports = mongoose.model('Certificate', certificateSchema);
