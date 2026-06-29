'use strict';

const crypto = require('crypto');

const Student    = require('../models/Student');
const Course      = require('../models/Course');
const Payment     = require('../models/Payment');
const Enrollment  = require('../models/Enrollment');

/**
 * Builds the payment summary shown on the payment page before checkout.
 * Identity comes from the authenticated student (JWT), never from request body.
 *
 * @param {string} studentId - req.student._id (already authenticated)
 * @param {string} courseId
 * @returns {Promise<Object>} course + pricing summary for the payment page
 */
async function getPaymentSummary(studentId, courseId) {
  const course = await Course.findById(courseId).lean();
  if (!course) {
    const err = new Error(`Course with id '${courseId}' was not found.`);
    err.statusCode = 404;
    throw err;
  }

  // Block re-purchase if the student already has an active enrollment.
  const existingActive = await Enrollment.findOne({
    studentId,
    courseId,
    status: 'active',
  }).lean();

  if (existingActive) {
    const err = new Error('You are already enrolled in this course.');
    err.statusCode = 409;
    throw err;
  }

  // No discount system exists yet — final amount equals listed price.
  // discountAmount is included so the frontend has a stable shape to render
  // against once discounts are introduced, without another contract change.
  const discountAmount = 0;
  const finalAmount = Math.max(course.price - discountAmount, 0);

  return {
    courseId: course._id,
    courseTitle: course.title,
    courseImage: course.image,
    instructorName: course.instructorName,
    price: course.price,
    discountAmount,
    finalAmount,
    availablePaymentMethods: ['upi', 'card', 'netbanking', 'wallet'],
  };
}

/**
 * Generates a dummy transaction id. Swap this out for a real gateway's
 * order/payment id once Razorpay (or similar) is wired in.
 * @returns {string}
 */
function generateDummyTransactionId() {
  return `DUMMY-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

/**
 * Simulates charging a payment method. Always succeeds in dev mode.
 * Kept as its own function so a real gateway call can replace just this
 * piece later without touching the enrollment logic below.
 *
 * @param {Object} params - { amount, paymentMethod }
 * @returns {Promise<{ success: boolean, transactionId: string }>}
 */
async function chargeDummyGateway({ amount, paymentMethod }) {
  if (amount < 0) {
    return { success: false, transactionId: null };
  }
  return { success: true, transactionId: generateDummyTransactionId() };
}

/**
 * Full payment + auto-enrollment flow.
 *  1. Re-validates the course and price server-side (never trusts client amount)
 *  2. Re-checks for an existing active enrollment (race-safety alongside the
 *     unique index on Enrollment)
 *  3. Records the Payment
 *  4. On success, creates the Enrollment and pushes the course onto the
 *     student's enrolledCourses[] using a real Mongoose document — this is
 *     the fix for the earlier .lean()-object .save() bug, since the student
 *     is always fetched fresh as a full document here, not via a lean() helper
 *
 * @param {string} studentId - req.student._id (already authenticated)
 * @param {Object} data - { courseId, paymentMethod }
 * @returns {Promise<{ payment: Object, enrollment: Object|null }>}
 */
async function verifyAndEnroll(studentId, data) {
  const { courseId, paymentMethod } = data;

  const course = await Course.findById(courseId).lean();
  if (!course) {
    const err = new Error(`Course with id '${courseId}' was not found.`);
    err.statusCode = 404;
    throw err;
  }

  // Fetch the student as a real Mongoose document (not .lean()) because we
  // need to call .save() on it below.
  const student = await Student.findById(studentId);
  if (!student) {
    const err = new Error('Authenticated student account was not found.');
    err.statusCode = 404;
    throw err;
  }

  const existingActive = await Enrollment.findOne({
    studentId: student._id,
    courseId: course._id,
    status: 'active',
  }).lean();

  if (existingActive) {
    const err = new Error('You are already enrolled in this course.');
    err.statusCode = 409;
    throw err;
  }

  // Server is the source of truth for price — never trust an amount sent by the client.
  const amount = course.price;

  const { success, transactionId } = await chargeDummyGateway({ amount, paymentMethod });

  const payment = new Payment({
    studentId: student._id,
    courseId: course._id,
    studentName: student.fullName,
    studentEmail: student.email,
    courseTitle: course.title,
    amount,
    paymentMethod,
    transactionId,
    paymentStatus: success ? 'success' : 'failed',
    paidAt: success ? new Date() : undefined,
    gateway: 'dummy',
  });

  await payment.save();

  if (!success) {
    const err = new Error('Payment could not be processed. Please try again.');
    err.statusCode = 402;
    throw err;
  }

  // ── Auto-enrollment ──────────────────────────────────────────────────────
  const enrollment = new Enrollment({
    studentId: student._id,
    courseId: course._id,
    studentName: student.fullName,
    studentEmail: student.email,
    courseTitle: course.title,
    paymentId: payment._id,
    amount,
    status: 'active',
    enrolledAt: new Date(),
  });

  await enrollment.save();

  // Keep Student.enrolledCourses[] in sync (this is what the dashboard reads).
  const alreadyListed = student.enrolledCourses.some(
    (id) => id.toString() === course._id.toString()
  );
  if (!alreadyListed) {
    student.enrolledCourses.push(course._id);
    await student.save();
  }

  return { payment, enrollment };
}

module.exports = {
  getPaymentSummary,
  verifyAndEnroll,
};
