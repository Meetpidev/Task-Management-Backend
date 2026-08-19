const express = require('express');
const router = express.Router();
const { getTask, updateTask, deleteTask } = require('../controllers/taskController');
const { protect } = require('../middleware/auth');
const timeEntryRouter = require('./timeEntryRoutes');

router.use(protect);

// nested route: /api/tasks/:taskId/time-entries
router.use('/:taskId/time-entries', timeEntryRouter);

router.route('/:id').get(getTask).put(updateTask).delete(deleteTask);

module.exports = router;