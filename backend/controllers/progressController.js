'use strict';

const { markLessonComplete, getCourseProgress, getAllProgress } = require('../services/progressService');
const { sendSuccess, sendError } = require('../utils/response');

async function markCompleteHandler(req, res, next) {
  try {
    const { lessonId } = req.params;
    const { progress, certificate } = await markLessonComplete(req.student._id, lessonId);
    sendSuccess(res, 200, 'Lesson marked as complete.', { progress, certificate });
  } catch (err) {
    if (err.statusCode) return sendError(res, err.statusCode, err.message);
    next(err);
  }
}

async function getCourseProgressHandler(req, res, next) {
  try {
    const progress = await getCourseProgress(req.student._id, req.params.courseId);
    sendSuccess(res, 200, 'Progress retrieved successfully.', progress);
  } catch (err) { next(err); }
}

async function getDashboardProgressHandler(req, res, next) {
  try {
    const allProgress = await getAllProgress(req.student._id);
    sendSuccess(res, 200, 'Dashboard progress retrieved successfully.', allProgress);
  } catch (err) { next(err); }
}

module.exports = { markCompleteHandler, getCourseProgressHandler, getDashboardProgressHandler };
