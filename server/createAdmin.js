const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@ems.com' });
    if (existingAdmin) {
      console.log('Admin already exists!');
      console.log('Email: admin@ems.com');
      console.log('Password: password123');
      process.exit(0);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Create Admin
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@ems.com',
      password: hashedPassword,
      role: 'Admin',
      department: 'Management',
      points: 0
    });

    console.log('✅ Admin created successfully!');
    console.log('\nLogin Credentials:');
    console.log('Email: admin@ems.com');
    console.log('Password: password123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
};

createAdmin();
