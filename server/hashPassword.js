const bcrypt = require('bcryptjs');

const password = process.argv[2] || 'password123';

bcrypt.hash(password, 10).then(hash => {
  console.log('\n🔐 Password Hash Generator\n');
  console.log('Plain password:', password);
  console.log('Hashed password:', hash);
  console.log('\n✅ Copy the hash above and use it in MongoDB!\n');
  process.exit(0);
});
