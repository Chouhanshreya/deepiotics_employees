const express = require('express');
const router = express.Router();
const {
  getOverview,
  getTopPerformers,
  getPointsTimeline,
  getUserStats
} = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');

router.get('/overview', protect, authorize('Admin', 'TL'), getOverview);
router.get('/top-performers', protect, authorize('Admin', 'TL'), getTopPerformers);
router.get('/points-timeline', protect, authorize('Admin', 'TL'), getPointsTimeline);
router.get('/user-stats/:id?', protect, getUserStats);

module.exports = router;
