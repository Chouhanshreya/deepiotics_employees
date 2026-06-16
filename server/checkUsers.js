const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');

const checkUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected\n');

    // Get all users
    const allUsers = await User.find({}).populate('teamLead', 'name email').sort('role name');

    console.log('═══════════════════════════════════════');
    console.log('       ALL USERS IN DATABASE           ');
    console.log('═══════════════════════════════════════\n');

    // Group by role
    const admins = allUsers.filter(u => u.role === 'Admin');
    const teamLeads = allUsers.filter(u => u.role === 'TL');
    const employees = allUsers.filter(u => u.role === 'Employee');

    if (admins.length > 0) {
      console.log('👑 ADMINS:');
      admins.forEach(user => {
        console.log(`   ${user.name} (${user.email})`);
      });
      console.log('');
    }

    if (teamLeads.length > 0) {
      console.log('👔 TEAM LEADS:');
      teamLeads.forEach(user => {
        console.log(`   ${user.name} (${user.email})`);
        console.log(`      Department: ${user.department}`);
        
        // Count team members
        const teamMembers = employees.filter(e => 
          e.teamLead && e.teamLead._id.toString() === user._id.toString()
        );
        console.log(`      Team Members: ${teamMembers.length}`);
        if (teamMembers.length > 0) {
          teamMembers.forEach(member => {
            console.log(`         - ${member.name} (${member.email})`);
          });
        }
        console.log('');
      });
    }

    if (employees.length > 0) {
      console.log('👤 EMPLOYEES:');
      employees.forEach(user => {
        const tlName = user.teamLead ? user.teamLead.name : 'None';
        console.log(`   ${user.name} (${user.email})`);
        console.log(`      Department: ${user.department}`);
        console.log(`      Team Lead: ${tlName}`);
        console.log(`      Points: ${user.points}`);
        console.log('');
      });
    }

    console.log('═══════════════════════════════════════');
    console.log(`Total: ${allUsers.length} users (${admins.length} admins, ${teamLeads.length} TLs, ${employees.length} employees)`);
    console.log('═══════════════════════════════════════\n');

    // Check specifically for Shreya
    const shreya = allUsers.find(u => u.email.includes('shreya'));
    if (shreya) {
      console.log('🔍 SHREYA CHOUHAN STATUS:');
      console.log(`   Role: ${shreya.role}`);
      console.log(`   Department: ${shreya.department}`);
      const shreyaTeam = employees.filter(e => 
        e.teamLead && e.teamLead._id.toString() === shreya._id.toString()
      );
      console.log(`   Team Members: ${shreyaTeam.length}`);
      if (shreyaTeam.length === 0) {
        console.log('   ⚠️  NO TEAM MEMBERS ASSIGNED YET!\n');
        console.log('To assign employees to Shreya, run:');
        console.log(`   node assignTeam.js ${shreya.email} <employee-email-1> <employee-email-2> ...\n`);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

checkUsers();
