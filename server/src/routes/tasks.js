const express = require('express');
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const Project = require('../models/Project');
const auth = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();
router.use(auth);

const STATUSES = ['todo', 'in-progress', 'done'];
const PRIORITIES = ['low', 'medium', 'high'];

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
  }
  next();
}

/**
 * Load a task the requester may access: their own tasks, plus tasks in any
 * project they belong to (team collaboration).
 */
async function getTaskForUser(taskId, userId) {
  const task = await Task.findById(taskId)
    .populate('assignee', 'name email')
    .populate('project');
  if (!task) {
    const e = new Error('Task not found');
    e.statusCode = 404;
    throw e;
  }
  let allowed = task.owner.equals(userId);
  if (!allowed && task.project && task.project.isMember(userId)) allowed = true;
  if (!allowed) {
    const e = new Error('Access denied');
    e.statusCode = 403;
    throw e;
  }
  return task;
}

/**
 * GET /api/tasks — list my tasks with filters:
 *   status, priority, project, assignee, dueBefore, dueAfter,
 *   overdue=true, dueToday=true, q (title search), includeShared=true
 */
router.get('/', asyncHandler(async (req, res) => {
  const { status, priority, project, assignee, dueBefore, dueAfter, overdue, dueToday, q, includeShared } = req.query;

  const ownerFilter = { owner: req.user._id };
  if (includeShared === 'true') {
    const myProjects = await Project.find({
      $or: [{ owner: req.user._id }, { members: req.user._id }],
    }).select('_id');
    ownerFilter.$or = [
      { owner: req.user._id },
      { project: { $in: myProjects.map((p) => p._id) } },
    ];
    delete ownerFilter.owner;
  }

  const filter = { ...ownerFilter };
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (project) filter.project = project;
  if (assignee) filter.assignee = assignee;
  if (q) filter.title = { $regex: q, $options: 'i' };
  if (dueBefore) filter.dueDate = { ...(filter.dueDate || {}), $lte: new Date(dueBefore) };
  if (dueAfter) filter.dueDate = { ...(filter.dueDate || {}), $gte: new Date(dueAfter) };
  if (overdue === 'true') {
    filter.dueDate = { ...(filter.dueDate || {}), $lt: new Date() };
    filter.status = { $ne: 'done' };
  }
  if (dueToday === 'true') {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date(); end.setHours(23, 59, 59, 999);
    filter.dueDate = { $gte: start, $lte: end };
  }

  const tasks = await Task.find(filter)
    .populate('assignee', 'name email')
    .populate('project', 'name color')
    .sort({ dueDate: 1, createdAt: -1 });
  res.json(tasks);
}));

/** POST /api/tasks — create a task */
router.post(
  '/',
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('status').optional().isIn(STATUSES).withMessage('Invalid status'),
  body('priority').optional().isIn(PRIORITIES).withMessage('Invalid priority'),
  body('dueDate').optional({ values: 'falsy' }).isISO8601().withMessage('dueDate must be a valid date'),
  validate,
  asyncHandler(async (req, res) => {
    const { title, description, status, priority, dueDate, assignee, project, labels, subtasks } = req.body;

    if (project) {
      const p = await Project.findById(project);
      if (!p) return res.status(404).json({ message: 'Project not found' });
      if (!p.isMember(req.user._id)) {
        return res.status(403).json({ message: 'You are not a member of this project' });
      }
      if (assignee && !p.isMember(assignee)) {
        return res.status(400).json({ message: 'Assignee must be a project member' });
      }
    }

    const task = await Task.create({
      title,
      description,
      status,
      priority,
      dueDate: dueDate || undefined,
      assignee: assignee || undefined,
      project: project || undefined,
      labels,
      subtasks: Array.isArray(subtasks) ? subtasks.filter((s) => s && s.title) : undefined,
      owner: req.user._id,
    });
    await task.populate('assignee', 'name email');
    await task.populate('project', 'name color');
    res.status(201).json(task);
  })
);

/** GET /api/tasks/:id — task detail */
router.get('/:id', asyncHandler(async (req, res) => {
  res.json(await getTaskForUser(req.params.id, req.user._id));
}));

/** PATCH /api/tasks/:id — update a task (assign, move status, edit fields) */
router.patch(
  '/:id',
  body('status').optional().isIn(STATUSES).withMessage('Invalid status'),
  body('priority').optional().isIn(PRIORITIES).withMessage('Invalid priority'),
  body('dueDate').optional({ values: 'falsy' }).isISO8601().withMessage('dueDate must be a valid date'),
  validate,
  asyncHandler(async (req, res) => {
    const task = await getTaskForUser(req.params.id, req.user._id);
    const { title, description, status, priority, dueDate, assignee, labels, project } = req.body;

    if (project !== undefined) {
      if (project) {
        const p = await Project.findById(project);
        if (!p) return res.status(404).json({ message: 'Project not found' });
        if (!p.isMember(req.user._id)) {
          return res.status(403).json({ message: 'You are not a member of this project' });
        }
        task.project = project;
      } else {
        task.project = undefined;
      }
    }
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (status !== undefined) task.status = status;
    if (priority !== undefined) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = dueDate || undefined;
    if (labels !== undefined) task.labels = labels;
    if (assignee !== undefined) {
      if (assignee) {
        // Assignee must belong to the task's project when there is one.
        const proj = task.project
          ? await Project.findById(task.project)
          : null;
        if (proj && !proj.isMember(assignee)) {
          return res.status(400).json({ message: 'Assignee must be a project member' });
        }
      }
      task.assignee = assignee || undefined;
    }

    await task.save();
    await task.populate('assignee', 'name email');
    await task.populate('project', 'name color');
    res.json(task);
  })
);

/** DELETE /api/tasks/:id — owner only */
router.delete('/:id', asyncHandler(async (req, res) => {
  const task = await getTaskForUser(req.params.id, req.user._id);
  if (!task.owner.equals(req.user._id)) {
    return res.status(403).json({ message: 'Only the task owner can delete it' });
  }
  await task.deleteOne();
  res.json({ message: 'Task deleted' });
}));

/** POST /api/tasks/:id/subtasks — add a subtask { title } */
router.post(
  '/:id/subtasks',
  body('title').trim().notEmpty().withMessage('Subtask title is required'),
  validate,
  asyncHandler(async (req, res) => {
    const task = await getTaskForUser(req.params.id, req.user._id);
    task.subtasks.push({ title: req.body.title });
    await task.save();
    res.status(201).json(task);
  })
);

/** PATCH /api/tasks/:id/subtasks/:subId — toggle a subtask { done } */
router.patch('/:id/subtasks/:subId', asyncHandler(async (req, res) => {
  const task = await getTaskForUser(req.params.id, req.user._id);
  const sub = task.subtasks.id(req.params.subId);
  if (!sub) return res.status(404).json({ message: 'Subtask not found' });
  if (req.body.done !== undefined) sub.done = !!req.body.done;
  await task.save();
  res.json(task);
}));

/** DELETE /api/tasks/:id/subtasks/:subId — remove a subtask */
router.delete('/:id/subtasks/:subId', asyncHandler(async (req, res) => {
  const task = await getTaskForUser(req.params.id, req.user._id);
  const sub = task.subtasks.id(req.params.subId);
  if (!sub) return res.status(404).json({ message: 'Subtask not found' });
  sub.deleteOne();
  await task.save();
  res.json(task);
}));

module.exports = router;
