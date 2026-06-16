const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');

const assignTeam = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected\n');

    const tlEmail = process.argv[2];
    const employeeEmails = process.argv.slice(3);

    if (!tlEmail || employeeEmails.length === 0) {
      console.log('Usage: node assignTeam.js <tl-email> <employee1-email> <employee2-email> ...');
      console.log('Example: node assignTeam.js shreyachouhan0702@gmail.com alice@ems.com bob@ems.com');
      process.exit(1);
    }

    // Find Team Lead
    const tl = await User.findOne({ email: tlEmail });
    if (!tl) {
      console.log(`❌ Team Lead not found: ${tlEmail}`);
      process.exit(1);
    }

    if (tl.role !== 'TL') {
      console.log(`❌ ${tl.name} is not a Team Lead (current role: ${tl.role})`);
      process.exit(1);
    }

    console.log(`✅ Team Lead: ${tl.name} (${tl.email})\n`);
    console.log('Assigning employees...\n');

    let assigned = 0;
    for (const empEmail of employeeEmails) {
      const employee = await User.findOne({ email: empEmail });
      
      if (!employee) {
        console.log(`  ❌ Not found: ${empEmail}`);
        continue;
      }

      if (employee.role !== 'Employee') {
        console.log(`  ⚠️  Skipped ${employee.name} - Not an employee (role: ${employee.role})`);
        continue;
      }

      employee.teamLead = tl._id;
      await employee.save();
      assigned++;

      console.log(`  ✅ ${employee.name} assigned to ${tl.name}'s team`);
    }

    console.log(`\n✅ Assigned ${assigned} employee(s) to ${tl.name}'s team!`);
    console.log(`\n📋 ${tl.name} can now:`);
    console.log('  - See these employees in "Employees" page');
    console.log('  - Assign points to them');
    console.log('  - View their profiles and analytics\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

assignTeam();
