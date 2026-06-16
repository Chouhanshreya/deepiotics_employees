const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');

const checkUser = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected\n');

    const email = process.argv[2] || 'shreya@example.com';
    
    const user = await User.findOne({ 
      $or: [
        { email: email },
        { email: new RegExp(email, 'i') },
        { name: new RegExp(email, 'i') }
      ]
    }).populate('teamLead', 'name email role');

    if (!user) {
      console.log(`❌ User not found with: ${email}`);
      console.log('\nSearching for similar names...');
      const similar = await User.find({
        name: new RegExp(email.split('@')[0], 'i')
      }).limit(5);
      
      if (similar.length > 0) {
        console.log('\nFound similar users:');
        similar.forEach(u => {
          console.log(`  - ${u.name} (${u.email}) - ${u.role}`);
        });
      }
      process.exit(1);
    }

    console.log('═══════════════════════════════════════');
    console.log('           USER INFORMATION            ');
    console.log('═══════════════════════════════════════\n');
    console.log(`Name:       ${user.name}`);
    console.log(`Email:      ${user.email}`);
    console.log(`Role:       ${user.role}`);
    console.log(`Department: ${user.department}`);
    console.log(`Team Lead:  ${user.teamLead ? `${user.teamLead.name} (${user.teamLead.email})` : 'None'}`);
    console.log(`Points:     ${user.points}`);
    console.log(`Tier:       ${user.tier}`);
    console.log(`Tasks:      ${user.tasksCompleted}`);
    console.log(`Streak:     ${user.activeStreak} days`);
    
    console.log('\n═══════════════════════════════════════\n');

    if (user.role === 'Employee') {
      console.log('⚠️  This user is an EMPLOYEE');
      console.log('Employees cannot assign points by default.\n');
      console.log('Do you want to:');
      console.log('1. Make this user a Team Lead? (can manage team)');
      console.log('2. Keep as Employee but enable point assignment?\n');
    } else if (user.role === 'TL') {
      console.log('✅ This user is a TEAM LEAD');
      console.log('They can manage their team members.\n');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

checkUser();
