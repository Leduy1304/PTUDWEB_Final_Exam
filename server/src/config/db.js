const mongoose = require('mongoose');

/**
 * Connect to MongoDB. Throws a descriptive error when MONGO_URI is missing
 * so the startup message tells the user exactly what to do.
 */
async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error(
      'MONGO_URI is not set. Copy server/.env.example to server/.env and set MONGO_URI ' +
      '(local: mongodb://localhost:27017/taskmanager, or a MongoDB Atlas connection string).'
    );
  }
  await mongoose.connect(uri);
  console.log('✅ MongoDB connected');
}

module.exports = connectDB;
