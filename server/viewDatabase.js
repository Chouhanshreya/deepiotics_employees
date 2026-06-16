const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Task = require('./models/Task');
const PointHistory = require('./models/PointHistory');

const viewDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected\n');

    // Get all collections
    const users = await User.find({}).populate('teamLead', 'name');
    const tasks = await Task.find({}).populate('assignedTo', 'name').populate('createdBy', 'name');
    const pointHistories = await PointHistory.find({})
      .populate('employee', 'name')
      .populate('assignedBy', 'name');

    console.log('═════════════════════════════════════════════════════════════');
    console.log('                    DATABASE OVERVIEW                        ');
    console.log('═════════════════════════════════════════════════════════════\n');

    // Summary
    console.log('📊 SUMMARY:');
    console.log(`   Total Users: ${users.length}`);
    console.log(`   - Admins: ${users.filter(u => u.role === 'Admin').length}`);
    console.log(`   - Team Leads: ${users.filter(u => u.role === 'TL').length}`);
    console.log(`   - Employees: ${users.filter(u => u.role === 'Employee').length}`);
    console.log(`   Total Tasks: ${tasks.length}`);
    console.log(`   Total Point Records: ${pointHistories.length}\n`);

    // Users Detail
    console.log('═════════════════════════════════════════════════════════════');
    console.log('                         👥 USERS                            ');
    console.log('═════════════════════════════════════════════════════════════\n');

    // Group by role
    const admins = users.filter(u => u.role === 'Admin');
    const tls = users.filter(u => u.role === 'TL');
    const employees = users.filter(u => u.role === 'Employee');

    console.log('👑 ADMINS:\n');
    admins.forEach(user => {
      console.log(`   Name:       ${user.name}`);
      console.log(`   Email:      ${user.email}`);
      console.log(`   Department: ${user.department}`);
      console.log(`   Points:     ${user.points}`);
      console.log(`   Password:   ${user.password.substring(0, 30)}...`);
      console.log('   ---');
    });

    console.log('\n👔 TEAM LEADS:\n');
    tls.forEach(user => {
      console.log(`   Name:       ${user.name}`);
      console.log(`   Email:      ${user.email}`);
      console.log(`   Department: ${user.department}`);
      console.log(`   Points:     ${user.points}`);
      console.log(`   Password:   ${user.password.substring(0, 30)}...`);
      console.log('   ---');
    });

    console.log('\n👤 EMPLOYEES:\n');
    employees.forEach(user => {
      console.log(`   Name:       ${user.name}`);
      console.log(`   Email:      ${user.email}`);
      console.log(`   Department: ${user.department}`);
      console.log(`   Team Lead:  ${user.teamLead?.name || 'None'}`);
      console.log(`   Points:     ${user.points} (${user.tier})`);
      console.log(`   Tasks:      ${user.tasksCompleted}`);
      console.log(`   Streak:     ${user.activeStreak} days`);
      console.log(`   Password:   ${user.password.substring(0, 30)}...`);
      console.log('   ---');
    });

    // Tasks
    if (tasks.length > 0) {
      console.log('\n═════════════════════════════════════════════════════════════');
      console.log('                         📋 TASKS                            ');
      console.log('═════════════════════════════════════════════════════════════\n');

      tasks.forEach(task => {
        console.log(`   Title:        ${task.title}`);
        console.log(`   Assigned To:  ${task.assignedTo?.name || 'Unknown'}`);
        console.log(`   Status:       ${task.status}`);
        console.log(`   Points:       ${task.points}`);
        console.log(`   Created By:   ${task.createdBy?.name || 'Unknown'}`);
        console.log('   ---');
      });
    }

    // Point History
    if (pointHistories.length > 0) {
      console.log('\n═════════════════════════════════════════════════════════════');
      console.log('                    🏆 POINT HISTORY                         ');
      console.log('═════════════════════════════════════════════════════════════\n');

      pointHistories.forEach(record => {
        console.log(`   Employee:    ${record.employee?.name || 'Unknown'}`);
        console.log(`   Points:      +${record.points}`);
        console.log(`   Note:        ${record.note || 'No note'}`);
        console.log(`   Assigned By: ${record.assignedBy?.name || 'Unknown'}`);
        console.log(`   Date:        ${record.createdAt.toLocaleString()}`);
        console.log('   ---');
      });
    }

    console.log('\n═════════════════════════════════════════════════════════════');
    console.log('                    📧 LOGIN CREDENTIALS                      ');
    console.log('═════════════════════════════════════════════════════════════\n');
    console.log('All users have password: password123\n');
    
    users.forEach(user => {
      const icon = user.role === 'Admin' ? '👑' : user.role === 'TL' ? '👔' : '👤';
      console.log(`${icon} ${user.email.padEnd(25)} (${user.role})`);
    });

    console.log('\n═════════════════════════════════════════════════════════════\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

viewDatabase();
