# SkillForge LMS — Changelog

## Payment-Based Auto-Enrollment Refactor

This release removes the manual enrollment request/approval workflow and
replaces it with payment-based auto-enrollment, fixes the dashboard/homepage
enrollment-count bug, and adds enrollment-gated lesson access.

---

### Added

**Backend**
- `models/Payment.js` — new model recording every payment attempt (student,
  course, amount, method, transaction id, status, gateway tag).
- `services/paymentService.js` — `getPaymentSummary()` (checkout page data)
  and `verifyAndEnroll()` (charges the dummy gateway, records the Payment,
  creates the Enrollment, syncs `Student.enrolledCourses[]`). Identity is
  always taken from the authenticated `req.student`, never from request body.
- `controllers/paymentController.js` — `initiatePaymentHandler`,
  `verifyPaymentHandler`.
- `routes/payments.js` — `GET /api/payments/initiate/:courseId`,
  `POST /api/payments/verify`. Both require authentication.
- `validators/inputValidators.js` — added `validatePayment`.
- `migrations/001-enrollment-status-and-payment-backfill.js` — converts
  pre-existing Enrollment documents to the new schema (see Migration Notes).
- `migrations/001-rollback.js` — reverses the above migration exactly.

**Frontend**
- `payment.html` — checkout page (course summary, price breakdown, payment
  method selector: UPI / Card / Net Banking / Wallet).
- `js/payment.js` — fetches the payment summary, submits the dummy payment,
  redirects to `dashboard.html` on success.

### Changed

**Backend**
- `models/Enrollment.js` — `status` enum changed from
  `pending/approved/rejected/cancelled` to `active/refunded/cancelled`.
  Added required `paymentId` (ref) and `amount` fields.
- `models/Course.js` — added `instructorName` (default:
  `'SkillForge Faculty'`, so existing seeded courses remain valid).
- `controllers/enrollmentsController.js` — removed `createEnrollmentHandler`
  and `updateEnrollmentStatusHandler`. Kept `getAllEnrollmentsHandler` as a
  read-only history endpoint.
- `services/enrollmentService.js` — removed `createEnrollment` and
  `updateEnrollmentStatus`. This is also where the original dashboard-count
  bug lived: `createEnrollment` mutated a `.lean()` (plain-object, no
  `.save()`) student record for any *existing* student, throwing silently
  on every returning-student enrollment attempt. The new flow never uses
  `.lean()` on a document it intends to mutate.
- `routes/enrollments.js` — removed the public POST (request creation) and
  PATCH (status update) routes. The single remaining GET is now behind
  `authenticate`. The route's old "DO NOT CHANGE" comment was intentionally
  overridden per explicit task instruction.
- `controllers/statsController.js` — homepage stats now count
  `Enrollment.countDocuments({ status: 'active' })` instead of all
  enrollments regardless of status. This is the homepage-stats half of the
  reported bug.
- `controllers/lessonController.js` — added an enrollment check
  (`Enrollment.exists({ studentId, courseId, status: 'active' })`) before
  returning lesson content. Checked against `Enrollment` directly rather
  than `Student.enrolledCourses[]`, per explicit decision to keep this
  resilient even if that denormalised array ever drifts.
- `server.js` — mounted `paymentsRouter` at `/api/payments` (rate-limited).
  Removed the write rate-limiter from `/api/enrollments` (now read-only).

**Frontend**
- `index.html` — removed the homepage "Enroll" modal (name/email form with
  no login awareness) entirely.
- `js/script.js` — removed `openEnrollModal`, `closeEnrollModal`,
  `validateEnrollForm`, `initEnrollModal`. Enroll buttons now redirect to
  `payment.html?courseId=...` if logged in, or to
  `login.html?redirect=...` if not. Removed a leftover debug
  `console.log("ENROLL PAYLOAD"...)`. Added `isLoggedIn()` helper (reads the
  same `sf_token` localStorage key `auth.js` uses — `script.js` cannot load
  `auth.js` directly, since both files separately declare `API_BASE`/
  `apiFetch` and loading both throws a redeclaration `SyntaxError`).
- `js/auth.js` — added `getPostLoginRedirect()` so login respects an
  optional `?redirect=` query param instead of always going to
  `dashboard.html`. Used so a logged-out visitor who clicks Enroll lands
  back on the correct course's checkout page after logging in.
- `js/course.js` — added explicit handling for the new lesson-access 403
  response (shows an "you haven't enrolled" message with an Enroll Now
  link, instead of silently rendering an empty lesson list).
- `css/style.css` — removed the now-dead `.modal-*` CSS block (and its
  reference inside the print media query) that styled the removed modal.

### Removed
- The entire enrollment request/approval workflow: public
  `POST /api/enrollments`, `PATCH /api/enrollments/:id/status`,
  `validateEnrollment`, and the homepage enroll modal markup/JS/CSS.

### Fixed
- **Dashboard enrollment-count bug** (root cause: `.lean()` object had no
  `.save()`, silently throwing on every existing-student enrollment
  attempt). Fixed by removing that code path entirely in favor of the new
  payment flow, which always loads the student as a real Mongoose document.
- **Homepage stats bug** (counted enrollments of any status, including
  pending/rejected, as "Students Enrolled"). Fixed to count only
  `status: 'active'`.
- **Lesson access control gap** (any authenticated student could view any
  course's lessons regardless of enrollment). Fixed via the enrollment
  check in `lessonController.js`.

---

## Known limitations / not done in this release

- **No real payment gateway.** Dummy gateway always succeeds; swapping in
  Razorpay (or similar) is future work, not done here.
- **No admin panel.** None existed before this work and none was built,
  per explicit decision. `getAllEnrollmentsHandler` is the only
  admin-adjacent endpoint, and it is unauthenticated-role-agnostic (any
  logged-in student can call it — there is no role/admin concept anywhere
  in this codebase to gate it further).
- **Repurchase after refund/cancellation is currently blocked.** The unique
  index on `Enrollment{studentId, courseId}` means once any Enrollment
  document exists for a student/course pair, a second one can never be
  created — including after a refund. This was flagged but intentionally
  left unresolved pending a product decision.
- **Lesson-access 403 detection in `course.js` matches on exact error
  message text**, not an HTTP status code, because `apiFetch`'s `{ ok, data }`
  return shape doesn't expose the status. Fragile if that message string
  ever changes without updating `course.js` in lockstep.
- **`statsController`'s `students` figure counts enrollment records, not
  unique students.** Pre-existing behavior, unchanged by this work.
- **No live database test was run.** All verification in this project was
  static (syntax checks, `require()` load tests, field-name cross-checks).
  No real MongoDB instance was available in the working environment.
  See Testing Checklist below — none of it has actually been executed yet.

---

## Migration notes

Pre-existing `Enrollment` documents (created under the old workflow) do not
match the new schema — they lack `paymentId`/`amount` and use the old status
strings. Run the migration before relying on production data with the new
code:

```bash
cd backend
node migrations/001-enrollment-status-and-payment-backfill.js --dry-run   # preview
node migrations/001-enrollment-status-and-payment-backfill.js             # apply
```

Mapping applied: `approved → active`, `pending → cancelled`,
`rejected → cancelled`. For `approved` records, a placeholder `Payment` is
created using the course's *current* price (the actual historical price, if
different, was never recorded and cannot be recovered) and is tagged
`gateway: 'migration-backfill'` so it's never mistaken for a real
transaction. Exclude that gateway tag from any revenue reporting.

The migration is idempotent (only touches Enrollment documents missing
`paymentId`) and writes an audit trail to a separate `migration_001_audit_log`
collection, which the rollback script depends on:

```bash
node migrations/001-rollback.js --dry-run
node migrations/001-rollback.js
```

**If you skip this migration**, homepage stats will show 0 students
immediately after deploy (since no existing Enrollment will have
`status: 'active'`) until either the migration runs or new real payments
come in.

---

## Testing checklist (not yet executed — see Known Limitations)

1. User Registration
2. User Login (including `?redirect=` round-trip back to checkout)
3. Payment Flow (all four payment methods)
4. Auto Enrollment (Enrollment + Payment + `Student.enrolledCourses[]` all
   created/updated correctly)
5. Dashboard Count (updates immediately post-payment, no manual refresh)
6. Homepage Stats (only counts `active` enrollments)
7. Course Access (enrolled student can view lessons)
8. Lesson Access Restriction (non-enrolled student is blocked with a clear
   message, not a silently empty page)
9. Certificate Generation (unaffected by this work — confirm no regression)
