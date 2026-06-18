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

// One-time seed endpoint — protected by SEED_SECRET env variable
// Call: POST /api/seed  with header  x-seed-secret: <your SEED_SECRET value>
// Delete or disable this after first use in production.
app.post('/api/seed', async (req, res) => {
  const secret = req.headers['x-seed-secret'];
  if (!process.env.SEED_SECRET || secret !== process.env.SEED_SECRET) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  try {
    const User = require('./models/User');
    const Task = require('./models/Task');
    const PointHistory = require('./models/PointHistory');

    await User.deleteMany({});
    await Task.deleteMany({});
    await PointHistory.deleteMany({});

    // Admin
    const admin = new User({ name: 'Admin User', email: 'admin@ems.com', password: 'password123', role: 'Admin', department: 'Management', points: 0 });
    await admin.save();

    // Team Leads
    const tl1 = new User({ name: 'John Smith', email: 'john@ems.com', password: 'password123', role: 'TL', department: 'Engineering', points: 0 });
    await tl1.save();
    const tl2 = new User({ name: 'Sarah Johnson', email: 'sarah@ems.com', password: 'password123', role: 'TL', department: 'Marketing', points: 0 });
    await tl2.save();

    // Employees
    const employeesData = [
      { name: 'Alice Brown',    email: 'alice@ems.com',   department: 'Engineering', teamLead: tl1._id, points: 2500 },
      { name: 'Bob Wilson',     email: 'bob@ems.com',     department: 'Engineering', teamLead: tl1._id, points: 1800 },
      { name: 'Charlie Davis',  email: 'charlie@ems.com', department: 'Engineering', teamLead: tl1._id, points: 1200 },
      { name: 'Diana Miller',   email: 'diana@ems.com',   department: 'Engineering', teamLead: tl1._id, points: 900  },
      { name: 'Eve Taylor',     email: 'eve@ems.com',     department: 'Engineering', teamLead: tl1._id, points: 600  },
      { name: 'Frank Anderson', email: 'frank@ems.com',   department: 'Marketing',   teamLead: tl2._id, points: 3200 },
      { name: 'Grace Thomas',   email: 'grace@ems.com',   department: 'Marketing',   teamLead: tl2._id, points: 2100 },
      { name: 'Henry Martinez', email: 'henry@ems.com',   department: 'Marketing',   teamLead: tl2._id, points: 1500 },
      { name: 'Ivy Garcia',     email: 'ivy@ems.com',     department: 'Marketing',   teamLead: tl2._id, points: 800  },
      { name: 'Jack Robinson',  email: 'jack@ems.com',    department: 'Marketing',   teamLead: tl2._id, points: 400  },
    ];

    const createdEmployees = [];
    for (const emp of employeesData) {
      const e = new User({ ...emp, password: 'password123', role: 'Employee', tasksCompleted: Math.floor(Math.random() * 20), activeStreak: Math.floor(Math.random() * 15) });
      await e.save();
      createdEmployees.push(e);
    }

    // Sample Tasks
    await Task.insertMany([
      { title: 'Implement user authentication', description: 'Add JWT-based authentication to the API', assignedTo: createdEmployees[0]._id, status: 'In Progress', points: 50, createdBy: tl1._id },
      { title: 'Design landing page',           description: 'Create mockups for the new landing page', assignedTo: createdEmployees[5]._id, status: 'Done',        points: 30, createdBy: tl2._id },
      { title: 'Write API documentation',       description: 'Document all API endpoints',              assignedTo: createdEmployees[1]._id, status: 'To Do',       points: 40, createdBy: tl1._id },
      { title: 'Setup CI/CD pipeline',          description: 'Configure GitHub Actions',                assignedTo: createdEmployees[2]._id, status: 'In Progress', points: 60, createdBy: tl1._id },
      { title: 'Create social media content',   description: 'Plan content for Q4 campaign',           assignedTo: createdEmployees[6]._id, status: 'Done',        points: 25, createdBy: tl2._id },
    ]);

    // Point History
    const history = createdEmployees.map(emp => ({
      employee: emp._id,
      points: Math.floor(Math.random() * 100) + 50,
      note: 'Great work on the project!',
      assignedBy: emp.teamLead
    }));
    await PointHistory.insertMany(history);

    res.json({
      message: '✅ Database seeded successfully!',
      accounts: {
        admin: 'admin@ems.com / password123',
        tl1: 'john@ems.com / password123',
        tl2: 'sarah@ems.com / password123',
        employees: 'alice@ems.com, bob@ems.com ... / password123'
      }
    });
  } catch (error) {
    console.error('Seed error:', error);
    res.status(500).json({ message: 'Seed failed', error: error.message });
  }
});

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
