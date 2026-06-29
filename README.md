# SkillForge Academy

A full-stack student course portal built with HTML5, CSS3, Vanilla JavaScript, Node.js, and Express.js.

---

## Project Structure

```
skillforge/
├── frontend/
│   ├── index.html              # Single-page application shell
│   ├── css/
│   │   └── style.css           # Complete stylesheet (mobile-first, CSS vars, Grid, Flexbox)
│   ├── js/
│   │   └── script.js           # All JS features + API integration
│   └── assets/                 # Static assets (images, icons)
│
└── backend/
    ├── server.js               # Express entry point
    ├── .env                    # Environment variables (not committed)
    ├── package.json
    ├── routes/
    │   ├── courses.js
    │   ├── enrollments.js
    │   ├── testimonials.js
    │   ├── faqs.js
    │   ├── stats.js
    │   ├── contact.js
    │   └── newsletter.js
    ├── controllers/
    │   ├── coursesController.js
    │   ├── enrollmentsController.js
    │   ├── testimonialsController.js
    │   ├── faqsController.js
    │   ├── statsController.js
    │   ├── contactController.js
    │   └── newsletterController.js
    ├── middleware/
    │   ├── errorHandlers.js
    │   └── requestLogger.js
    ├── validators/
    │   └── inputValidators.js
    ├── utils/
    │   ├── dataStore.js
    │   ├── response.js
    │   └── sanitizer.js
    ├── data/
    │   ├── courses.json
    │   ├── testimonials.json
    │   ├── faqs.json
    │   ├── stats.json
    │   ├── enrollments.json    # Written to on POST /api/enrollments
    │   ├── contacts.json       # Written to on POST /api/contact
    │   └── newsletter.json     # Written to on POST /api/newsletter
    └── docs/
        └── API.md              # Full API reference
```

---

## Prerequisites

- **Node.js** v18 or higher — https://nodejs.org
- A browser (Chrome, Firefox, Edge, Safari)
- A static file server for the frontend (VS Code Live Server, or `npx serve`)

---

## Setup Instructions

### 1. Clone / extract the project

```bash
cd skillforge
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Configure environment variables

The `.env` file is pre-configured for local development:

```
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://127.0.0.1:5500
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

> If your frontend runs on a different origin (e.g. port 3000), update `CORS_ORIGIN` accordingly.

### 4. Start the backend server

```bash
# From the backend/ directory
npm start
```

For development with auto-reload:

```bash
npm run dev
```

The API will be available at: `http://localhost:5000/api`

### 5. Serve the frontend

**Option A — VS Code Live Server (recommended)**
- Open the `frontend/` folder in VS Code
- Right-click `index.html` → "Open with Live Server"
- Default URL: `http://127.0.0.1:5500`

**Option B — npx serve**
```bash
npx serve frontend -p 5500
```

**Option C — Python (quick check)**
```bash
cd frontend
python3 -m http.server 5500
```

### 6. Open the application

Navigate to `http://127.0.0.1:5500` (or whichever port your server uses).

---

## Testing Instructions

### Manual API Testing (curl)

**Health check**
```bash
curl http://localhost:5000/api/health
```

**Get all courses**
```bash
curl http://localhost:5000/api/courses
```

**Get single course**
```bash
curl http://localhost:5000/api/courses/1
```

**Get stats**
```bash
curl http://localhost:5000/api/stats
```

**Get testimonials**
```bash
curl http://localhost:5000/api/testimonials
```

**Get FAQs**
```bash
curl http://localhost:5000/api/faqs
```

**Submit lment (valid)**
```bash
curl -X POST http://localhost:5000/api/enrollments \
  -H "Content-Type: application/json" \
  -d '{"name":"Priya Sharma","email":"priya@example.com","courseId":"1"}'
```

**Submit enrollment (invalid — triggers 400)**
```bash
curl -X POST http://localhost:5000/api/enrollments \
  -H "Content-Type: application/json" \
  -d '{"name":"P","email":"not-an-email","courseId":""}'
```

**Submit contact form**
```bash
curl -X POST http://localhost:5000/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Arjun Mehta","email":"arjun@example.com","phone":"9876543210","message":"I have a question about the Data Science course."}'
```

**Subscribe to newsletter**
```bash
curl -X POST http://localhost:5000/api/newsletter \
  -H "Content-Type: application/json" \
  -d '{"email":"subscriber@example.com"}'
```

**Subscribe again (triggers 409 duplicate)**
```bash
curl -X POST http://localhost:5000/api/newsletter \
  -H "Content-Type: application/json" \
  -d '{"email":"subscriber@example.com"}'
```

**Non-existent route (triggers 404)**
```bash
curl http://localhost:5000/api/unknown
```

### Frontend Functional Checklist

| Feature                           | How to test                                       |
|-----------------------------------|---------------------------------------------------|
| Mobile hamburger menu             | Resize browser < 768px, click ☰                  |
| Nav closes on link click (mobile) | Open nav → click a nav link                       |
| Active nav highlight              | Scroll through sections — nav link highlights     |
| Courses load from API             | Page load — 6 course cards appear                 |
| Stats animate on scroll           | Scroll to the dark stats band — counters animate  |
| Testimonials load                 | Scroll to reviews section                         |
| FAQ accordion                     | Click any question — expands/collapses smoothly   |
| FAQ keyboard navigation           | Tab to a question, use Arrow Up/Down              |
| Contact form validation           | Submit empty form — field errors appear           |
| Contact form success              | Fill all fields correctly — success message       |
| Enroll modal opens                | Click any "Enroll" button on a course card        |
| Enroll modal closes               | Click ✕, click outside, or press Escape           |
| Enrollment submission             | Fill modal form → Submit Enrollment               |
| Newsletter validation             | Submit empty/invalid email — error appears        |
| Newsletter duplicate prevention   | Subscribe twice with same email — 409 response    |
| Scroll reveal animations          | Scroll down slowly — cards fade up into view      |
| Responsive layout                 | Resize to 375px, 768px, 1280px                   |

### Data Files Verification

After submitting forms, inspect the data files to confirm writes:

```bash
cat backend/data/enrollments.json
cat backend/data/contacts.json
cat backend/data/newsletter.json
```

---

## Security Features

| Feature           | Implementation                              |
|-------------------|---------------------------------------------|
| Helmet            | Sets 11+ HTTP security headers              |
| CORS              | Restricted to `CORS_ORIGIN` env variable    |
| Rate Limiting     | 100 req/15 min global; 10 req/min on POSTs  |
| Input Sanitization| HTML tags stripped before validation        |
| Validation        | Server-side validation on all POST routes   |
| Body Size Limit   | JSON body capped at 10kb                    |
| No secret exposure| .env is never committed; errors sanitized   |

---

## Future Upgrade Path

### MongoDB Migration

The `dataStore.js` utility is the sole data access layer. To migrate:

1. Install Mongoose: `npm install mongoose`
2. Create `utils/db.js` with a Mongoose connection
3. Create schema files under `models/` (e.g. `models/Course.js`)
4. Replace function bodies in `dataStore.js` with Mongoose equivalents
5. No controller, route, or validator code needs to change

### JWT Authentication

1. Install `jsonwebtoken` and `bcryptjs`
2. Add `POST /api/auth/register` and `POST /api/auth/login` routes
3. Create `middleware/authenticate.js` that verifies Bearer tokens
4. Add the middleware to protected routes (e.g. enrollment management)

### Admin Dashboard

1. Create `frontend/admin/` with its own HTML, CSS, JS
2. Protect all admin API routes with JWT + role check (`req.user.role === 'admin'`)
3. Add admin-only endpoints:
   - `GET /api/admin/enrollments` — view all enrollment requests
   - `PATCH /api/admin/enrollments/:id` — approve / reject
   - `GET /api/admin/contacts` — view contact submissions
   - `POST /api/courses` / `PUT /api/courses/:id` / `DELETE /api/courses/:id`
