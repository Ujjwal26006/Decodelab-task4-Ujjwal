'use strict';

const { register, login, getProfile } = require('../services/authService');
const { sanitizeObject }              = require('../utils/sanitizer');
const { sendSuccess, sendError }      = require('../utils/response');

async function registerHandler(req, res, next) {
  try {
    const { fullName, email, password } = sanitizeObject(req.body);

    if (!fullName || !email || !password) {
      return sendError(res, 400, 'Validation failed', ['fullName, email, and password are required.']);
    }
    if (password.length < 6) {
      return sendError(res, 400, 'Validation failed', ['Password must be at least 6 characters.']);
    }

    const { student, token } = await register({ fullName, email, password });
    sendSuccess(res, 201, 'Account created successfully.', { student, token });
  } catch (err) {
    if (err.statusCode) return sendError(res, err.statusCode, err.message);
    next(err);
  }
}

async function loginHandler(req, res, next) {
  try {
    const { email, password } = sanitizeObject(req.body);

    if (!email || !password) {
      return sendError(res, 400, 'Validation failed', ['Email and password are required.']);
    }

    const { student, token } = await login({ email, password });
    sendSuccess(res, 200, 'Login successful.', { student, token });
  } catch (err) {
    if (err.statusCode) return sendError(res, err.statusCode, err.message);
    next(err);
  }
}

function logoutHandler(req, res) {
  // JWT is stateless — logout is handled client-side by removing the token
  sendSuccess(res, 200, 'Logged out successfully.');
}

async function getMeHandler(req, res, next) {
  try {
    const student = await getProfile(req.student._id);
    sendSuccess(res, 200, 'Profile retrieved successfully.', { student });
  } catch (err) { next(err); }
}

module.exports = { registerHandler, loginHandler, logoutHandler, getMeHandler };
