const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');

const resetAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');

    // Delete existing admin
    await User.deleteOne({ email: 'admin@ems.com' });
    console.log('🗑️  Deleted old admin (if existed)');

    // Create new admin with properly hashed password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);
    
    console.log('🔐 Creating admin with password: password123');
    console.log('🔐 Hashed password:', hashedPassword.substring(0, 30) + '...');

    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@ems.com',
      password: hashedPassword,
      role: 'Admin',
      department: 'Management',
      points: 0,
      tasksCompleted: 0,
      activeStreak: 0
    });

    console.log('\n✅ Admin created successfully!');
    console.log('\n📧 Login Credentials:');
    console.log('Email:    admin@ems.com');
    console.log('Password: password123');
    console.log('\n🌐 Go to: http://localhost:5173');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

resetAdmin();
