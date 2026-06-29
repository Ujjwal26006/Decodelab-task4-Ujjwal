'use strict';

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

/**
 * Reads a JSON data file and returns its contents.
 * @param {string} filename - Filename without path (e.g. 'courses.json')
 * @returns {Array|Object}
 */
function readData(filename) {
  const filePath = path.join(DATA_DIR, filename);
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

/**
 * Writes data to a JSON file, replacing its contents.
 * @param {string} filename
 * @param {Array|Object} data
 */
function writeData(filename, data) {
  const filePath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * Appends a single record to a JSON array stored in a file.
 * @param {string} filename
 * @param {Object} record
 * @returns {Object} The appended record
 */
function appendRecord(filename, record) {
  let collection = [];
  try {
    collection = readData(filename);
  } catch (_) {
    collection = [];
  }
  collection.push(record);
  writeData(filename, collection);
  return record;
}

/**
 * Finds a record by a field value inside a JSON array file.
 * @param {string} filename
 * @param {string} field
 * @param {*} value
 * @returns {Object|null}
 */
function findByField(filename, field, value) {
  const collection = readData(filename);
  return collection.find((item) => item[field] === value) || null;
}

/**
 * Checks whether a record with a given field value already exists.
 * @param {string} filename
 * @param {string} field
 * @param {*} value
 * @returns {boolean}
 */
function recordExists(filename, field, value) {
  return findByField(filename, field, value) !== null;
}

module.exports = { readData, writeData, appendRecord, findByField, recordExists };
