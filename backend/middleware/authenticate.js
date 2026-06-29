'use strict';

const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const { sendError } = require('../utils/response');

/**
 * Middleware that verifies the JWT Bearer token in the Authorization header.
 * On success attaches req.student (without password) and calls next().
 * On failure returns 401.
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 401, 'Access denied. No authentication token provided.');
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const student = await Student.findById(decoded.id).select('-password').lean();

    if (!student) {
      return sendError(res, 401, 'Authentication failed. Student account not found.');
    }

    req.student = student;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return sendError(res, 401, 'Session expired. Please log in again.');
    }
    if (err.name === 'JsonWebTokenError') {
      return sendError(res, 401, 'Invalid authentication token.');
    }
    next(err);
  }
}

module.exports = { authenticate };
