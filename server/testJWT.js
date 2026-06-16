const jwt = require('jsonwebtoken');
require('dotenv').config();

console.log('═════════════════════════════════════════════════════════════');
console.log('                    JWT TOKEN TESTER                         ');
console.log('═════════════════════════════════════════════════════════════\n');

// Check JWT_SECRET
console.log('1️⃣ Checking JWT_SECRET:');
if (!process.env.JWT_SECRET) {
  console.log('   ❌ JWT_SECRET not found in .env file!');
  process.exit(1);
} else {
  console.log(`   ✅ JWT_SECRET found: ${process.env.JWT_SECRET.substring(0, 10)}...`);
  console.log(`   Length: ${process.env.JWT_SECRET.length} characters\n`);
}

// Generate a test token
console.log('2️⃣ Generating test token:');
const testUserId = '507f1f77bcf86cd799439011';
const token = jwt.sign({ id: testUserId }, process.env.JWT_SECRET, {
  expiresIn: '30d'
});
console.log(`   ✅ Token generated successfully`);
console.log(`   Token: ${token.substring(0, 50)}...`);
console.log(`   Length: ${token.length} characters\n`);

// Verify the token
console.log('3️⃣ Verifying token:');
try {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  console.log('   ✅ Token verified successfully');
  console.log('   Decoded payload:');
  console.log(`   - User ID: ${decoded.id}`);
  console.log(`   - Issued At: ${new Date(decoded.iat * 1000).toLocaleString()}`);
  console.log(`   - Expires At: ${new Date(decoded.exp * 1000).toLocaleString()}\n`);
} catch (error) {
  console.log('   ❌ Token verification failed:', error.message);
  process.exit(1);
}

// Test with wrong secret
console.log('4️⃣ Testing with wrong secret (should fail):');
try {
  jwt.verify(token, 'wrong-secret');
  console.log('   ❌ SECURITY ISSUE: Token verified with wrong secret!');
} catch (error) {
  console.log('   ✅ Correctly rejected:', error.message.substring(0, 50));
}

console.log('\n═════════════════════════════════════════════════════════════');
console.log('                    ✅ JWT IS WORKING                        ');
console.log('═════════════════════════════════════════════════════════════\n');
