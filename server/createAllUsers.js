const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');

const createAllUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected\n');

    // Delete ALL users
    const deleteResult = await User.deleteMany({});
    console.log(`🗑️  Deleted ${deleteResult.deletedCount} existing user(s)\n`);

    console.log('Creating users...\n');

    // Create Admin
    const admin = new User({
      name: 'Admin User',
      email: 'admin@ems.com',
      password: 'password123',
      role: 'Admin',
      department: 'Management',
      points: 0
    });
    await admin.save();
    console.log('✅ Created: Admin User (admin@ems.com)');

    // Create Team Lead 1
    const tl1 = new User({
      name: 'John Smith',
      email: 'john@ems.com',
      password: 'password123',
      role: 'TL',
      department: 'Engineering',
      points: 0
    });
    await tl1.save();
    console.log('✅ Created: John Smith TL (john@ems.com)');

    // Create Team Lead 2
    const tl2 = new User({
      name: 'Sarah Johnson',
      email: 'sarah@ems.com',
      password: 'password123',
      role: 'TL',
      department: 'Marketing',
      points: 0
    });
    await tl2.save();
    console.log('✅ Created: Sarah Johnson TL (sarah@ems.com)');

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

    for (const empData of employees) {
      const employee = new User({
        ...empData,
        password: 'password123',
        role: 'Employee',
        tasksCompleted: Math.floor(Math.random() * 20),
        activeStreak: Math.floor(Math.random() * 15)
      });
      await employee.save();
      console.log(`✅ Created: ${empData.name} (${empData.email})`);
    }

    console.log('\n✅ All users created successfully!\n');
    console.log('═══════════════════════════════════════');
    console.log('📧 LOGIN CREDENTIALS (All passwords: password123)');
    console.log('═══════════════════════════════════════\n');
    
    console.log('👑 ADMIN:');
    console.log('   admin@ems.com / password123\n');
    
    console.log('👔 TEAM LEADS:');
    console.log('   john@ems.com / password123 (Engineering)');
    console.log('   sarah@ems.com / password123 (Marketing)\n');
    
    console.log('👤 EMPLOYEES:');
    console.log('   alice@ems.com / password123 (Engineering, 2500 pts)');
    console.log('   bob@ems.com / password123 (Engineering, 1800 pts)');
    console.log('   charlie@ems.com / password123 (Engineering, 1200 pts)');
    console.log('   diana@ems.com / password123 (Engineering, 900 pts)');
    console.log('   eve@ems.com / password123 (Engineering, 600 pts)');
    console.log('   frank@ems.com / password123 (Marketing, 3200 pts)');
    console.log('   grace@ems.com / password123 (Marketing, 2100 pts)');
    console.log('   henry@ems.com / password123 (Marketing, 1500 pts)');
    console.log('   ivy@ems.com / password123 (Marketing, 800 pts)');
    console.log('   jack@ems.com / password123 (Marketing, 400 pts)\n');
    
    console.log('🌐 Go to: http://localhost:5173\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
};

createAllUsers();
