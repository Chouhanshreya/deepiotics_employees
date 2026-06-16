# 🛠️ Database & Testing Tools

## Quick Commands

### View Database
```bash
cd server
node viewDatabase.js
```
Shows all users, tasks, and point history with full details.

### Test JWT
```bash
cd server
node testJWT.js
```
Verifies JWT token generation and verification is working.

### Test Password
```bash
cd server
node testPassword.js
```
Tests if passwords are being hashed and compared correctly.

### Create All Users
```bash
cd server
node createAllUsers.js
```
Deletes all users and creates fresh demo accounts.

### Fix Admin Only
```bash
cd server
node fixAdmin.js
```
Deletes and recreates just the admin account.

### Check Users
```bash
cd server
node checkUsers.js
```
Quick list of all users in database.

---

## Database Access Options

### Option 1: MongoDB Compass (GUI - Recommended)
1. Download: https://www.mongodb.com/try/download/compass
2. Install MongoDB Compass
3. Connect to: `mongodb://localhost:27017`
4. Select database: `employee_management`
5. Browse collections: `users`, `tasks`, `pointhistories`

**Benefits:**
- Visual interface
- Easy to browse data
- Can edit documents
- Query builder
- No command line needed

### Option 2: MongoDB Shell (mongosh)
```bash
# Install mongosh
# Download from: https://www.mongodb.com/try/download/shell

# Connect
mongosh mongodb://localhost:27017/employee_management

# List all users
db.users.find().pretty()

# Find specific user
db.users.findOne({ email: "admin@ems.com" })

# Count users
db.users.countDocuments()

# Exit
exit
```

### Option 3: VS Code Extension
1. Install "MongoDB for VS Code" extension
2. Connect to `mongodb://localhost:27017`
3. Explore collections in sidebar

### Option 4: Our Custom Scripts (Easiest)
```bash
# View everything
node viewDatabase.js
```

---

## Testing Login Flow

### 1. Test JWT
```bash
node testJWT.js
```
Should show:
```
✅ JWT_SECRET found
✅ Token generated successfully
✅ Token verified successfully
✅ Correctly rejected wrong secret
```

### 2. Check Database
```bash
node viewDatabase.js
```
Shows all users with their emails and password hashes.

### 3. Test Specific User
```bash
node testPassword.js
```
Tests if password "password123" matches stored hash.

### 4. Watch Backend Logs
When you login, watch the backend terminal:
```
🔐 Login attempt: admin@ems.com
✅ User found: Admin User Admin
✅ Password correct
✅ Token generated
✅ Cookie set, sending response
```

### 5. Test Logout
Login first, then logout. Backend should show:
```
👋 Logout request received
✅ Cookie cleared, user logged out
```

---

## Troubleshooting

### "Password mismatch" Error
```bash
# Delete all users and recreate
node createAllUsers.js
```

### "Not authorized, no token" Error
1. Check if login was successful (backend logs)
2. Check browser cookies (F12 > Application > Cookies)
3. Make sure backend is running on port 5000
4. Make sure frontend is running on port 5173

### Can't Connect to MongoDB
```bash
# Windows - Check service
sc query MongoDB

# Mac - Check if running
brew services list

# Linux - Check status
sudo systemctl status mongodb
```

### Database is Empty
```bash
# Recreate all demo data
node createAllUsers.js
```

---

## Quick Fixes

### Reset Everything
```bash
# Stop backend (Ctrl+C)
# Delete and recreate all users
node createAllUsers.js
# Restart backend
npm run dev
```

### Just Fix Admin
```bash
node fixAdmin.js
```

### View What's in Database
```bash
node viewDatabase.js
```

---

## Demo Accounts (After running createAllUsers.js)

| Role | Email | Password |
|------|-------|----------|
| 👑 Admin | admin@ems.com | password123 |
| 👔 TL | john@ems.com | password123 |
| 👔 TL | sarah@ems.com | password123 |
| 👤 Employee | alice@ems.com | password123 |
| 👤 Employee | bob@ems.com | password123 |
| 👤 Employee | frank@ems.com | password123 |
| ... | (10 total) | password123 |

---

## Browser DevTools

### Check Cookies (F12)
1. Press F12
2. Go to "Application" tab
3. Expand "Cookies" > http://localhost:5173
4. Look for "token" cookie
5. Should be there after login
6. Should be gone after logout

### Check Network Requests
1. Press F12
2. Go to "Network" tab
3. Login
4. Click on "login" request
5. Check Response - should include user data
6. Check Cookies - should show "Set-Cookie: token=..."

---

## Production Checklist

Before deploying:

1. ✅ Change JWT_SECRET in .env
2. ✅ Set NODE_ENV=production
3. ✅ Use MongoDB Atlas (not localhost)
4. ✅ Enable HTTPS
5. ✅ Remove test scripts from production
6. ✅ Remove console.log statements

---

**Need Help?** Check the main README.md or SETUP.md files.
