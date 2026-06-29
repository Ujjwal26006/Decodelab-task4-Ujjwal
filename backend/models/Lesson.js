'use strict';

const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course reference is required.'],
    },
    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Module',
      required: [true, 'Module reference is required.'],
    },
    title: {
      type: String,
      required: [true, 'Lesson title is required.'],
      trim: true,
      minlength: [2, 'Title must be at least 2 characters.'],
      maxlength: [150, 'Title must not exceed 150 characters.'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [1000, 'Description must not exceed 1000 characters.'],
    },
    duration: {
      type: String,
      trim: true,
      default: '5 min',
    },
    order: {
      type: Number,
      required: [true, 'Lesson order is required.'],
      min: [1, 'Order must be at least 1.'],
    },
    type: {
      type: String,
      enum: {
        values: ['video', 'reading', 'quiz', 'project'],
        message: 'Type must be one of: video, reading, quiz, project.',
      },
      default: 'video',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

lessonSchema.index({ courseId: 1, moduleId: 1, order: 1 });
lessonSchema.index({ courseId: 1 });

module.exports = mongoose.model('Lesson', lessonSchema);
