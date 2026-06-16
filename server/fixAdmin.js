const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');

const fixAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected\n');

    // Delete ALL users with admin@ems.com (in case of duplicates)
    const deleteResult = await User.deleteMany({ email: 'admin@ems.com' });
    console.log(`🗑️  Deleted ${deleteResult.deletedCount} admin user(s)\n`);

    // Create fresh admin - password will be hashed by model
    console.log('Creating new admin with:');
    console.log('Email: admin@ems.com');
    console.log('Password: password123 (plain text - will be hashed)\n');

    const admin = new User({
      name: 'Admin User',
      email: 'admin@ems.com',
      password: 'password123',
      role: 'Admin',
      department: 'Management',
      points: 0,
      tasksCompleted: 0,
      activeStreak: 0
    });

    await admin.save();
    console.log('✅ Admin saved to database\n');

    // Verify it was created correctly
    const savedAdmin = await User.findOne({ email: 'admin@ems.com' });
    console.log('Verifying admin:');
    console.log('Name:', savedAdmin.name);
    console.log('Email:', savedAdmin.email);
    console.log('Role:', savedAdmin.role);
    console.log('Password hash (first 60 chars):', savedAdmin.password.substring(0, 60));

    // Test the password
    const isMatch = await savedAdmin.comparePassword('password123');
    console.log('\n🔐 Password test: "password123" ->', isMatch ? '✅ MATCH' : '❌ NO MATCH');

    if (!isMatch) {
      console.log('\n❌ ERROR: Password still not matching!');
      console.log('There might be an issue with the bcrypt library.');
      process.exit(1);
    }

    console.log('\n🎉 SUCCESS! Admin account is ready!');
    console.log('\n📧 Login Credentials:');
    console.log('Email:    admin@ems.com');
    console.log('Password: password123');
    console.log('\n🌐 Go to: http://localhost:5173');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
};

fixAdmin();
