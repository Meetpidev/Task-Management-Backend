const express = require('express');
const router = express.Router();
const { getUsers, getAdminUsers } = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', protect, getUsers);
router.get('/admin', protect, adminOnly, getAdminUsers);

module.exports = router;
