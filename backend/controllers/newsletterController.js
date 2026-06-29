'use strict';

const { subscribe } = require('../services/newsletterService');
const { sanitizeObject } = require('../utils/sanitizer');
const { validateNewsletter } = require('../validators/inputValidators');
const { sendSuccess, sendError } = require('../utils/response');

async function subscribeHandler(req, res, next) {
  try {
    const sanitized = sanitizeObject(req.body);
    const { valid, errors } = validateNewsletter(sanitized);
    if (!valid) return sendError(res, 400, 'Validation failed', errors);

    const subscriber = await subscribe(sanitized.email);
    sendSuccess(res, 201, 'You have successfully subscribed to the SkillForge Academy newsletter.', {
      email: subscriber.email,
    });
  } catch (err) { next(err); }
}

module.exports = { subscribeHandler };
