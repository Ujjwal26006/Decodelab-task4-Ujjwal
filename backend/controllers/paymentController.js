'use strict';

const { getPaymentSummary, verifyAndEnroll } = require('../services/paymentService');
const { sanitizeObject } = require('../utils/sanitizer');
const { validatePayment } = require('../validators/inputValidators');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * GET /api/payments/initiate/:courseId
 * Returns course + pricing summary to render on the payment page.
 * Requires authentication — the student is taken from req.student, never
 * from the request body, so a payment can only ever be initiated for the
 * logged-in account.
 */
async function initiatePaymentHandler(req, res, next) {
  try {
    const { courseId } = req.params;
    const summary = await getPaymentSummary(req.student._id, courseId);
    sendSuccess(res, 200, 'Payment summary retrieved successfully.', summary);
  } catch (err) {
    if (err.statusCode) return sendError(res, err.statusCode, err.message);
    next(err);
  }
}

/**
 * POST /api/payments/verify
 * Body: { courseId, paymentMethod }
 * Charges the (dummy) gateway, records the Payment, and on success
 * auto-enrolls the authenticated student in the course.
 */
async function verifyPaymentHandler(req, res, next) {
  try {
    const sanitized = sanitizeObject(req.body);
    const { valid, errors } = validatePayment(sanitized);
    if (!valid) return sendError(res, 400, 'Validation failed', errors);

    const { payment, enrollment } = await verifyAndEnroll(req.student._id, sanitized);

    sendSuccess(res, 201, `Payment successful. You are now enrolled in "${enrollment.courseTitle}".`, {
      paymentId: payment._id,
      transactionId: payment.transactionId,
      amount: payment.amount,
      enrollmentId: enrollment._id,
      courseId: enrollment.courseId,
      courseTitle: enrollment.courseTitle,
      enrolledAt: enrollment.enrolledAt,
      status: enrollment.status,
    });
  } catch (err) {
    if (err.statusCode) return sendError(res, err.statusCode, err.message);
    next(err);
  }
}

module.exports = { initiatePaymentHandler, verifyPaymentHandler };
