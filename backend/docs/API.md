# SkillForge Academy — API Documentation

Base URL: `http://localhost:5000/api`

All responses follow this envelope:

**Success**
```json
{ "success": true, "message": "...", "data": {} }
```

**Error**
```json
{ "success": false, "message": "...", "errors": [] }
```

---

## Health Check

### `GET /api/health`

Verifies the API is running.

**Response 200**
```json
{
  "success": true,
  "message": "SkillForge Academy API is running",
  "data": { "environment": "development", "timestamp": "2024-06-01T10:00:00.000Z" }
}
```

---

## Courses

### `GET /api/courses`

Returns the full list of courses.

**Response 200**
```json
{
  "success": true,
  "message": "Courses retrieved successfully",
  "data": [
    {
      "id": "1",
      "title": "Web Development",
      "slug": "web-development",
      "description": "Master HTML, CSS, JavaScript...",
      "duration": "12 Weeks",
      "price": 8999,
      "category": "Development",
      "level": "Beginner to Advanced",
      "image": "assets/course-web-dev.svg",
      "topics": ["HTML5 & CSS3", "JavaScript ES6+"],
      "seats": 30
    }
  ]
}
```

---

### `GET /api/courses/:id`

Returns a single course by its ID.

**Path Parameters**

| Parameter | Type   | Required | Description    |
|-----------|--------|----------|----------------|
| id        | string | Yes      | Course ID (1–6)|

**Response 200** — Course object (same shape as above)

**Response 404**
```json
{ "success": false, "message": "Course with id '99' was not found.", "errors": [] }
```

---

## Enrollments

### `POST /api/enrollments`

Submits an enrollment request for a course.

**Request Body**
```json
{ "name": "John Doe", "email": "john@example.com", "courseId": "1" }
```

| Field    | Type   | Required | Rules                     |
|----------|--------|----------|---------------------------|
| name     | string | Yes      | 2–50 characters           |
| email    | string | Yes      | Valid email format        |
| courseId | string | Yes      | Must match an existing ID |

**Response 201**
```json
{
  "success": true,
  "message": "Enrollment request for \"Web Development\" submitted successfully.",
  "data": { "enrollmentId": "1717228800000", "courseTitle": "Web Development", "status": "pending" }
}
```

**Response 400** — Validation errors
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": ["Name is required and must be between 2 and 50 characters."]
}
```

**Response 404** — Course not found

**Response 409** — Duplicate enrollment
```json
{ "success": false, "message": "You have already submitted an enrollment request for this course.", "errors": [] }
```

**Response 429** — Rate limit exceeded

---

## Testimonials

### `GET /api/testimonials`

Returns all student testimonials.

**Response 200**
```json
{
  "success": true,
  "message": "Testimonials retrieved successfully",
  "data": [
    { "id": "1", "name": "Priya Sharma", "course": "Web Development", "review": "...", "avatar": "PS", "rating": 5 }
  ]
}
```

---

## FAQs

### `GET /api/faqs`

Returns all frequently asked questions.

**Response 200**
```json
{
  "success": true,
  "message": "FAQs retrieved successfully",
  "data": [
    { "id": "1", "question": "Do I need prior experience to enroll?", "answer": "..." }
  ]
}
```

---

## Statistics

### `GET /api/stats`

Returns platform-wide statistics.

**Response 200**
```json
{
  "success": true,
  "message": "Statistics retrieved successfully",
  "data": { "students": 5200, "courses": 52, "mentors": 104, "successRate": 98 }
}
```

---

## Contact

### `POST /api/contact`

Submits a contact form message.

**Request Body**
```json
{ "name": "Jane Doe", "email": "jane@example.com", "phone": "9876543210", "message": "I have a question about the Data Science course." }
```

| Field   | Type   | Required | Rules              |
|---------|--------|----------|--------------------|
| name    | string | Yes      | 2–50 characters    |
| email   | string | Yes      | Valid email format |
| phone   | string | Yes      | 10–15 digits       |
| message | string | Yes      | 10–1000 characters |

**Response 201**
```json
{
  "success": true,
  "message": "Your message has been received. We will get back to you within 24 hours.",
  "data": { "referenceId": "1717228800000" }
}
```

**Response 400** — Validation errors

**Response 429** — Rate limit exceeded

---

## Newsletter

### `POST /api/newsletter`

Subscribes an email address to the newsletter.

**Request Body**
```json
{ "email": "subscriber@example.com" }
```

**Response 201**
```json
{
  "success": true,
  "message": "You have successfully subscribed to the SkillForge Academy newsletter.",
  "data": { "email": "subscriber@example.com" }
}
```

**Response 400** — Invalid email

**Response 409** — Already subscribed
```json
{ "success": false, "message": "This email address is already subscribed to our newsletter.", "errors": [] }
```

**Response 429** — Rate limit exceeded

---

## HTTP Status Code Reference

| Code | Meaning                |
|------|------------------------|
| 200  | OK                     |
| 201  | Created                |
| 400  | Bad Request            |
| 404  | Not Found              |
| 409  | Conflict               |
| 429  | Too Many Requests      |
| 500  | Internal Server Error  |

---

## Security Headers

All responses include Helmet-provided security headers:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `X-XSS-Protection: 0`
- `Strict-Transport-Security` (production)
- `Content-Security-Policy`

---

## Rate Limits

| Scope           | Window | Max Requests |
|-----------------|--------|--------------|
| Global          | 15 min | 100          |
| POST endpoints  | 1 min  | 10           |
