const express = require('express');
const router = express.Router();
const { authenticate, authorizeRole } = require('../middleware/auth');
const { getAllUsers, getAllWorkers, getAllRequests, toggleWorkerAvailability } = require('../controllers/adminController');
router.get('/users', authenticate, authorizeRole('admin'), getAllUsers);
router.get('/workers', authenticate, authorizeRole('admin'), getAllWorkers);
router.get('/requests', authenticate, authorizeRole('admin'), getAllRequests);
router.put('/workers/:id/toggle-availability', authenticate, authorizeRole('admin'), toggleWorkerAvailability);
module.exports = router;
