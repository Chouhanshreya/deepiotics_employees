const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');

    // Delete existing admin
    await User.deleteOne({ email: 'admin@ems.com' });
    console.log('🗑️  Deleted old admin (if existed)');

    // Create new admin - let the model hash the password
    const admin = new User({
      name: 'Admin User',
      email: 'admin@ems.com',
      password: 'password123',  // Plain password - will be hashed by pre('save') hook
      role: 'Admin',
      department: 'Management',
      points: 0,
      tasksCompleted: 0,
      activeStreak: 0
    });

    await admin.save();

    console.log('\n✅ Admin created successfully!');
    console.log('\n📧 Login Credentials:');
    console.log('Email:    admin@ems.com');
    console.log('Password: password123');
    console.log('\n🌐 Go to: http://localhost:5173');
    console.log('\n✅ Password will be hashed automatically by the model');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
};

createAdmin();
