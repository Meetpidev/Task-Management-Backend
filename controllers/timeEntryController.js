const TimeEntry = require('../models/TimeEntry');
const Task = require('../models/Task');
const { checkProjectAccess } = require('./taskController');

const getTimeEntries = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const { error, code } = await checkProjectAccess(task.project, req.user);
    if (error) return res.status(code).json({ success: false, message: error });

    const entries = await TimeEntry.find({ task: task._id })
      .populate('user', 'name email avatar')
      .sort('-date');

    res.json({ success: true, count: entries.length, data: entries });
  } catch (error) {
    next(error);
  }
};

const addTimeEntry = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const { error, code } = await checkProjectAccess(task.project, req.user);
    if (error) return res.status(code).json({ success: false, message: error });

    const { description, hours, date } = req.body;
    if (!hours) return res.status(400).json({ success: false, message: 'Hours is required' });

    const entry = await TimeEntry.create({
      task: task._id,
      user: req.user._id,
      description,
      hours,
      date: date || Date.now(),
    });

    res.status(201).json({ success: true, data: entry });
  } catch (error) {
    next(error);
  }
};

const deleteTimeEntry = async (req, res, next) => {
  try {
    const entry = await TimeEntry.findById(req.params.id);
    if (!entry) return res.status(404).json({ success: false, message: 'Time entry not found' });

    if (req.user.role !== 'admin' && entry.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this entry' });
    }

    await TimeEntry.findOneAndDelete({ _id: entry._id });
    res.json({ success: true, message: 'Time entry deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getTimeEntries, addTimeEntry, deleteTimeEntry };
