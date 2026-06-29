'use strict';

const { getAllFaqs, createFaq, updateFaq, deleteFaq } = require('../services/faqService');
const { sendSuccess, sendError } = require('../utils/response');

async function getAllFaqsHandler(req, res, next) {
  try {
    const faqs = await getAllFaqs();
    sendSuccess(res, 200, 'FAQs retrieved successfully', faqs);
  } catch (err) { next(err); }
}

async function createFaqHandler(req, res, next) {
  try {
    const faq = await createFaq(req.body);
    sendSuccess(res, 201, 'FAQ created successfully', faq);
  } catch (err) { next(err); }
}

async function updateFaqHandler(req, res, next) {
  try {
    const faq = await updateFaq(req.params.id, req.body);
    if (!faq) return sendError(res, 404, `FAQ with id '${req.params.id}' was not found.`);
    sendSuccess(res, 200, 'FAQ updated successfully', faq);
  } catch (err) { next(err); }
}

async function deleteFaqHandler(req, res, next) {
  try {
    const faq = await deleteFaq(req.params.id);
    if (!faq) return sendError(res, 404, `FAQ with id '${req.params.id}' was not found.`);
    sendSuccess(res, 200, 'FAQ deleted successfully', null);
  } catch (err) { next(err); }
}

module.exports = { getAllFaqsHandler, createFaqHandler, updateFaqHandler, deleteFaqHandler };
