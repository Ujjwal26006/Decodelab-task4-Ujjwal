'use strict';

const Enrollment = require('../models/Enrollment');

/**
 * Returns all enrollments populated with student and course references.
 * Read-only — enrollments are now created exclusively by paymentService
 * after a successful payment (see services/paymentService.js).
 * @returns {Promise<Array>}
 */
async function getAllEnrollments() {
  return Enrollment.find()
    .populate('studentId', 'fullName email phone')
    .populate('courseId', 'title category price')
    .sort({ createdAt: -1 })
    .lean();
}

module.exports = { getAllEnrollments };
