# 🚀 Quick Start Guide

## First Time Setup (5 minutes)

### Step 1: Install Everything at Once

**Windows:**
```bash
install.bat
```

**Mac/Linux:**
```bash
chmod +x install.sh
./install.sh
```

This will install all dependencies for both frontend and backend.

### Step 2: Start MongoDB

Make sure MongoDB is running on your system:

**Windows:** MongoDB service should auto-start, or start it from Services

**Mac:** 
```bash
brew services start mongodb-community
```

**Linux:** 
```bash
sudo systemctl start mongodb
```

### Step 3: Start Backend Server

Open a terminal:
```bash
cd server
npm run dev
```

Wait for: `✅ Server is running on port 5000` and `✅ MongoDB Connected`

### Step 4: Seed Demo Data (Recommended)

Open a NEW terminal:
```bash
cd server
node scripts/seed.js
```

This creates demo accounts:
- **Admin:** admin@ems.com / password123
- **Team Lead:** john@ems.com / password123
- **Employee:** alice@ems.com / password123

### Step 5: Start Frontend

Open a NEW terminal:
```bash
cd client
npm run dev
```

### Step 6: Open Your Browser

Go to: **http://localhost:5173**

Login with any of the demo accounts above!

---

## Daily Development

After the first setup, you only need:

**Terminal 1 (Backend):**
```bash
cd server
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd client
npm run dev
```

Then open: **http://localhost:5173**

---

## What to Try

### As Admin (admin@ems.com)
- ✅ View all employees
- ✅ Create new employees and team leads
- ✅ Assign points to anyone
- ✅ View analytics charts
- ✅ Manage tasks for everyone

### As Team Lead (john@ems.com)
- ✅ View your team members
- ✅ Create employees for your team
- ✅ Assign points to team members
- ✅ Create tasks for your team

### As Employee (alice@ems.com)
- ✅ View your dashboard with stats
- ✅ Check leaderboard rankings
- ✅ See your teammates
- ✅ Track your progress

---

## Troubleshooting

**"Cannot connect to MongoDB"**
→ Start MongoDB service

**"Port 5000 already in use"**
→ Change PORT in server/.env to 5001

**"CORS error"**
→ Make sure both servers are running

**Need more help?**
→ Check SETUP.md for detailed troubleshooting

---

Happy coding! 🎉
