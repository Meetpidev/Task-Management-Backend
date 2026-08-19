const mongoose = require('mongoose');

const timeEntrySchema = new mongoose.Schema(
  {
    task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    description: { type: String, default: '' },
    hours: { type: Number, required: [true, 'Hours is required'], min: 0.1 },
    date: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

timeEntrySchema.post('save', async function () {
  await syncTaskHours(this.task);
});
timeEntrySchema.post('findOneAndDelete', async function (doc) {
  if (doc) await syncTaskHours(doc.task);
});

async function syncTaskHours(taskId) {
  const TimeEntry = mongoose.model('TimeEntry');
  const Task = mongoose.model('Task');
  const result = await TimeEntry.aggregate([
    { $match: { task: taskId } },
    { $group: { _id: '$task', total: { $sum: '$hours' } } },
  ]);
  const total = result.length ? result[0].total : 0;
  await Task.findByIdAndUpdate(taskId, { actualHours: total });
}

module.exports = mongoose.model('TimeEntry', timeEntrySchema);