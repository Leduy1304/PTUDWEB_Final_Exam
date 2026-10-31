const express = require('express');
const Task = require('../models/Task');
const auth = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();
router.use(auth);

/** Format a Date as an ICS UTC timestamp: 20261007T090000Z */
function icsDate(d) {
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

/** Escape text for ICS fields. */
function escapeICS(text) {
  return String(text || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * GET /api/calendar/export.ics
 * Export my tasks with due dates as an .ics file — importable into
 * Google Calendar, Apple Calendar, Outlook, etc.
 */
router.get('/export.ics', asyncHandler(async (req, res) => {
  const tasks = await Task.find({
    owner: req.user._id,
    dueDate: { $exists: true, $ne: null },
  }).sort({ dueDate: 1 });

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//TaskManager//Task Export//EN',
    'CALSCALE:GREGORIAN',
  ];
  const now = icsDate(new Date());
  for (const t of tasks) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${t._id}@taskmanager`,
      `DTSTAMP:${now}`,
      `DTSTART:${icsDate(new Date(t.dueDate))}`,
      `SUMMARY:${escapeICS(t.title)}`,
      `DESCRIPTION:${escapeICS(t.description || '')}`,
      `STATUS:${t.status === 'done' ? 'COMPLETED' : 'NEEDS-ACTION'}`,
      'END:VEVENT'
    );
  }
  lines.push('END:VCALENDAR');

  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="tasks.ics"');
  res.send(lines.join('\r\n'));
}));

/**
 * GET /api/calendar/google-link/:taskId
 * Build an "Add to Google Calendar" link for a task with a due date
 * (default 1-hour event). Returns { url } — open it in a browser.
 */
router.get('/google-link/:taskId', asyncHandler(async (req, res) => {
  const task = await Task.findOne({ _id: req.params.taskId, owner: req.user._id });
  if (!task) return res.status(404).json({ message: 'Task not found' });
  if (!task.dueDate) return res.status(400).json({ message: 'Task has no due date' });

  const start = new Date(task.dueDate);
  const end = new Date(start.getTime() + 60 * 60 * 1000); // default duration: 1 hour
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: task.title,
    dates: `${icsDate(start)}/${icsDate(end)}`,
    details: task.description || '',
  });
  res.json({ url: `https://calendar.google.com/calendar/render?${params.toString()}` });
}));

module.exports = router;
