const Task = require('../models/Task');
const Project = require('../models/Project');
const { hasAccess } = require('./projectController');
const { getPagination, buildPaginationMeta } = require('../utils/pagination');

const getIdString = (value) => (value?._id || value || '').toString();

const checkProjectAccess = async (projectId, user) => {
  const project = await Project.findById(projectId);
  if (!project) return { error: 'Project not found', code: 404 };
  if (!hasAccess(project, user)) return { error: 'Not authorized for this project', code: 403 };
  return { project };
};

const requireText = (value, field) => {
  if (typeof value !== 'string' || !value.trim()) return `${field} is required`;
  return null;
};

const requireNumber = (value, field) => {
  if (value === undefined || value === null || value === '' || Number(value) < 0) {
    return `${field} is required`;
  }
  return null;
};

const validators = {
  title: (value) => requireText(value, 'Title'),
  description: (value) => requireText(value, 'Description'),
  assignee: (value) => requireText(value, 'Assignee'),
  status: (value) => requireText(value, 'Status'),
  priority: (value) => requireText(value, 'Priority'),
  dueDate: (value) => requireText(value, 'Due date'),
  estimatedHours: (value) => requireNumber(value, 'Estimated hours'),
};

const addAssigneeToProject = async (project, assignee) => {
  if (!assignee) return;
  const exists = project.members.some((member) => getIdString(member) === getIdString(assignee));
  if (!exists) {
    project.members.push(assignee);
    await project.save();
  }
};

const getTasks = async (req, res, next) => {
  try {
    const { project, error, code } = await checkProjectAccess(req.params.projectId, req.user);
    if (error) return res.status(code).json({ success: false, message: error });

    const filter = { project: project._id };
    if (req.query.status) filter.status = req.query.status;
    if (req.query.priority) filter.priority = req.query.priority;
    if (req.query.assignee) filter.assignee = req.query.assignee;

    const { page, limit, skip } = getPagination(req.query);

    const [tasks, total] = await Promise.all([
      Task.find(filter)
        .populate('assignee', 'name email avatar')
        .sort('-createdAt')
        .skip(skip)
        .limit(limit),
      Task.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: tasks,
      pagination: buildPaginationMeta(total, page, limit),
    });
  } catch (error) {
    next(error);
  }
};

const createTask = async (req, res, next) => {
  try {
    const { project, error, code } = await checkProjectAccess(req.params.projectId, req.user);
    if (error) return res.status(code).json({ success: false, message: error });

    const { title, description, assignee, status, priority, dueDate, estimatedHours, tags } = req.body;
    const validationError =
      requireText(title, 'Title') ||
      requireText(description, 'Description') ||
      requireText(assignee, 'Assignee') ||
      requireText(status, 'Status') ||
      requireText(priority, 'Priority') ||
      requireText(dueDate, 'Due date') ||
      requireNumber(estimatedHours, 'Estimated hours');

    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    await addAssigneeToProject(project, assignee);

    const task = await Task.create({
      title: title.trim(),
      description: description.trim(),
      project: project._id,
      assignee,
      status,
      priority,
      dueDate,
      estimatedHours,
      tags,
    });

    res.status(201).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

const getTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id).populate('assignee', 'name email avatar');
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const { error, code } = await checkProjectAccess(task.project, req.user);
    if (error) return res.status(code).json({ success: false, message: error });

    res.json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const { project, error, code } = await checkProjectAccess(task.project, req.user);
    if (error) return res.status(code).json({ success: false, message: error });

    const allowedFields = [
      'title', 'description', 'assignee', 'status',
      'priority', 'dueDate', 'estimatedHours', 'tags',
    ];
    allowedFields.forEach((field) => {
      if (req.body[field] === undefined) return;
      const validationError = validators[field]?.(req.body[field]);
      if (validationError) {
        throw Object.assign(new Error(validationError), { statusCode: 400 });
      }
      task[field] = typeof req.body[field] === 'string' ? req.body[field].trim() : req.body[field];
    });
    if (req.body.assignee) await addAssigneeToProject(project, req.body.assignee);

    await task.save();
    await task.populate('assignee', 'name email avatar');
    res.json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const { error, code } = await checkProjectAccess(task.project, req.user);
    if (error) return res.status(code).json({ success: false, message: error });

    await task.deleteOne();
    res.json({ success: true, message: 'Task deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getTasks, createTask, getTask, updateTask, deleteTask, checkProjectAccess };
