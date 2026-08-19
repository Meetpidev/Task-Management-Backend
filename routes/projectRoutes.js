const express = require('express');
const router = express.Router();
const {
  getProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject,
  addMember,
} = require('../controllers/projectController');
const { protect } = require('../middleware/auth');
const taskRouter = require('./taskRoutes');

router.use(protect);

// nested route: /api/projects/:projectId/tasks
router.use('/:projectId/tasks', taskRouter);

router.route('/').get(getProjects).post(createProject);
router.route('/:id').get(getProject).put(updateProject).delete(deleteProject);
router.post('/:id/members', addMember);

module.exports = router;