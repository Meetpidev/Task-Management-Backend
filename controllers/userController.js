const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');

const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('name email avatar role').sort('name');
    res.json({ success: true, count: users.length, data: users });
  } catch (error) {
    next(error);
  }
};

const getAdminUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('name email avatar role createdAt').sort('name').lean();

    const data = await Promise.all(
      users.map(async (user) => {
        const projects = await Project.find({
          $or: [{ owner: user._id }, { members: user._id }],
        })
          .select('name description status owner members createdAt')
          .populate('owner', 'name email avatar role')
          .populate('members', 'name email avatar role')
          .lean();

        const projectIds = projects.map((project) => project._id);
        const tasks = await Task.find({
          $or: [{ project: { $in: projectIds } }, { assignee: user._id }],
        })
          .select('title description project assignee status priority dueDate estimatedHours actualHours createdAt')
          .populate('project', 'name')
          .populate('assignee', 'name email avatar role')
          .sort('-createdAt')
          .lean();

        return { ...user, projects, tasks };
      })
    );

    res.json({ success: true, count: data.length, data });
  } catch (error) {
    next(error);
  }
};

module.exports = { getUsers, getAdminUsers };
