'use strict';

const validator = require('validator');

/**
 * Validates contact form request body.
 * @param {Object} body
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateContact(body) {
  const errors = [];
  const { name, email, phone, message } = body;

  if (!name || typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 50) {
    errors.push('Name is required and must be between 2 and 50 characters.');
  }

  if (!email || !validator.isEmail(String(email))) {
    errors.push('A valid email address is required.');
  }

  if (!phone || !/^\d{10,15}$/.test(String(phone).replace(/[\s\-+()]/g, ''))) {
    errors.push('Phone number is required and must contain 10–15 digits.');
  }

  if (!message || typeof message !== 'string' || message.trim().length < 10 || message.trim().length > 1000) {
    errors.push('Message is required and must be between 10 and 1000 characters.');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates newsletter subscription request body.
 * @param {Object} body
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateNewsletter(body) {
  const errors = [];
  const { email } = body;

  if (!email || !validator.isEmail(String(email))) {
    errors.push('A valid email address is required.');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates payment verification request body.
 * Note: amount is intentionally NOT accepted from the client — the server
 * always re-derives the amount from the course's stored price.
 * @param {Object} body
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validatePayment(body) {
  const errors = [];
  const { courseId, paymentMethod } = body;
  const allowedMethods = ['upi', 'card', 'netbanking', 'wallet'];

  if (!courseId || String(courseId).trim() === '') {
    errors.push('courseId is required.');
  }

  if (!paymentMethod || !allowedMethods.includes(String(paymentMethod))) {
    errors.push(`paymentMethod is required and must be one of: ${allowedMethods.join(', ')}.`);
  }

  return { valid: errors.length === 0, errors };
}

module.exports = { validateContact, validateNewsletter, validatePayment };
