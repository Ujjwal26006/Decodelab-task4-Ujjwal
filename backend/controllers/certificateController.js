'use strict';

const { getStudentCertificates, getCertificateByNumber } = require('../services/certificateService');
const { sendSuccess, sendError } = require('../utils/response');

async function getMyCertificatesHandler(req, res, next) {
  try {
    const certificates = await getStudentCertificates(req.student._id);
    sendSuccess(res, 200, 'Certificates retrieved successfully.', certificates);
  } catch (err) { next(err); }
}

async function verifyCertificateHandler(req, res, next) {
  try {
    const cert = await getCertificateByNumber(req.params.certNumber);
    if (!cert) return sendError(res, 404, 'Certificate not found or invalid.');
    sendSuccess(res, 200, 'Certificate is valid.', cert);
  } catch (err) { next(err); }
}

module.exports = { getMyCertificatesHandler, verifyCertificateHandler };
