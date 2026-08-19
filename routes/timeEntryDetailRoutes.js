const express = require('express');
const router = express.Router();
const { deleteTimeEntry } = require('../controllers/timeEntryController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.delete('/:id', deleteTimeEntry);

module.exports = router;