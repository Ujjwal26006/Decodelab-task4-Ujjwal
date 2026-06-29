'use strict';

const { sendError } = require('../utils/response');

/**
 * 404 Not Found handler – must be registered after all routes.
 */
function notFoundHandler(req, res) {
  sendError(res, 404, `Route not found: ${req.method} ${req.originalUrl}`);
}

/**
 * Global error handler – must be registered last with four parameters.
 * Handles standard errors AND Mongoose-specific error types:
 *   - MongoServerError code 11000 → duplicate key (409)
 *   - ValidationError                → schema validation failed (400)
 *   - CastError (ObjectId)           → invalid resource ID format (400)
 * @param {Error} err
 */
function globalErrorHandler(err, req, res, _next) {
  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    console.error('[ERROR]', err.stack);
  } else {
    console.error('[ERROR]', err.message);
  }

  // ── Mongoose: Duplicate Key Error (e.g. unique email) ─────────────────
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const value = err.keyValue ? err.keyValue[field] : '';
    return sendError(
      res,
      409,
      `Duplicate value: '${value}' is already registered for ${field}.`,
      [`${field} must be unique.`]
    );
  }

  // ── Mongoose: Schema Validation Error ─────────────────────────────────
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => e.message);
    return sendError(res, 400, 'Database validation failed.', errors);
  }

  // ── Mongoose: CastError — invalid ObjectId in route param ─────────────
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    return sendError(res, 400, `Invalid ID format: '${err.value}' is not a valid resource ID.`);
  }

  // ── Standard Application Error ─────────────────────────────────────────
  const statusCode = err.statusCode || 500;
  const message =
    statusCode === 500 && !isDev
      ? 'An unexpected error occurred. Please try again later.'
      : err.message || 'Internal Server Error';

  sendError(res, statusCode, message, err.errors || []);
}

module.exports = { notFoundHandler, globalErrorHandler };
