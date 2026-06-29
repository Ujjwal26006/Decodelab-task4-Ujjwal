'use strict';

/**
 * Migration: 001-enrollment-status-and-payment-backfill.js
 *
 * WHY THIS MIGRATION EXISTS
 * ─────────────────────────
 * The Enrollment model's `status` enum changed from the old request/approval
 * workflow (pending / approved / rejected / cancelled) to a payment-based
 * workflow (active / refunded / cancelled). The new schema also requires
 * `paymentId` and `amount` on every Enrollment document.
 *
 * Pre-existing Enrollment documents were created under the OLD workflow and
 * have none of that — no Payment was ever recorded for them, because the
 * old flow never charged anyone. This script brings old documents in line
 * with the new schema so they don't fail validation the next time anything
 * re-saves them, and so dashboard/stats queries that filter on
 * `status: 'active'` behave sensibly for historical data instead of
 * silently dropping it to zero.
 *
 * STATUS MAPPING (as specified)
 * ──────────────────────────────
 *   approved  → active
 *   pending   → cancelled
 *   rejected  → cancelled
 *   cancelled → cancelled   (already valid under the new enum — left as-is)
 *
 * IMPORTANT — WHAT "BACKFILL" ACTUALLY MEANS HERE
 * ──────────────────────────────────────────────
 * There is no real payment behind any of this historical data. For
 * `approved → active` documents, this script creates a Payment record
 * marked `gateway: 'migration-backfill'` so it is unmistakably NOT a real
 * transaction, using the course's current price as the amount (the actual
 * historical price paid, if different, is not recoverable — it was never
 * stored). For `pending`/`rejected` → `cancelled` documents, amount is set
 * to 0 and a minimal placeholder Payment is created, since the new schema
 * requires the field to exist but these enrollments were never paid for.
 *
 * Treat every Payment created by this script as a bookkeeping placeholder,
 * not a real transaction. Do NOT include `gateway: 'migration-backfill'`
 * records in revenue totals.
 *
 * IDEMPOTENCY
 * ───────────
 * Only Enrollment documents that are MISSING `paymentId` are touched.
 * Running this script multiple times is safe — already-migrated documents
 * (which now have a paymentId) are skipped on every subsequent run.
 *
 * USAGE
 * ─────
 *   node migrations/001-enrollment-status-and-payment-backfill.js
 *   node migrations/001-enrollment-status-and-payment-backfill.js --dry-run
 *
 * --dry-run prints exactly what would change without writing anything.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const { connectDatabase } = require('../config/database');

const Enrollment = require('../models/Enrollment');
const Payment     = require('../models/Payment');
const Course      = require('../models/Course');

const DRY_RUN = process.argv.includes('--dry-run');

const STATUS_MAP = {
  approved: 'active',
  pending:  'cancelled',
  rejected: 'cancelled',
  // 'cancelled' is already valid under the new enum and is left unmapped —
  // documents with this status still go through the paymentId/amount
  // backfill below if they're missing those fields, but their status string
  // itself is untouched.
};

async function migrate() {
  console.log(DRY_RUN ? '🔎 DRY RUN — no writes will be made.\n' : '🚀 Running migration (live writes enabled).\n');

  // Only documents missing paymentId are candidates — this is the
  // idempotency guard. Mongoose schema validation on Enrollment.find()
  // is not invoked by reads, so this query is safe even though existing
  // old-shape documents would fail validation if saved as-is.
  const candidates = await Enrollment.find({ paymentId: { $exists: false } }).lean();

  if (candidates.length === 0) {
    console.log('✅ No documents need migration. Nothing to do.');
    return { migrated: 0, skipped: 0 };
  }

  console.log(`Found ${candidates.length} Enrollment document(s) missing paymentId.\n`);

  let migrated = 0;
  let skipped = 0;

  for (const doc of candidates) {
    const oldStatus = doc.status;
    const newStatus = STATUS_MAP[oldStatus] || (oldStatus === 'cancelled' ? 'cancelled' : null);

    if (!newStatus) {
      console.warn(`⚠️  Skipping Enrollment ${doc._id} — unrecognised status "${oldStatus}". Investigate manually.`);
      skipped++;
      continue;
    }

    const wasApproved = oldStatus === 'approved';
    let amount = 0;

    if (wasApproved) {
      // Use the course's CURRENT price as a best-effort stand-in.
      // The actual historical price paid (if it ever differed) was never
      // recorded anywhere and cannot be recovered.
      const course = await Course.findById(doc.courseId).lean();
      amount = course ? course.price : 0;
    }

    console.log(
      `${DRY_RUN ? '[DRY RUN] Would migrate' : 'Migrating'} Enrollment ${doc._id}: ` +
      `status "${oldStatus}" → "${newStatus}", amount=${amount}` +
      (wasApproved ? ' (backfilled from course price)' : ' (no real payment existed)')
    );

    if (DRY_RUN) {
      migrated++;
      continue;
    }

    // Create the placeholder Payment first so we have its _id to link.
    const payment = new Payment({
      studentId:     doc.studentId,
      courseId:      doc.courseId,
      studentName:   doc.studentName,
      studentEmail:  doc.studentEmail,
      courseTitle:   doc.courseTitle,
      amount,
      paymentMethod: 'upi', // placeholder — real method was never recorded for old data
      transactionId: `MIGRATION-${doc._id}`,
      paymentStatus: wasApproved ? 'success' : 'failed',
      paidAt:        wasApproved ? (doc.createdAt || new Date()) : undefined,
      gateway:       'migration-backfill', // clearly marks this as NOT a real transaction
    });

    await payment.save();

    await Enrollment.updateOne(
      { _id: doc._id },
      {
        $set: {
          status:    newStatus,
          paymentId: payment._id,
          amount,
        },
      }
    );

    // Record the original status in a separate, schema-less audit
    // collection — NOT on the Enrollment document itself. Adding a new
    // field to the Enrollment model would mean modifying application code
    // (models/Enrollment.js), which this migration is scoped to avoid.
    // Writing through the raw collection (not a Mongoose model) sidesteps
    // any strict-mode field stripping entirely, so this is reliable
    // without needing a live DB to verify casting behavior.
    await mongoose.connection.collection('migration_001_audit_log').insertOne({
      enrollmentId:     doc._id,
      originalStatus:   oldStatus,
      migratedStatus:   newStatus,
      paymentId:        payment._id,
      migratedAt:       new Date(),
    });

    migrated++;
  }

  console.log(`\n${DRY_RUN ? '🔎 Dry run complete.' : '✅ Migration complete.'} Migrated: ${migrated}, Skipped: ${skipped}.`);
  return { migrated, skipped };
}

async function run() {
  try {
    await connectDatabase();
    await migrate();
  } catch (err) {
    console.error('\n❌ Migration failed:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed.');
  }
}

run();
