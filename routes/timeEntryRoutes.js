const express = require('express');
const router = express.Router({ mergeParams: true });
const { getTimeEntries, addTimeEntry } = require('../controllers/timeEntryController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/').get(getTimeEntries).post(addTimeEntry);

module.exports = router;