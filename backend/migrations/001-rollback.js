'use strict';

/**
 * Rollback for: 001-enrollment-status-and-payment-backfill.js
 *
 * Reverses the forward migration exactly, using the audit log it wrote
 * (collection: migration_001_audit_log) as the source of truth for what
 * to undo. This is the only reliable way to roll back, since the original
 * status string is not recoverable from the new schema alone once it has
 * been overwritten.
 *
 * For each audit log entry, this script:
 *   1. Restores Enrollment.status to the recorded originalStatus
 *   2. Removes the paymentId and amount fields the migration added
 *      (returns the document to its exact pre-migration shape)
 *   3. Deletes the synthetic Payment document the migration created
 *      (matched by _id from the audit log entry — never touches any
 *      real Payment created through the actual app)
 *   4. Deletes the audit log entry itself, once reversed
 *
 * IDEMPOTENCY
 * ───────────
 * Only documents that still have an audit log entry are processed.
 * Once an entry's rollback completes, the entry is deleted — so running
 * this script multiple times is safe; the second run simply finds
 * nothing left to do.
 *
 * SCOPE / SAFETY
 * ──────────────
 * This script ONLY touches Payment documents whose _id appears in the
 * migration_001_audit_log collection, and ONLY touches Enrollment
 * documents referenced by that same log. It will never delete or modify
 * a Payment created by a real student checkout, because real payments
 * are never written to that audit log.
 *
 * USAGE
 * ─────
 *   node migrations/001-rollback.js
 *   node migrations/001-rollback.js --dry-run
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const { connectDatabase } = require('../config/database');

const Enrollment = require('../models/Enrollment');
const Payment     = require('../models/Payment');

const DRY_RUN = process.argv.includes('--dry-run');

async function rollback() {
  console.log(DRY_RUN ? '🔎 DRY RUN — no writes will be made.\n' : '⏪ Running rollback (live writes enabled).\n');

  const auditCollection = mongoose.connection.collection('migration_001_audit_log');
  const entries = await auditCollection.find({}).toArray();

  if (entries.length === 0) {
    console.log('✅ No migration 001 audit log entries found. Nothing to roll back.');
    return { rolledBack: 0 };
  }

  console.log(`Found ${entries.length} audit log entry/entries to reverse.\n`);

  let rolledBack = 0;

  for (const entry of entries) {
    console.log(
      `${DRY_RUN ? '[DRY RUN] Would restore' : 'Restoring'} Enrollment ${entry.enrollmentId}: ` +
      `status "${entry.migratedStatus}" → "${entry.originalStatus}"; ` +
      `would delete Payment ${entry.paymentId} (gateway: migration-backfill)`
    );

    if (DRY_RUN) {
      rolledBack++;
      continue;
    }

    // 1 & 2: restore original status, strip the backfilled fields.
    await Enrollment.updateOne(
      { _id: entry.enrollmentId },
      {
        $set:   { status: entry.originalStatus },
        $unset: { paymentId: '', amount: '' },
      }
    );

    // 3: delete the synthetic Payment this migration created — scoped
    // tightly to this exact _id AND gateway, never a broad delete.
    await Payment.deleteOne({
      _id:     entry.paymentId,
      gateway: 'migration-backfill',
    });

    // 4: remove the audit log entry now that it's been reversed.
    await auditCollection.deleteOne({ _id: entry._id });

    rolledBack++;
  }

  console.log(`\n${DRY_RUN ? '🔎 Dry run complete.' : '✅ Rollback complete.'} Reversed: ${rolledBack}.`);
  return { rolledBack };
}

async function run() {
  try {
    await connectDatabase();
    await rollback();
  } catch (err) {
    console.error('\n❌ Rollback failed:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed.');
  }
}

run();
