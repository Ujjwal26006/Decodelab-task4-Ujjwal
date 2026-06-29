'use strict';

const Student = require('../models/Student');

/**
 * Finds a student by email address.
 * @param {string} email
 * @returns {Promise<Object|null>}
 */
async function findStudentByEmail(email) {
  return Student.findOne({ email: email.toLowerCase().trim() }).lean();
}

/**
 * Finds a student by ID.
 * @param {string} id
 * @returns {Promise<Object|null>}
 */
async function findStudentById(id) {
  return Student.findById(id).lean();
}

/**
 * Creates a new student. Throws on duplicate email (code 11000).
 * @param {Object} data - { fullName, email, phone }
 * @returns {Promise<Object>}
 */
async function createStudent(data) {
  const student = new Student({
    fullName: data.name || data.fullName,
    email: data.email,
    phone: data.phone || '',
  });
  return student.save();
}

/**
 * Finds an existing student by email or creates a new one.
 * Used by the enrollment flow to avoid duplicates.
 * @param {Object} data
 * @returns {Promise<Object>}
 */
async function findOrCreateStudent(data) {
  const existing = await findStudentByEmail(data.email);
  if (existing) return existing;
  return createStudent(data);
}

/**
 * Returns all students sorted by creation date (admin use).
 * @returns {Promise<Array>}
 */
async function getAllStudents() {
  return Student.find().sort({ createdAt: -1 }).lean();
}

module.exports = {
  findStudentByEmail,
  findStudentById,
  createStudent,
  findOrCreateStudent,
  getAllStudents,
};
