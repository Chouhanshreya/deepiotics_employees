const express = require('express');
const router = express.Router();
const { updatePoints, getCurrentMonthPoints, getAvailableMonths, getMonthTopScorers } = require('../controllers/pointsController');
const { protect, authorize } = require('../middleware/auth');

// GET /api/points/available-months
router.get('/available-months', protect, authorize('Admin', 'TL'), getAvailableMonths);

// GET /api/points/month-top?month=M&year=Y&department=X
router.get('/month-top', protect, authorize('Admin', 'TL'), getMonthTopScorers);

// POST /api/points/update
// Increment (or decrement) an employee's points for the current calendar month.
// Admin and TL only — mirrors the existing assignPoints permission model.
router.post('/update', protect, authorize('Admin', 'TL'), updatePoints);

// GET /api/points/current/:employeeId
// Fetch the current month's running total for a single employee.
router.get('/current/:employeeId', protect, getCurrentMonthPoints);

module.exports = router;
