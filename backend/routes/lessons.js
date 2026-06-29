'use strict';
const { Router } = require('express');
const { getLessonsByCourseHandler } = require('../controllers/lessonController');
const { authenticate } = require('../middleware/authenticate');
const router = Router();

router.get('/:courseId/lessons', authenticate, getLessonsByCourseHandler);

module.exports = router;
