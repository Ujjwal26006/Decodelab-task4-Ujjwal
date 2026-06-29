'use strict';

/**
 * Sends a successful JSON response.
 * @param {import('express').Response} res
 * @param {number} statusCode
 * @param {string} message
 * @param {*} data
 */
function sendSuccess(res, statusCode, message, data = null) {
  const body = { success: true, message };
  if (data !== null) body.data = data;
  res.status(statusCode).json(body);
}

/**
 * Sends an error JSON response.
 * @param {import('express').Response} res
 * @param {number} statusCode
 * @param {string} message
 * @param {Array} errors
 */
function sendError(res, statusCode, message, errors = []) {
  res.status(statusCode).json({ success: false, message, errors });
}

module.exports = { sendSuccess, sendError };
