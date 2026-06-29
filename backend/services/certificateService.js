'use strict';

const Certificate = require('../models/Certificate');

/**
 * Returns all certificates for a student, populated with course info.
 * @param {string} studentId
 * @returns {Promise<Array>}
 */
async function getStudentCertificates(studentId) {
  return Certificate.find({ studentId })
    .populate('courseId', 'title category duration image')
    .sort({ issuedAt: -1 })
    .lean();
}

/**
 * Returns a single certificate by its certificate number.
 * @param {string} certNumber
 * @returns {Promise<Object|null>}
 */
async function getCertificateByNumber(certNumber) {
  return Certificate.findOne({ certificateNumber: certNumber })
    .populate('courseId', 'title category duration')
    .lean();
}

module.exports = { getStudentCertificates, getCertificateByNumber };
