const express = require('express');
const router = express.Router();
const { authenticate, authorizeRole } = require('../middleware/auth');
const { getMyJobs, updateJobStatus, assignJob } = require('../controllers/jobController');
router.get('/my-jobs', authenticate, authorizeRole('worker'), getMyJobs);
router.put('/:id/status', authenticate, authorizeRole('worker'), updateJobStatus);
router.post('/assign', authenticate, authorizeRole('admin'), assignJob);
module.exports = router;
