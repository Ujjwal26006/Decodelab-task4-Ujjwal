'use strict';

const FAQ = require('../models/FAQ');

async function getAllFaqs() {
  return FAQ.find().sort({ order: 1, createdAt: 1 }).lean();
}

async function createFaq(data) {
  const faq = new FAQ(data);
  return faq.save();
}

async function updateFaq(id, data) {
  return FAQ.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true, runValidators: true }
  ).lean();
}

async function deleteFaq(id) {
  return FAQ.findByIdAndDelete(id).lean();
}

module.exports = { getAllFaqs, createFaq, updateFaq, deleteFaq };
