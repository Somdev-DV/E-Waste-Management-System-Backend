const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { createPickupRequest, getMyRequests, getAvailableWorkers } = require('../controllers/pickupController');
router.post('/request', authenticate, createPickupRequest);
router.get('/my-requests', authenticate, getMyRequests);
router.get('/available-workers', authenticate, getAvailableWorkers);
module.exports = router;
