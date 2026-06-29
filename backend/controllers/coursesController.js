'use strict';

const { getAllCourses, getCourseById, createCourse, updateCourse, deleteCourse } = require('../services/courseService');
const { sendSuccess, sendError } = require('../utils/response');

async function getAllCoursesHandler(req, res, next) {
  try {
    const courses = await getAllCourses();
    sendSuccess(res, 200, 'Courses retrieved successfully', courses);
  } catch (err) { next(err); }
}

async function getCourseByIdHandler(req, res, next) {
  try {
    const course = await getCourseById(req.params.id);
    if (!course) return sendError(res, 404, `Course with id '${req.params.id}' was not found.`);
    sendSuccess(res, 200, 'Course retrieved successfully', course);
  } catch (err) { next(err); }
}

async function createCourseHandler(req, res, next) {
  try {
    const course = await createCourse(req.body);
    sendSuccess(res, 201, 'Course created successfully', course);
  } catch (err) { next(err); }
}

async function updateCourseHandler(req, res, next) {
  try {
    const course = await updateCourse(req.params.id, req.body);
    if (!course) return sendError(res, 404, `Course with id '${req.params.id}' was not found.`);
    sendSuccess(res, 200, 'Course updated successfully', course);
  } catch (err) { next(err); }
}

async function deleteCourseHandler(req, res, next) {
  try {
    const course = await deleteCourse(req.params.id);
    if (!course) return sendError(res, 404, `Course with id '${req.params.id}' was not found.`);
    sendSuccess(res, 200, 'Course deleted successfully', null);
  } catch (err) { next(err); }
}

module.exports = { getAllCoursesHandler, getCourseByIdHandler, createCourseHandler, updateCourseHandler, deleteCourseHandler };
