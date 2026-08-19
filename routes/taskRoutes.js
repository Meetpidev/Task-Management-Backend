const express = require('express');
const router = express.Router({ mergeParams: true });
const { getTasks, createTask } = require('../controllers/taskController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/').get(getTasks).post(createTask);

module.exports = router;