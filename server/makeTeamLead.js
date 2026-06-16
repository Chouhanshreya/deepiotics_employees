const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');

const makeTeamLead = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected\n');

    const email = process.argv[2];
    
    if (!email) {
      console.log('Usage: node makeTeamLead.js <email>');
      console.log('Example: node makeTeamLead.js shreya@ems.com');
      process.exit(1);
    }

    const user = await User.findOne({ email });

    if (!user) {
      console.log(`❌ User not found: ${email}`);
      process.exit(1);
    }

    const oldRole = user.role;
    user.role = 'TL';
    user.teamLead = null; // TLs don't have team leads
    await user.save();

    console.log('✅ User updated successfully!\n');
    console.log(`Name:     ${user.name}`);
    console.log(`Email:    ${user.email}`);
    console.log(`Old Role: ${oldRole}`);
    console.log(`New Role: TL (Team Lead)`);
    console.log('\n✅ This user can now:');
    console.log('  - View all Employees and TLs');
    console.log('  - Assign points to their team members');
    console.log('  - Create employees for their team');
    console.log('  - View team analytics\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

makeTeamLead();
