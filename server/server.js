const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Allowed origins: CLIENT_URL env var (set in Render dashboard) + local dev
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  process.env.CLIENT_URL, // e.g. https://deepiotics-employees-1.onrender.com
].filter(Boolean); // remove undefined if CLIENT_URL is not set

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Set-Cookie']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Monthly points tracking routes
app.use('/api/points', require('./routes/pointsRoutes'));
app.use('/api/analysis', require('./routes/analysisRoutes'));
app.use('/api/rankings', require('./routes/rankingsRoutes'));



// Test endpoint to check cookies
app.get('/api/test/cookies', (req, res) => {
  console.log('📋 Cookies received:', req.cookies);
  res.json({
    message: 'Cookie test endpoint',
    cookies: req.cookies,
    hasCookies: Object.keys(req.cookies).length > 0,
    hasToken: !!req.cookies.token
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
const { startMonthlyRolloverCron } = require('./cron/monthlyRollover');

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  // Start the monthly rollover cron after the server (and DB) are ready
  startMonthlyRolloverCron();
});
