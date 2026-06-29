'use strict';

const Subscriber = require('../models/Subscriber');

/**
 * Subscribes an email. The unique index on Subscriber.email
 * will throw error code 11000 if already subscribed —
 * caught and converted to 409 by globalErrorHandler.
 * @param {string} email
 * @returns {Promise<Object>}
 */
async function subscribe(email) {
  const subscriber = new Subscriber({ email: email.toLowerCase().trim() });
  return subscriber.save();
}

async function getAllSubscribers() {
  return Subscriber.find().sort({ createdAt: -1 }).lean();
}

module.exports = { subscribe, getAllSubscribers };
