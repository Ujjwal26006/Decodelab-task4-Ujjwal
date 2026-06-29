'use strict';

/**
 * Strips HTML tags and trims whitespace from a string value.
 * @param {*} value
 * @returns {string}
 */
function sanitizeString(value) {
  if (typeof value !== 'string') return '';
  return value.replace(/<[^>]*>/g, '').trim();
}

/**
 * Recursively sanitizes all string fields in an object.
 * @param {Object} obj
 * @returns {Object}
 */
function sanitizeObject(obj) {
  if (typeof obj !== 'object' || obj === null) return obj;
  const sanitized = {};
  for (const [key, val] of Object.entries(obj)) {
    sanitized[key] = typeof val === 'string' ? sanitizeString(val) : val;
  }
  return sanitized;
}

module.exports = { sanitizeString, sanitizeObject };
