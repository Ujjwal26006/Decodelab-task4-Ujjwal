'use strict';

const jwt = require('jsonwebtoken');
const Student = require('../models/Student');

/**
 * Generates a signed JWT for the given student ID.
 * @param {string} id
 * @returns {string}
 */
function generateToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

/**
 * Registers a new student. Throws 409 if email already exists.
 * @param {{ fullName, email, password }} data
 * @returns {{ student: Object, token: string }}
 */
async function register(data) {
  const { fullName, email, password } = data;

  const existing = await Student.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    const err = new Error('An account with this email address already exists.');
    err.statusCode = 409;
    throw err;
  }

  const student = new Student({ fullName, email, password });
  await student.save();

  // Generate avatar initials from fullName
  const initials = fullName
    .trim()
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  student.avatar = initials;
  await student.save();

  const token = generateToken(student._id);

  const safeStudent = {
    _id:      student._id,
    fullName: student.fullName,
    email:    student.email,
    avatar:   student.avatar,
    createdAt: student.createdAt,
  };

  return { student: safeStudent, token };
}

/**
 * Logs in a student. Throws 401 if credentials are wrong.
 * @param {{ email, password }} data
 * @returns {{ student: Object, token: string }}
 */
async function login(data) {
  const { email, password } = data;

  // Must explicitly select password (it has select:false on schema)
  const student = await Student.findOne({ email: email.toLowerCase().trim() }).select('+password');

  if (!student || !(await student.comparePassword(password))) {
    const err = new Error('Invalid email or password.');
    err.statusCode = 401;
    throw err;
  }

  const token = generateToken(student._id);

  const safeStudent = {
    _id:      student._id,
    fullName: student.fullName,
    email:    student.email,
    avatar:   student.avatar,
    createdAt: student.createdAt,
  };

  return { student: safeStudent, token };
}

/**
 * Returns the current student's profile (for /api/auth/me).
 * @param {string} studentId
 * @returns {Object}
 */
async function getProfile(studentId) {
  return Student.findById(studentId).select('-password').lean();
}

module.exports = { register, login, getProfile, generateToken };
