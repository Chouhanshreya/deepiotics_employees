const mongoose = require('mongoose');
require('dotenv').config();

// Models
const User = require('../models/User');
const Task = require('../models/Task');
const PointHistory = require('../models/PointHistory');

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');

    // Clear existing data
    await User.deleteMany({});
    await Task.deleteMany({});
    await PointHistory.deleteMany({});
    console.log('Cleared existing data');

    // Create Admin - password will be hashed by model
    const admin = new User({
      name: 'Admin User',
      email: 'admin@ems.com',
      password: 'admin123',
      role: 'Admin',
      department: 'Management',
      points: 0
    });
    await admin.save();
    console.log('Created Admin');

    // Create Team Leads
    const tl1 = new User({
      name: 'John Smith',
      email: 'john@ems.com',
      password: 'password123',
      role: 'TL',
      department: 'Engineering',
      points: 0
    });
    await tl1.save();

    const tl2 = new User({
      name: 'Sarah Johnson',
      email: 'sarah@ems.com',
      password: 'password123',
      role: 'TL',
      department: 'Marketing',
      points: 0
    });
    await tl2.save();
    console.log('Created Team Leads');

    // Create Employees
    const employees = [
      { name: 'Alice Brown', email: 'alice@ems.com', department: 'Engineering', teamLead: tl1._id, points: 2500 },
      { name: 'Bob Wilson', email: 'bob@ems.com', department: 'Engineering', teamLead: tl1._id, points: 1800 },
      { name: 'Charlie Davis', email: 'charlie@ems.com', department: 'Engineering', teamLead: tl1._id, points: 1200 },
      { name: 'Diana Miller', email: 'diana@ems.com', department: 'Engineering', teamLead: tl1._id, points: 900 },
      { name: 'Eve Taylor', email: 'eve@ems.com', department: 'Engineering', teamLead: tl1._id, points: 600 },
      { name: 'Frank Anderson', email: 'frank@ems.com', department: 'Marketing', teamLead: tl2._id, points: 3200 },
      { name: 'Grace Thomas', email: 'grace@ems.com', department: 'Marketing', teamLead: tl2._id, points: 2100 },
      { name: 'Henry Martinez', email: 'henry@ems.com', department: 'Marketing', teamLead: tl2._id, points: 1500 },
      { name: 'Ivy Garcia', email: 'ivy@ems.com', department: 'Marketing', teamLead: tl2._id, points: 800 },
      { name: 'Jack Robinson', email: 'jack@ems.com', department: 'Marketing', teamLead: tl2._id, points: 400 }
    ];

    const createdEmployees = [];
    for (const emp of employees) {
      const employee = new User({
        ...emp,
        password: 'password123',
        role: 'Employee',
        tasksCompleted: Math.floor(Math.random() * 20),
        activeStreak: Math.floor(Math.random() * 15)
      });
      await employee.save();
      createdEmployees.push(employee);
    }
    console.log('Created Employees');

    // Create Sample Tasks
    const tasks = [
      {
        title: 'Implement user authentication',
        description: 'Add JWT-based authentication to the API',
        assignedTo: createdEmployees[0]._id,
        status: 'In Progress',
        points: 50,
        createdBy: tl1._id
      },
      {
        title: 'Design landing page',
        description: 'Create mockups for the new landing page',
        assignedTo: createdEmployees[5]._id,
        status: 'Done',
        points: 30,
        createdBy: tl2._id
      },
      {
        title: 'Write API documentation',
        description: 'Document all API endpoints',
        assignedTo: createdEmployees[1]._id,
        status: 'To Do',
        points: 40,
        createdBy: tl1._id
      },
      {
        title: 'Setup CI/CD pipeline',
        description: 'Configure GitHub Actions for automated deployment',
        assignedTo: createdEmployees[2]._id,
        status: 'In Progress',
        points: 60,
        createdBy: tl1._id
      },
      {
        title: 'Create social media content',
        description: 'Plan and create content for Q4 campaign',
        assignedTo: createdEmployees[6]._id,
        status: 'Done',
        points: 25,
        createdBy: tl2._id
      }
    ];

    await Task.insertMany(tasks);
    console.log('Created Tasks');

    // Create Point History
    const pointHistory = [];
    for (const emp of createdEmployees) {
      pointHistory.push({
        employee: emp._id,
        points: Math.floor(Math.random() * 100) + 50,
        note: 'Great work on the project!',
        assignedBy: emp.teamLead
      });
    }
    await PointHistory.insertMany(pointHistory);
    console.log('Created Point History');

    console.log('\n✅ Database seeded successfully!');
    console.log('\nDemo Accounts:');
    console.log('Admin: admin@ems.com / password123');
    console.log('TL 1: john@ems.com / password123');
    console.log('TL 2: sarah@ems.com / password123');
    console.log('Employee: alice@ems.com / password123');
    console.log('(All other employees also use password123)\n');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
