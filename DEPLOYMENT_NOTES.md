# Deployment Notes — Payment-Based Auto-Enrollment Release

## 1. Environment variables
No new environment variables are required for this release. The dummy
payment gateway needs no API keys. Existing variables (`MONGO_URI`, JWT
secret, etc.) are unchanged.

If you later swap the dummy gateway for Razorpay, you will need to add
`RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` and update
`backend/services/paymentService.js`'s `chargeDummyGateway()` function
(or replace it) — that integration was explicitly out of scope here.

## 2. Dependencies
No new npm packages are required. This release only uses dependencies
already present in `package.json` (`mongoose`, `express`) plus Node's
built-in `crypto` module.

## 3. Deploy order
1. Deploy the backend code changes.
2. **Before** accepting real traffic against the new code, run the
   migration against your production database:
   ```bash
   cd backend
   node migrations/001-enrollment-status-and-payment-backfill.js --dry-run
   ```
   Review the dry-run output, then:
   ```bash
   node migrations/001-enrollment-status-and-payment-backfill.js
   ```
3. Deploy the frontend code changes.
4. Smoke-test using the checklist in `CHANGELOG.md`.

If anything goes wrong after step 2, the rollback script reverses exactly
what the migration did (see `CHANGELOG.md` → Migration notes), but it does
**not** revert the backend/frontend code itself — code rollback is a
separate deploy action.

## 4. What happens if you skip the migration
The application will still run, but:
- Homepage "Students Enrolled" stat will show 0 until either the migration
  runs or new real payments start coming in (old enrollments don't have
  `status: 'active'` and are excluded from the count).
- Any code path that ever calls `.save()` on an old-shape Enrollment
  document will fail schema validation, since `paymentId`/`amount` are now
  required fields. In practice nothing in this codebase does that anymore
  post-refactor, but third-party scripts or future code touching old
  documents directly should be aware of this.

## 5. Things this release does NOT include
- A real payment gateway (dummy gateway always succeeds — do not use this
  in an environment where real money should change hands).
- An admin panel (none existed before; none was built now, per explicit
  decision during this project).
- A fix for re-purchasing a course after a refund/cancellation (currently
  blocked by a unique index — flagged, not resolved).
- Execution of the test checklist against a live database — this was
  built and statically verified in an environment with no database or
  network access. Treat it as code-reviewed, not QA-verified.
