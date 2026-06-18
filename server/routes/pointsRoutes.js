const express = require('express');
const router = express.Router();
const { updatePoints, getCurrentMonthPoints, getAvailableMonths } = require('../controllers/pointsController');
const { protect, authorize } = require('../middleware/auth');

// GET /api/points/available-months
// Returns distinct months that have data — used to populate the UI dropdown.
router.get('/available-months', protect, authorize('Admin', 'TL'), getAvailableMonths);

// POST /api/points/update
// Increment (or decrement) an employee's points for the current calendar month.
// Admin and TL only — mirrors the existing assignPoints permission model.
router.post('/update', protect, authorize('Admin', 'TL'), updatePoints);

// GET /api/points/current/:employeeId
// Fetch the current month's running total for a single employee.
router.get('/current/:employeeId', protect, getCurrentMonthPoints);

module.exports = router;
