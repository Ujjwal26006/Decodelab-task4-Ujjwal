'use strict';

const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Course title is required.'],
      trim: true,
      minlength: [3, 'Course title must be at least 3 characters.'],
      maxlength: [100, 'Course title must not exceed 100 characters.'],
    },
    slug: {
      type: String,
      required: [true, 'Course slug is required.'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Course description is required.'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters.'],
      maxlength: [1000, 'Description must not exceed 1000 characters.'],
    },
    duration: {
      type: String,
      required: [true, 'Course duration is required.'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Course price is required.'],
      min: [0, 'Price cannot be negative.'],
    },
    category: {
      type: String,
      required: [true, 'Course category is required.'],
      trim: true,
      enum: {
        values: ['Development', 'Data', 'Programming', 'Design', 'AI'],
        message: 'Category must be one of: Development, Data, Programming, Design, AI.',
      },
    },
    level: {
      type: String,
      required: [true, 'Course level is required.'],
      trim: true,
    },
    instructorName: {
      type: String,
      trim: true,
      default: 'SkillForge Faculty',
    },
    image: {
      type: String,
      default: 'assets/course-default.svg',
      trim: true,
    },
    topics: {
      type: [String],
      default: [],
    },
    seats: {
      type: Number,
      default: 30,
      min: [1, 'Seats must be at least 1.'],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

courseSchema.index({ slug: 1 }, { unique: true });
courseSchema.index({ category: 1 });

module.exports = mongoose.model('Course', courseSchema);
