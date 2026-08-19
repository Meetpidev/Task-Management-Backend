const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Title is required'], trim: true },
    description: { type: String, required: [true, 'Description is required'], trim: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: [true, 'Assignee is required'] },
    status: {
      type: String,
      enum: ['todo', 'in-progress', 'review', 'done'],
      required: [true, 'Status is required'],
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      required: [true, 'Priority is required'],
    },
    dueDate: { type: Date, required: [true, 'Due date is required'] },
    estimatedHours: { type: Number, required: [true, 'Estimated hours is required'], min: 0 },
    actualHours: { type: Number, min: 0, default: 0 },
    tags: [{ type: String, trim: true }],
  },
  { timestamps: true }
);

taskSchema.index({ project: 1, status: 1, priority: 1, assignee: 1 });

module.exports = mongoose.model('Task', taskSchema);
