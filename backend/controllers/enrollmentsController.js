'use strict';

const { getAllEnrollments } = require('../services/enrollmentService');
const { sendSuccess } = require('../utils/response');

/**
 * Read-only enrollment history. Enrollments are now created exclusively
 * via the payment flow (see controllers/paymentController.js).
 */
async function getAllEnrollmentsHandler(req, res, next) {
  try {
    const enrollments = await getAllEnrollments();
    sendSuccess(res, 200, 'Enrollments retrieved successfully', enrollments);
  } catch (err) { next(err); }
}

module.exports = { getAllEnrollmentsHandler };
