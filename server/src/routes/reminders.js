const express = require('express');
const { body, validationResult } = require('express-validator');
const Reminder = require('../models/Reminder');
const Task = require('../models/Task');
const auth = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();
router.use(auth);

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
  }
  next();
}

/** GET /api/reminders — list my reminders (?upcoming=true for pending future ones) */
router.get('/', asyncHandler(async (req, res) => {
  const filter = { owner: req.user._id };
  if (req.query.upcoming === 'true') {
    filter.sent = false;
    filter.remindAt = { $gte: new Date() };
  }
  const reminders = await Reminder.find(filter)
    .populate('task', 'title dueDate status')
    .sort({ remindAt: 1 });
  res.json(reminders);
}));

/** POST /api/reminders — create a reminder { task, remindAt, note? } */
router.post(
  '/',
  body('task').notEmpty().withMessage('Task is required'),
  body('remindAt').isISO8601().withMessage('remindAt must be a valid date'),
  body('note').optional().trim(),
  validate,
  asyncHandler(async (req, res) => {
    const task = await Task.findById(req.body.task);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (!task.owner.equals(req.user._id)) {
      return res.status(403).json({ message: 'You can only set reminders on your own tasks' });
    }
    const reminder = await Reminder.create({
      task: task._id,
      owner: req.user._id,
      remindAt: new Date(req.body.remindAt),
      note: req.body.note,
    });
    await reminder.populate('task', 'title dueDate status');
    res.status(201).json(reminder);
  })
);

/** DELETE /api/reminders/:id — delete a reminder */
router.delete('/:id', asyncHandler(async (req, res) => {
  const reminder = await Reminder.findOne({ _id: req.params.id, owner: req.user._id });
  if (!reminder) return res.status(404).json({ message: 'Reminder not found' });
  await reminder.deleteOne();
  res.json({ message: 'Reminder deleted' });
}));

module.exports = router;
