const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');

const getIdString = (value) => {
  if (!value) return '';
  return (value._id || value).toString();
};

const isValidDescription = (description) =>
  typeof description === 'string' && description.trim().length >= 10;

const hasAccess = (project, userId) => {
  const currentUserId = getIdString(userId);
  if (userId?.role === 'admin') return true;
  return (
    getIdString(project.owner) === currentUserId ||
    project.members.some((member) => getIdString(member) === currentUserId)
  );
};

const getProjects = async (req, res, next) => {
  try {
    const filter = req.user.role === 'admin'
      ? {}
      : { $or: [{ owner: req.user._id }, { members: req.user._id }] };

    const projects = await Project.find(filter)
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar')
      .sort('-createdAt');

    res.json({ success: true, count: projects.length, data: projects });
  } catch (error) {
    next(error);
  }
};

const createProject = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ success: false, message: 'Project name is required' });
    }
    if (!isValidDescription(description)) {
      return res.status(400).json({
        success: false,
        message: 'Project description must be at least 10 characters long',
      });
    }

    const project = await Project.create({
      name: name.trim(),
      description: description.trim(),
      owner: req.user._id,
      members: [req.user._id],
    });

    res.status(201).json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
};

const getProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    if (!hasAccess(project, req.user)) {
      return res.status(403).json({ success: false, message: 'Not authorized to access this project' });
    }

    await project.populate('owner', 'name email avatar');
    await project.populate('members', 'name email avatar');

    res.json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
};

const updateProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    if (req.user.role !== 'admin' && project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the owner can update this project' });
    }

    const { name, description, status } = req.body;
    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({ success: false, message: 'Project name is required' });
      }
      project.name = name.trim();
    }
    if (description !== undefined) {
      if (!isValidDescription(description)) {
        return res.status(400).json({
          success: false,
          message: 'Project description must be at least 10 characters long',
        });
      }
      project.description = description.trim();
    }
    if (status !== undefined) project.status = status;

    await project.save();
    res.json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
};

const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only admins can delete projects' });
    }

    await Task.deleteMany({ project: project._id });
    await project.deleteOne();

    res.json({ success: true, message: 'Project and its tasks deleted' });
  } catch (error) {
    next(error);
  }
};

const addMember = async (req, res, next) => {
  try {
    const { email } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    if (req.user.role !== 'admin' && project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the owner can add members' });
    }

    const user = await User.findOne({ email: email?.toLowerCase() });
    if (!user) return res.status(404).json({ success: false, message: 'User with that email not found' });

    if (project.members.some((m) => m.toString() === user._id.toString())) {
      return res.status(400).json({ success: false, message: 'User is already a member' });
    }

    project.members.push(user._id);
    await project.save();

    res.json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject,
  addMember,
  hasAccess,
};
