const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');

const testPassword = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected\n');

    // Find the admin user
    const user = await User.findOne({ email: 'admin@ems.com' });
    
    if (!user) {
      console.log('❌ Admin user not found!');
      console.log('Run: node createAdminSimple.js');
      process.exit(1);
    }

    console.log('✅ User found:', user.name);
    console.log('Email:', user.email);
    console.log('Stored password hash:', user.password.substring(0, 60));
    console.log('');

    // Test password comparison
    const testPasswords = ['password123', 'admin123', 'Password123'];
    
    for (const pwd of testPasswords) {
      console.log(`Testing password: "${pwd}"`);
      
      // Method 1: Using the model's method
      const match1 = await user.comparePassword(pwd);
      console.log(`  - Model method result: ${match1}`);
      
      // Method 2: Direct bcrypt compare
      const match2 = await bcrypt.compare(pwd, user.password);
      console.log(`  - Direct bcrypt result: ${match2}`);
      console.log('');
    }

    // Now let's create a fresh hash and test it
    console.log('Creating fresh hash for "password123":');
    const freshHash = await bcrypt.hash('password123', 10);
    console.log('Fresh hash:', freshHash.substring(0, 60));
    
    const freshMatch = await bcrypt.compare('password123', freshHash);
    console.log('Fresh hash matches "password123":', freshMatch);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
};

testPassword();
