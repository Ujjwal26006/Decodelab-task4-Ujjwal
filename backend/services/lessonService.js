'use strict';

const Module = require('../models/Module');
const Lesson = require('../models/Lesson');

/**
 * Returns all modules for a course, each populated with its lessons,
 * sorted by module.order then lesson.order.
 * @param {string} courseId
 * @returns {Promise<Array>}
 */

async function getLessonsByCourse(courseId) {
  console.log("COURSE ID =", courseId);

const modules = await Module.find({ courseId }).sort({ order: 1 }).lean();

console.log("MODULES FOUND =", modules.length);

  const modulesWithLessons = await Promise.all(
    modules.map(async (mod) => {
      const lessons = await Lesson.find({ moduleId: mod._id })
        .sort({ order: 1 })
        .lean();
      return { ...mod, lessons };
    })
  );

  return modulesWithLessons;
}

/**
 * Returns a single lesson by ID.
 * @param {string} lessonId
 * @returns {Promise<Object|null>}
 */
async function getLessonById(lessonId) {
  return Lesson.findById(lessonId).lean();
}

/**
 * Returns the total lesson count for a course.
 * @param {string} courseId
 * @returns {Promise<number>}
 */
async function getTotalLessonCount(courseId) {
  return Lesson.countDocuments({ courseId });
}

module.exports = { getLessonsByCourse, getLessonById, getTotalLessonCount };
