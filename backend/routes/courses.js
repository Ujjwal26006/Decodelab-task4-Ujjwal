'use strict';

const { Router } = require('express');
const {
  getAllCoursesHandler,
  getCourseByIdHandler,
  createCourseHandler,
  updateCourseHandler,
  deleteCourseHandler,
} = require('../controllers/coursesController');

const router = Router();

// ── Existing routes (frontend-facing — DO NOT CHANGE URLs) ────────────────
router.get('/', getAllCoursesHandler);
router.get('/:id', getCourseByIdHandler);

// ── New CRUD routes (admin/management) ────────────────────────────────────
router.post('/', createCourseHandler);
router.put('/:id', updateCourseHandler);
router.delete('/:id', deleteCourseHandler);

module.exports = router;
