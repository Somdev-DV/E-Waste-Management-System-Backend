const express = require('express');
const router = express.Router();
const { authenticate, authorizeRole } = require('../middleware/auth');
const { getUserDashboard, getWorkerDashboard, getAdminDashboard } = require('../controllers/dashboardController');
router.get('/user', authenticate, authorizeRole('user'), getUserDashboard);
router.get('/worker', authenticate, authorizeRole('worker'), getWorkerDashboard);
router.get('/admin', authenticate, authorizeRole('admin'), getAdminDashboard);
module.exports = router;
