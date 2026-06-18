const express = require('express');
const router = express.Router();
const {
  calculateRankingsHandler,
  getRankings,
  getLiveRankings
} = require('../controllers/rankingsController');
const { protect, authorize } = require('../middleware/auth');

// GET /api/rankings/live — real-time current month leader (no calculate needed)
router.get('/live', protect, getLiveRankings);

// POST /api/rankings/calculate
router.post('/calculate', protect, authorize('Admin'), calculateRankingsHandler);

// GET /api/rankings?month=M&year=Y
router.get('/', protect, getRankings);

module.exports = router;
