'use strict';

const { getLessonsByCourse, getLessonById } = require('../services/lessonService');
const { getCompletedLessonIds }              = require('../services/progressService');
const Enrollment                             = require('../models/Enrollment');
const { sendSuccess, sendError }             = require('../utils/response');

async function getLessonsByCourseHandler(req, res, next) {
  try {
    const { courseId } = req.params;

    // Only students with an active (paid) enrollment can access lesson
    // content. Checked against Enrollment directly rather than
    // Student.enrolledCourses[] so this stays correct even if that
    // denormalised array were ever to drift out of sync.
    const hasActiveEnrollment = await Enrollment.exists({
      studentId: req.student._id,
      courseId,
      status: 'active',
    });

    if (!hasActiveEnrollment) {
      return sendError(res, 403, 'You must purchase this course to access its lessons.');
    }

    const [modules, completedIds] = await Promise.all([
      getLessonsByCourse(courseId),
      getCompletedLessonIds(req.student._id, courseId),
    ]);
    sendSuccess(res, 200, 'Lessons retrieved successfully.', { modules, completedLessonIds: completedIds });
  } catch (err) { next(err); }
}

module.exports = { getLessonsByCourseHandler };
