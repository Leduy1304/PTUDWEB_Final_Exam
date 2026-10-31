const express = require('express');
const { body, validationResult } = require('express-validator');
const Project = require('../models/Project');
const User = require('../models/User');
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

/** Load a project and enforce that the requester is a member (throws 404/403). */
async function getProjectForUser(projectId, userId) {
  const project = await Project.findById(projectId)
    .populate('owner', 'name email')
    .populate('members', 'name email');
  if (!project) {
    const e = new Error('Project not found');
    e.statusCode = 404;
    throw e;
  }
  if (!project.isMember(userId)) {
    const e = new Error('You are not a member of this project');
    e.statusCode = 403;
    throw e;
  }
  return project;
}

/** GET /api/projects — projects I own or belong to */
router.get('/', asyncHandler(async (req, res) => {
  const projects = await Project.find({
    $or: [{ owner: req.user._id }, { members: req.user._id }],
  })
    .populate('owner', 'name email')
    .populate('members', 'name email')
    .sort({ updatedAt: -1 });
  res.json(projects);
}));

/** POST /api/projects — create a project (requester becomes owner) */
router.post(
  '/',
  body('name').trim().notEmpty().withMessage('Project name is required'),
  validate,
  asyncHandler(async (req, res) => {
    const { name, description, color } = req.body;
    const project = await Project.create({
      name,
      description,
      color,
      owner: req.user._id,
      members: [],
    });
    res.status(201).json(project);
  })
);

/** GET /api/projects/:id — project detail with members */
router.get('/:id', asyncHandler(async (req, res) => {
  res.json(await getProjectForUser(req.params.id, req.user._id));
}));

/** PATCH /api/projects/:id — rename / edit (any member) */
router.patch('/:id', asyncHandler(async (req, res) => {
  const project = await getProjectForUser(req.params.id, req.user._id);
  const { name, description, color } = req.body;
  if (name !== undefined) project.name = name;
  if (description !== undefined) project.description = description;
  if (color !== undefined) project.color = color;
  await project.save();
  res.json(project);
}));

/** DELETE /api/projects/:id — owner only; also removes the project's tasks */
router.delete('/:id', asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ message: 'Project not found' });
  if (!project.owner.equals(req.user._id)) {
    return res.status(403).json({ message: 'Only the owner can delete the project' });
  }
  await Task.deleteMany({ project: project._id });
  await project.deleteOne();
  res.json({ message: 'Project deleted' });
}));

/** POST /api/projects/:id/members — invite/add a member by email */
router.post(
  '/:id/members',
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  validate,
  asyncHandler(async (req, res) => {
    const project = await getProjectForUser(req.params.id, req.user._id);
    const invitee = await User.findOne({ email: req.body.email }).select('name email');
    if (!invitee) return res.status(404).json({ message: 'No registered user with that email' });
    if (project.isMember(invitee._id)) {
      return res.status(409).json({ message: 'User is already a member' });
    }
    project.members.push(invitee._id);
    await project.save();
    await project.populate('members', 'name email');
    res.json(project);
  })
);

/** DELETE /api/projects/:id/members/:userId — remove a member (owner, or the member themselves to leave) */
router.delete('/:id/members/:userId', asyncHandler(async (req, res) => {
  const project = await getProjectForUser(req.params.id, req.user._id);
  const targetId = req.params.userId;
  const isOwner = project.owner._id.equals(req.user._id);
  const isSelf = req.user._id.equals(targetId);
  if (!isOwner && !isSelf) {
    return res.status(403).json({ message: 'Only the owner can remove members' });
  }
  if (project.owner._id.equals(targetId)) {
    return res.status(400).json({ message: 'The owner cannot be removed' });
  }
  project.members = project.members.filter((m) => !m._id.equals(targetId));
  await project.save();
  await project.populate('members', 'name email');
  res.json(project);
}));

module.exports = router;
