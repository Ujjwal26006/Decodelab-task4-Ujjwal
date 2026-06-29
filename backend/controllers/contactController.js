'use strict';

const { createContactMessage } = require('../services/contactService');
const { sanitizeObject } = require('../utils/sanitizer');
const { validateContact } = require('../validators/inputValidators');
const { sendSuccess, sendError } = require('../utils/response');

async function submitContact(req, res, next) {
  try {
    const sanitized = sanitizeObject(req.body);
    const { valid, errors } = validateContact(sanitized);
    if (!valid) return sendError(res, 400, 'Validation failed', errors);

    const msg = await createContactMessage(sanitized);
    sendSuccess(res, 201, 'Your message has been received. We will get back to you within 24 hours.', {
      referenceId: msg._id,
    });
  } catch (err) { next(err); }
}

module.exports = { submitContact };
