'use strict';

const LessonProgress = require('../models/LessonProgress');
const Lesson         = require('../models/Lesson');
const Certificate    = require('../models/Certificate');
const Course         = require('../models/Course');
const Student        = require('../models/Student');

const CERTIFICATE_THRESHOLD = 0.6; // 60%

/**
 * Marks a lesson as complete for a student.
 * Silently succeeds if already marked (idempotent).
 * Checks certificate eligibility after each completion.
 *
 * @param {string} studentId
 * @param {string} lessonId
 * @returns {Promise<{ progress: Object, certificate: Object|null }>}
 */
async function markLessonComplete(studentId, lessonId) {
  const lesson = await Lesson.findById(lessonId).lean();
  if (!lesson) {
    const err = new Error('Lesson not found.');
    err.statusCode = 404;
    throw err;
  }

  // Upsert — safe to call multiple times
  await LessonProgress.findOneAndUpdate(
    { studentId, lessonId },
    {
      studentId,
      lessonId,
      courseId:    lesson.courseId,
      completed:   true,
      completedAt: new Date(),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const progress = await getCourseProgress(studentId, lesson.courseId);

  // Issue certificate if threshold crossed and not yet issued
  let certificate = null;
  if (progress.percentage >= CERTIFICATE_THRESHOLD * 100) {
    certificate = await issueCertificateIfEligible(studentId, lesson.courseId);
  }

  return { progress, certificate };
}

/**
 * Returns progress data for a student in a course.
 * @param {string} studentId
 * @param {string} courseId
 * @returns {Promise<Object>}
 */
async function getCourseProgress(studentId, courseId) {
  const [totalLessons, completedLessons] = await Promise.all([
    Lesson.countDocuments({ courseId }),
    LessonProgress.countDocuments({ studentId, courseId, completed: true }),
  ]);

  const percentage = totalLessons > 0
    ? Math.round((completedLessons / totalLessons) * 100)
    : 0;

  return {
    courseId,
    totalLessons,
    completedLessons,
    remaining: totalLessons - completedLessons,
    percentage,
    certificateUnlocked: percentage >= CERTIFICATE_THRESHOLD * 100,
  };
}

/**
 * Returns progress for all courses a student is enrolled in.
 * @param {string} studentId
 * @returns {Promise<Array>}
 */
async function getAllProgress(studentId) {
  const student = await Student.findById(studentId).lean();
  if (!student || !student.enrolledCourses?.length) return [];

  const results = await Promise.all(
    student.enrolledCourses.map(async (courseId) => {
      const course = await Course.findById(courseId).lean();
      const progress = await getCourseProgress(studentId, courseId);
      return { course, ...progress };
    })
  );

  return results;
}

/**
 * Returns the list of completed lessonIds for a student in a course.
 * Used by the frontend to mark lessons visually.
 * @param {string} studentId
 * @param {string} courseId
 * @returns {Promise<string[]>}
 */
async function getCompletedLessonIds(studentId, courseId) {
  const records = await LessonProgress.find({ studentId, courseId, completed: true })
    .select('lessonId')
    .lean();
  return records.map((r) => r.lessonId.toString());
}

/**
 * Issues a certificate if one doesn't exist yet for this student+course.
 * @param {string} studentId
 * @param {string} courseId
 * @returns {Promise<Object|null>}
 */
async function issueCertificateIfEligible(studentId, courseId) {
  const existing = await Certificate.findOne({ studentId, courseId }).lean();
  if (existing) return existing;

  const [student, course] = await Promise.all([
    Student.findById(studentId).lean(),
    Course.findById(courseId).lean(),
  ]);

  const certNumber = `SF-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

  const cert = new Certificate({
    studentId,
    courseId,
    certificateNumber: certNumber,
    issuedAt:          new Date(),
    studentName:       student?.fullName,
    courseTitle:       course?.title,
  });

  await cert.save();
  return cert;
}

module.exports = {
  markLessonComplete,
  getCourseProgress,
  getAllProgress,
  getCompletedLessonIds,
  issueCertificateIfEligible,
};
