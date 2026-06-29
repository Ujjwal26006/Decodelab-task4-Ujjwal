'use strict';

const Course = require('../models/Course');

/**
 * Retrieves all courses sorted by creation date.
 * @returns {Promise<Array>}
 */
async function getAllCourses() {
  return Course.find().sort({ createdAt: 1 }).lean();
}

/**
 * Retrieves a single course by its MongoDB ObjectId.
 * @param {string} id
 * @returns {Promise<Object|null>}
 */
async function getCourseById(id) {
  return Course.findById(id).lean();
}

/**
 * Creates a new course document.
 * @param {Object} data
 * @returns {Promise<Object>}
 */
async function createCourse(data) {
  const course = new Course(data);
  return course.save();
}

/**
 * Updates a course by ID. Returns the updated document.
 * @param {string} id
 * @param {Object} data
 * @returns {Promise<Object|null>}
 */
async function updateCourse(id, data) {
  return Course.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true, runValidators: true }
  ).lean();
}

/**
 * Deletes a course by ID.
 * @param {string} id
 * @returns {Promise<Object|null>}
 */
async function deleteCourse(id) {
  return Course.findByIdAndDelete(id).lean();
}

module.exports = { getAllCourses, getCourseById, createCourse, updateCourse, deleteCourse };
