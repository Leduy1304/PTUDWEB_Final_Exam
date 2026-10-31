require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const startReminderJob = require('./jobs/reminderJob');

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => res.json({ ok: true, service: 'task-manager-api' }));

// API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/reminders', require('./routes/reminders'));
app.use('/api/calendar', require('./routes/calendar'));
app.use('/api/admin', require('./routes/admin'));

// 404 for unknown API routes
app.use('/api', (req, res) => res.status(404).json({ message: 'API route not found' }));

// Central error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

/**
 * Bootstrap an administrator: if NO user has role "admin" yet, promote the
 * earliest-registered user. This guarantees the app owner can always reach
 * the admin area on an existing database. Failures are non-fatal — when the
 * DB is unavailable we simply skip and try again on the next boot.
 */
async function ensureAdminExists() {
  try {
    const User = require('./models/User');
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount > 0) return;
    const earliest = await User.findOne().sort({ createdAt: 1 });
    if (!earliest) return; // No users yet — nothing to promote.
    earliest.role = 'admin';
    await earliest.save();
    console.log(`👑 Promoted ${earliest.email} to admin (no admin existed)`);
  } catch (err) {
    console.error('⚠️  Admin bootstrap skipped: ' + err.message);
  }
}

(async () => {
  let dbConnected = false;
  try {
    await connectDB();
    dbConnected = true;
  } catch (err) {
    // Degrade gracefully: the API still boots so the failure is visible,
    // but data endpoints will error until MONGO_URI is configured.
    console.error('⚠️  ' + err.message);
  }

  if (dbConnected) await ensureAdminExists();

  // The reminder scheduler runs regardless; without a DB it just logs failures.
  startReminderJob();

  app.listen(PORT, () => {
    console.log(`🚀 API listening on http://localhost:${PORT}`);
  });
})();
