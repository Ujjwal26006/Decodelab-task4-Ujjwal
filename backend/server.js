'use strict';

require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { connectDatabase } = require('./config/database');

const coursesRouter      = require('./routes/courses');
const enrollmentsRouter  = require('./routes/enrollments');
const testimonialsRouter = require('./routes/testimonials');
const faqsRouter         = require('./routes/faqs');
const statsRouter        = require('./routes/stats');
const contactRouter      = require('./routes/contact');
const newsletterRouter   = require('./routes/newsletter');
const authRouter         = require('./routes/auth');
const lessonsRouter      = require('./routes/lessons');
const progressRouter     = require('./routes/progress');
const certificatesRouter = require('./routes/certificates');
const paymentsRouter     = require('./routes/payments');
const { notFoundHandler, globalErrorHandler } = require('./middleware/errorHandlers');
const { requestLogger } = require('./middleware/requestLogger');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Security Middleware ───────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 200,
  })
);

// ─── Rate Limiting ─────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
    errors: [],
  },
});

const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many submission attempts. Please wait before trying again.',
    errors: [],
  },
});

app.use(limiter);

// ─── Body Parsing ──────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

// ─── Request Logger ────────────────────────────────────────────────────────
app.use(requestLogger);

// ─── Health Check ──────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'SkillForge Academy API is running',
    data: { environment: process.env.NODE_ENV, timestamp: new Date().toISOString() },
  });
});

// ─── API Routes ────────────────────────────────────────────────────────────
// ── Existing Project 2/3 routes (unchanged) ────────────────────────────────
app.use('/api/courses',      coursesRouter);
app.use('/api/enrollments',  enrollmentsRouter);
app.use('/api/testimonials', testimonialsRouter);
app.use('/api/faqs',         faqsRouter);
app.use('/api/stats',        statsRouter);
app.use('/api/contact',      writeLimiter, contactRouter);
app.use('/api/newsletter',   writeLimiter, newsletterRouter);

// ── LMS routes (new) ───────────────────────────────────────────────────────
app.use('/api/auth',         writeLimiter, authRouter);
app.use('/api/courses',      lessonsRouter);       // GET /api/courses/:courseId/lessons
app.use('/api/progress',     progressRouter);      // PATCH /lessons/:id/complete, GET /courses/:id, GET /dashboard
app.use('/api/certificates', certificatesRouter);  // GET /, GET /verify/:certNumber
app.use('/api/payments',     writeLimiter, paymentsRouter); // GET /initiate/:courseId, POST /verify

// ─── Error Handlers ────────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(globalErrorHandler);

// ─── Start Server ──────────────────────────────────────────────────────────
(async () => {
  await connectDatabase();
  app.listen(PORT, () => {
    console.log(`✅ SkillForge Academy API running on port ${PORT} [${process.env.NODE_ENV}]`);
  });
})();

module.exports = app;
