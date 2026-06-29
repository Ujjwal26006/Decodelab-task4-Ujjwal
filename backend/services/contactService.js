'use strict';

const ContactMessage = require('../models/ContactMessage');

async function createContactMessage(data) {
  const msg = new ContactMessage(data);
  return msg.save();
}

async function getAllContactMessages() {
  return ContactMessage.find().sort({ createdAt: -1 }).lean();
}

module.exports = { createContactMessage, getAllContactMessages };
