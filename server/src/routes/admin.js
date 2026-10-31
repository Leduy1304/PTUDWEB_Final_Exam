const express = require('express');
const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Reminder = require('../models/Reminder');
const auth = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

// Every route in this file requires a logged-in system administrator.
router.use(auth, requireAdmin);

/** GET /api/admin/stats — system-wide counters for the admin dashboard. */
router.get('/stats', asyncHandler(async (req, res) => {
  const now = new Date();
  const [users, projects, tasks, todo, inProgress, done, overdue] = await Promise.all([
    User.countDocuments(),
    Project.countDocuments(),
    Task.countDocuments(),
    Task.countDocuments({ status: 'todo' }),
    Task.countDocuments({ status: 'in-progress' }),
    Task.countDocuments({ status: 'done' }),
    Task.countDocuments({ dueDate: { $lt: now }, status: { $ne: 'done' } }),
  ]);
  res.json({
    users,
    projects,
    tasks,
    tasksByStatus: { todo, 'in-progress': inProgress, done },
    overdue,
  });
}));

/** GET /api/admin/users — every account (password hashes never leave the server). */
router.get('/users', asyncHandler(async (req, res) => {
  const users = await User.find().select('-passwordHash').sort({ createdAt: 1 });
  res.json(users);
}));

/** PATCH /api/admin/users/:id/role — promote/demote a user. Body: { role } */
router.patch('/users/:id/role', asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!['user', 'admin'].includes(role)) {
    return res.status(400).json({ message: 'Role must be "user" or "admin"' });
  }
  const target = await User.findById(req.params.id);
  if (!target) return res.status(404).json({ message: 'User not found' });

  // Guard: never leave the system without an admin. This also covers an
  // admin trying to demote themselves when they are the only admin left.
  if (target.role === 'admin' && role === 'user') {
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount <= 1) {
      return res.status(400).json({ message: 'Cannot demote the last admin' });
    }
  }

  target.role = role;
  await target.save();
  const { passwordHash, ...safe } = target.toObject();
  res.json(safe);
}));

/**
 * DELETE /api/admin/users/:id — remove a user and clean up their data.
 *
 * Cascade choice (kept deliberately simple and predictable):
 *  - Projects the user OWNS are deleted together with all tasks inside them.
 *  - Tasks the user owns elsewhere, and all of the user's reminders, are deleted.
 *  - Tasks in other people's projects that were only ASSIGNED to this user are
 *    kept but unassigned (they belong to someone else's project).
 *  - The user is removed from the member list of every remaining project.
 *  - Reminders attached to any deleted task are deleted too.
 * An admin cannot delete themselves, and the last admin cannot be deleted.
 */
router.delete('/users/:id', asyncHandler(async (req, res) => {
  if (req.params.id === req.user._id.toString()) {
    return res.status(400).json({ message: 'You cannot delete your own account' });
  }
  const target = await User.findById(req.params.id);
  if (!target) return res.status(404).json({ message: 'User not found' });

  if (target.role === 'admin') {
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount <= 1) {
      return res.status(400).json({ message: 'Cannot delete the last admin' });
    }
  }

  const uid = target._id;

  // Projects owned by the user go away with everything inside them.
  const ownedProjects = await Project.find({ owner: uid }).select('_id');
  const ownedProjectIds = ownedProjects.map((p) => p._id);
  const projectTasks = await Task.find({ project: { $in: ownedProjectIds } }).select('_id');
  const projectTaskIds = projectTasks.map((t) => t._id);

  // Tasks the user owns personally (no project, or in someone else's project).
  const ownTasks = await Task.find({ owner: uid }).select('_id');
  const ownTaskIds = ownTasks.map((t) => t._id);

  const doomedTaskIds = [...new Set([...projectTaskIds, ...ownTaskIds].map(String))];
  await Reminder.deleteMany({
    $or: [{ owner: uid }, { task: { $in: doomedTaskIds } }],
  });
  await Task.deleteMany({ _id: { $in: doomedTaskIds } });
  await Project.deleteMany({ _id: { $in: ownedProjectIds } });

  // Remaining tasks only assigned to this user: keep them, clear the assignee.
  await Task.updateMany({ assignee: uid }, { $unset: { assignee: '' } });
  // Drop the user from every project's member list.
  await Project.updateMany({ members: uid }, { $pull: { members: uid } });

  await target.deleteOne();
  res.json({ message: 'User deleted' });
}));

/** GET /api/admin/projects — every project with owner info + member count. */
router.get('/projects', asyncHandler(async (req, res) => {
  const projects = await Project.find()
    .populate('owner', 'name email')
    .sort({ createdAt: -1 })
    .lean();
  // Members list does not include the owner (implicit member), so +1.
  res.json(projects.map((p) => ({ ...p, memberCount: (p.members?.length || 0) + 1 })));
}));

/** GET /api/admin/tasks — every task; optional ?status= filter. */
router.get('/tasks', asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  const tasks = await Task.find(filter)
    .populate('project', 'name')
    .populate('assignee', 'name email')
    .populate('owner', 'name email')
    .sort({ createdAt: -1 });
  res.json(tasks);
}));

module.exports = router;
