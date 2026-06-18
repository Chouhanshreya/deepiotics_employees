const express = require('express');
const router = express.Router();
const { getAnalysis } = require('../controllers/analysisController');
const { protect, authorize } = require('../middleware/auth');

// GET /api/analysis?months=N   (N = 1 | 3 | 6 | 12)
// Returns per-employee total + average points across the last N months.
// Admin and TL only.
router.get('/', protect, authorize('Admin', 'TL'), getAnalysis);

module.exports = router;
