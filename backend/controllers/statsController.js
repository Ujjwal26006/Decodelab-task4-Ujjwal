'use strict';

const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Testimonial = require('../models/Testimonial');
const { sendSuccess } = require('../utils/response');

async function getStats(req, res, next) {
  try {
    const [courses, enrollments] = await Promise.all([
      Course.countDocuments(),
      Enrollment.countDocuments({ status: 'active' }),
    ]);
    sendSuccess(res, 200, 'Statistics retrieved successfully', {
      students: enrollments,
      courses,
      mentors: 104,
      successRate: 98,
    });
  } catch (err) { next(err); }
}

module.exports = { getStats };
