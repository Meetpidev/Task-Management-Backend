const Project = require('../models/Project');
const Task = require('../models/Task');
const TimeEntry = require('../models/TimeEntry');

const getStats = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const isAdmin = req.user.role === 'admin';

    const projects = await Project.find(
      isAdmin ? {} : { $or: [{ owner: userId }, { members: userId }] }
    ).select('_id name');

    const projectIds = projects.map((p) => p._id);

    const [tasksByStatus, totalHoursAgg, overdueTasks, recentTasks, hoursByProject] = await Promise.all([
      Task.aggregate([
        { $match: { project: { $in: projectIds } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      TimeEntry.aggregate([
        { $match: isAdmin ? {} : { user: userId } },
        { $group: { _id: null, total: { $sum: '$hours' } } },
      ]),
      Task.countDocuments({
        project: { $in: projectIds },
        dueDate: { $lt: new Date() },
        status: { $ne: 'done' },
      }),
      Task.find({ project: { $in: projectIds } })
        .sort('-createdAt')
        .limit(5)
        .populate('assignee', 'name avatar')
        .populate('project', 'name'),
      TimeEntry.aggregate([
        { $match: isAdmin ? {} : { user: userId } },
        {
          $lookup: {
            from: 'tasks',
            localField: 'task',
            foreignField: '_id',
            as: 'taskInfo',
          },
        },
        { $unwind: '$taskInfo' },
        {
          $group: {
            _id: '$taskInfo.project',
            totalHours: { $sum: '$hours' },
          },
        },
        {
          $lookup: {
            from: 'projects',
            localField: '_id',
            foreignField: '_id',
            as: 'projectInfo',
          },
        },
        { $unwind: '$projectInfo' },
        { $project: { projectName: '$projectInfo.name', totalHours: 1 } },
      ]),
    ]);

    const statusMap = { todo: 0, 'in-progress': 0, review: 0, done: 0 };
    tasksByStatus.forEach((s) => { statusMap[s._id] = s.count; });

    res.json({
      success: true,
      data: {
        totalProjects: projects.length,
        totalTasks: Object.values(statusMap).reduce((a, b) => a + b, 0),
        totalHoursLogged: totalHoursAgg[0]?.total || 0,
        tasksByStatus: statusMap,
        overdueTasks,
        recentTasks,
        hoursByProject,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getStats };
