# SkillForge Academy — Project 3: Database Integration

## Table of Contents
1. ER Diagram
2. Schema Explanations
3. Relationship Explanations
4. New API Endpoints
5. Migration Guide
6. MongoDB Setup
7. Testing Instructions

---

## 1. ER Diagram (Text Representation)

```
┌─────────────┐        ┌──────────────────┐        ┌─────────────┐
│   Student   │        │   Enrollment     │        │   Course    │
│─────────────│        │──────────────────│        │─────────────│
│ _id (PK)   │──1───<│ _id (PK)         │>───1──│ _id (PK)   │
│ fullName   │        │ studentId (FK)   │        │ title       │
│ email*     │        │ courseId (FK)    │        │ slug*       │
│ phone      │        │ studentName      │        │ description │
│ createdAt  │        │ studentEmail     │        │ duration    │
│ updatedAt  │        │ courseTitle      │        │ price       │
└─────────────┘        │ status           │        │ category    │
                       │ createdAt        │        │ level       │
                       └──────────────────┘        │ topics[]    │
                                                   │ seats       │
┌──────────────────┐   ┌─────────────────┐        └─────────────┘
│  Testimonial     │   │      FAQ        │
│──────────────────│   │─────────────────│
│ _id (PK)        │   │ _id (PK)        │
│ name            │   │ question        │
│ course (string) │   │ answer          │
│ review          │   │ order           │
│ avatar          │   └─────────────────┘
│ rating          │
└──────────────────┘   ┌──────────────────┐        ┌──────────────┐
                       │  ContactMessage  │        │  Subscriber  │
                       │──────────────────│        │──────────────│
                       │ _id (PK)        │        │ _id (PK)    │
                       │ name            │        │ email*      │
                       │ email           │        │ createdAt   │
                       │ phone           │        └──────────────┘
                       │ message         │
                       │ createdAt       │   * = unique index
                       └──────────────────┘
```

---

## 2. Schema Explanations

### Student
Stores learner identity. Created automatically during enrollment if the email has not been seen before.
- `email` is unique — one account per email address
- `phone` validates 10–15 digit format
- `timestamps: true` adds `createdAt` / `updatedAt`

### Course
The course catalogue. Seed data provides 6 courses on startup.
- `slug` is unique — URL-safe identifier
- `category` uses enum: `Development | Data | Programming | Design | AI`
- `price` minimum 0 (free courses allowed)
- `topics[]` is a string array

### Enrollment
Junction between Student and Course — implements the Many-to-Many relationship.
- `studentId` → ObjectId ref to Student
- `courseId` → ObjectId ref to Course
- Compound unique index `{studentId, courseId}` prevents double-enrollment
- Denormalised `studentName`, `studentEmail`, `courseTitle` stored for read performance
- `status` enum: `pending | approved | rejected | cancelled`

### Testimonial
Independent review records. `course` is a plain string (course name) for display simplicity.

### FAQ
Ordered list of questions. `order` field controls display sequence.

### ContactMessage
Write-only. Every submission is stored. Never deleted by the application.

### Subscriber
Newsletter list. `email` unique index enforced at DB level — no manual duplicate check needed.

---

## 3. Relationship Explanations

### One-to-Many: Student → Enrollments
One student can have many enrollment records (one per course).
```
Student._id  ──────────<  Enrollment.studentId
```
Query: `Enrollment.find({ studentId: student._id })`

### Many-to-Many: Students ↔ Courses (via Enrollment)
Multiple students enroll in multiple courses. The Enrollment collection is the junction.
```
Student ──< Enrollment >── Course
```
Query with populate:
```js
Enrollment.find().populate('studentId').populate('courseId')
```

---

## 4. New API Endpoints (added in Project 3)

All existing Project 2 endpoints are **unchanged**.

### Courses (new)
| Method | URL | Description |
|--------|-----|-------------|
| POST | `/api/courses` | Create a course |
| PUT | `/api/courses/:id` | Update a course |
| DELETE | `/api/courses/:id` | Delete a course |

### Enrollments (new)
| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/enrollments` | List all enrollments (populated) |
| PATCH | `/api/enrollments/:id/status` | Update enrollment status |

### Testimonials (new)
| Method | URL | Description |
|--------|-----|-------------|
| POST | `/api/testimonials` | Create a testimonial |
| PUT | `/api/testimonials/:id` | Update a testimonial |
| DELETE | `/api/testimonials/:id` | Delete a testimonial |

### FAQs (new)
| Method | URL | Description |
|--------|-----|-------------|
| POST | `/api/faqs` | Create a FAQ |
| PUT | `/api/faqs/:id` | Update a FAQ |
| DELETE | `/api/faqs/:id` | Delete a FAQ |

---

## 5. Migration Guide

### What Changed
| Component | Before (Project 2) | After (Project 3) |
|---|---|---|
| Storage | JSON flat files in `data/` | MongoDB via Mongoose |
| dataStore.js | Used `fs.readFileSync` / `writeFileSync` | Retired — replaced by services |
| controllers | Called `readData` / `appendRecord` | Call service functions |
| IDs | `Date.now().toString()` | MongoDB `ObjectId` |
| Duplicate check | Manual `recordExists()` | DB unique index |
| Validation | API-layer only | API-layer + Mongoose schema |

### What Did NOT Change
- All route URLs — identical
- All request/response JSON shapes — identical
- Frontend `script.js` — zero changes required
- `index.html` — unchanged
- `style.css` — unchanged
- All middleware — unchanged (enhanced error handler only)
- All validators — unchanged

### Data Files (JSON)
The `data/` directory and its JSON files are **no longer used** by the application.
They are preserved for reference and as the source for the seed script.
They can be safely deleted after seeding.

---

## 6. MongoDB Setup

### Option A — Local MongoDB

1. Install MongoDB Community Edition:
   https://www.mongodb.com/docs/manual/installation/

2. Start the service:
```bash
# macOS (Homebrew)
brew services start mongodb-community

# Ubuntu/Debian
sudo systemctl start mongod

# Windows — run as service or:
"C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe"
```

3. Verify it's running:
```bash
mongosh
# Should connect to: mongodb://127.0.0.1:27017
```

4. The `.env` default `MONGO_URI` works with no changes:
```
MONGO_URI=mongodb://127.0.0.1:27017/skillforge_academy
```

### Option B — MongoDB Atlas (Cloud)

1. Create a free account at https://www.mongodb.com/atlas
2. Create a cluster (free M0 tier)
3. Create a database user with read/write permissions
4. Whitelist your IP (or use 0.0.0.0/0 for development)
5. Click "Connect" → "Drivers" → copy the connection string
6. Update `.env`:
```
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/skillforge_academy?retryWrites=true&w=majority
```

---

## 7. Testing Instructions

### Setup
```bash
cd backend
npm install        # installs mongoose
npm run seed       # populates MongoDB with courses, testimonials, FAQs
npm run dev        # starts server with nodemon
```

### Verify Database Connection
```bash
# Server log should show:
# ✅ MongoDB connected: 127.0.0.1/skillforge_academy
# ✅ SkillForge Academy API running on port 5000 [development]
```

### Test Seed Data
```bash
curl http://localhost:5000/api/courses
# Returns 6 courses from MongoDB

curl http://localhost:5000/api/testimonials
# Returns 5 testimonials

curl http://localhost:5000/api/faqs
# Returns 8 FAQs
```

### Test Enrollment (creates Student + Enrollment)
```bash
curl -X POST http://localhost:5000/api/enrollments \
  -H "Content-Type: application/json" \
  -d '{"name":"Priya Sharma","email":"priya@example.com","courseId":"<_id from GET /api/courses>"}'
```

### Test Duplicate Enrollment (should return 409)
```bash
# Run the same curl again — returns:
# { "success": false, "message": "You have already submitted..." }
```

### Test Newsletter Duplicate (should return 409)
```bash
curl -X POST http://localhost:5000/api/newsletter \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
# First call: 201 success
# Second call: 409 conflict (enforced by MongoDB unique index)
```

### Test Contact Form
```bash
curl -X POST http://localhost:5000/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Arjun","email":"arjun@example.com","phone":"9876543210","message":"Question about the Data Science course."}'
```

### Test Validation Error (400)
```bash
curl -X POST http://localhost:5000/api/enrollments \
  -H "Content-Type: application/json" \
  -d '{"name":"A","email":"not-valid","courseId":""}'
# Returns 400 with validation error list
```

### Test Invalid ObjectId (400)
```bash
curl http://localhost:5000/api/courses/not-a-valid-id
# Returns 400: Invalid ID format
```

### Test Course Not Found (404)
```bash
curl http://localhost:5000/api/courses/000000000000000000000000
# Returns 404: Course not found
```

### Verify in MongoDB Shell
```bash
mongosh skillforge_academy

db.courses.countDocuments()        # 6
db.testimonials.countDocuments()   # 5
db.faqs.countDocuments()           # 8
db.enrollments.find().pretty()
db.subscribers.find().pretty()
```
