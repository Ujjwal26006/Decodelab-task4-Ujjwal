'use strict';

const mongoose = require('mongoose');

/**
 * Mongoose connection options.
 * serverSelectionTimeoutMS: fail fast in dev if Mongo isn't running.
 * socketTimeoutMS: drop idle sockets after 45s to prevent resource leaks.
 */
const CONNECTION_OPTIONS = {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

/**
 * Connects to MongoDB using the MONGO_URI environment variable.
 * Registers connection lifecycle event listeners.
 * Exits the process on initial connection failure so the error is visible immediately.
 */
async function connectDatabase() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error('❌ MONGO_URI is not defined in environment variables.');
    process.exit(1);
  }

  // ── Connection Events ──────────────────────────────────────────────────
  mongoose.connection.on('connected', () => {
    console.log(`✅ MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
  });

  mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB connection error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️  MongoDB disconnected. Mongoose will attempt to reconnect automatically.');
  });

  mongoose.connection.on('reconnected', () => {
    console.log('🔄 MongoDB reconnected.');
  });

  // Graceful shutdown — close connection when Node process terminates
  process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('🛑 MongoDB connection closed on application termination.');
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await mongoose.connection.close();
    console.log('🛑 MongoDB connection closed on SIGTERM.');
    process.exit(0);
  });

  // ── Initial Connection ─────────────────────────────────────────────────
  try {
    await mongoose.connect(uri, CONNECTION_OPTIONS);
  } catch (err) {
    console.error('❌ Failed to connect to MongoDB on startup:', err.message);
    process.exit(1);
  }
}

module.exports = { connectDatabase };
