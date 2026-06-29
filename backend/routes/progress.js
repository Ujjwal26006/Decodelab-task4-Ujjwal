'use strict';
const { Router } = require('express');
const { markCompleteHandler, getCourseProgressHandler, getDashboardProgressHandler } = require('../controllers/progressController');
const { authenticate } = require('../middleware/authenticate');
const router = Router();

router.patch('/lessons/:lessonId/complete', authenticate, markCompleteHandler);
router.get('/courses/:courseId',            authenticate, getCourseProgressHandler);
router.get('/dashboard',                    authenticate, getDashboardProgressHandler);

module.exports = router;
