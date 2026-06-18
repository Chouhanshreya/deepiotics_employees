const express = require('express');
const router = express.Router();
const { getAnalysis, getTopPerformersByRange } = require('../controllers/analysisController');
const { protect, authorize } = require('../middleware/auth');

// GET /api/analysis?months=N  (N = 1 | 3 | 6 | 12)
router.get('/', protect, authorize('Admin', 'TL'), getAnalysis);

// GET /api/analysis/top-performers?months=N
// Returns the single best Employee and best TL for the last N months.
router.get('/top-performers', protect, authorize('Admin', 'TL'), getTopPerformersByRange);

module.exports = router;
