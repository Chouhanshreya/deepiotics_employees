const express = require('express');
const router = express.Router();
const {
  getTLLeaderboard,
  declareBestEmployee,
  declareBestTL,
  getBestPerformers,
  resetMonth,
  getArchives,
  getArchiveById,
  closeMonthAndStartNew,
  cleanTestData
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// Leaderboard — TL level (Admin + TL can see)
router.get('/leaderboard/tls', protect, authorize('Admin', 'TL'), getTLLeaderboard);

// Best performers (all roles can see)
router.get('/best-performers', protect, getBestPerformers);

// Admin-only actions
router.post('/best-employee', protect, authorize('Admin'), declareBestEmployee);
router.post('/best-tl', protect, authorize('Admin'), declareBestTL);
router.post('/reset-month', protect, authorize('Admin'), resetMonth);
router.get('/archives', protect, authorize('Admin'), getArchives);
router.get('/archives/:id', protect, authorize('Admin'), getArchiveById);

// New: close current month + start next month in the monthlyPoints system
router.post('/close-month', protect, authorize('Admin'), closeMonthAndStartNew);

// Clean test data — wipe old months, rankings, history, reset points to 0
router.post('/clean-test-data', protect, authorize('Admin'), cleanTestData);

module.exports = router;
