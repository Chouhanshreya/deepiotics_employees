# 🎯 Get Started in 3 Minutes

## What You Have

A complete **Employee Management System** with:
- ✅ React + Tailwind frontend
- ✅ Node.js + Express backend
- ✅ MongoDB database
- ✅ JWT authentication
- ✅ Role-based access (Admin, TL, Employee)
- ✅ Points, ranks, and leaderboards
- ✅ Task management
- ✅ Analytics dashboard

## Quick Setup

### 1️⃣ Install Dependencies

**Windows:** Double-click `install.bat`

**Mac/Linux:**
```bash
chmod +x install.sh
./install.sh
```

### 2️⃣ Start MongoDB

Make sure MongoDB is running on your machine.

**Check if running:**
```bash
# Windows
sc query MongoDB

# Mac
brew services list | grep mongodb

# Linux
sudo systemctl status mongodb
```

### 3️⃣ Start Backend

Open terminal:
```bash
cd server
npm run dev
```

✅ Wait for: "Server is running on port 5000" and "MongoDB Connected"

### 4️⃣ Add Demo Data

Open NEW terminal:
```bash
cd server
node scripts/seed.js
```

This creates:
- 1 Admin
- 2 Team Leads
- 10 Employees
- Sample tasks

**Login credentials:**
- Admin: `admin@ems.com` / `password123`
- TL: `john@ems.com` / `password123`  
- Employee: `alice@ems.com` / `password123`

### 5️⃣ Start Frontend

Open NEW terminal:
```bash
cd client
npm run dev
```

### 6️⃣ Open Browser

Go to: **http://localhost:5173**

Login with any demo account!

---

## What to Explore

### Try as Admin 👑
1. Login: `admin@ems.com` / `password123`
2. Click "Employees" - see everyone
3. Click "Create Employee" - add new user
4. Click 🏆 icon next to name - assign points
5. Click "Workflow" - manage tasks
6. Click "Analytics" - view charts

### Try as Team Lead 👔
1. Login: `shreyachouhan0702@gmail.com` / `password123`
2. Click "My Team" - see your 2 team members (Alice & Frank)
3. Click 🏆 icon - assign points to YOUR team members
4. Click "All Employees" - view all employees and TLs (but not Admin)
5. Click "Leaderboard" - see rankings
6. You can ONLY assign points to employees in YOUR team

**Shreya's Team:**
- Alice Brown (alice@ems.com) - 2600 points
- Frank Anderson (frank@ems.com) - 3200 points

**👉 See QUICK_START_TL.md for detailed Team Lead guide**

### Try as Employee 👤
1. Login: `alice@ems.com` / `password123`
2. See your dashboard with stats
3. Click "Leaderboard" - view rankings
4. Click "My Team" - see teammates
5. Click "My Stats" - view charts
6. Notice: Can't see Admin or TL profiles!

---

## Project Structure

```
📁 client/               Frontend (React)
   └── src/
       ├── components/   Reusable UI components
       ├── pages/        Page components
       ├── context/      Auth context
       └── utils/        API calls & helpers

📁 server/               Backend (Express)
   ├── models/           MongoDB schemas
   ├── routes/           API endpoints
   ├── controllers/      Business logic
   └── middleware/       Auth middleware

📄 Documentation files (you're reading one!)
```

---

## Key Files to Check

| File | Purpose |
|------|---------|
| `START.md` | Quick start (this file!) |
| `SETUP.md` | Detailed setup instructions |
| `README.md` | Full documentation |
| `PROJECT_OVERVIEW.md` | Technical overview |
| `FEATURES.md` | Complete feature checklist |

---

## Common Issues

**❌ "Cannot connect to database"**
→ Start MongoDB service

**❌ "Port 5000 already in use"**
→ Change `PORT=5001` in `server/.env`

**❌ "CORS error in browser"**
→ Make sure both servers are running

**❌ "Module not found"**
→ Run `npm install` in both client and server

---

## Tech Stack

**Frontend:**
- React 18
- Tailwind CSS
- Recharts (charts)
- Axios (API calls)
- React Router (routing)

**Backend:**
- Node.js + Express
- MongoDB + Mongoose
- JWT authentication
- bcrypt (password hashing)

---

## Features Highlights

🎯 **3 Role System** - Admin, Team Lead, Employee with different permissions

📊 **Leaderboard** - Real-time rankings with tier badges

🏆 **Tier System** - Bronze → Silver → Gold → Platinum → Diamond

📋 **Kanban Board** - Task management (To Do → In Progress → Done)

📈 **Analytics** - Charts showing performance over time

💭 **Daily Quotes** - 30 rotating motivational quotes

📱 **Responsive** - Works on desktop, tablet, and mobile

🔐 **Secure** - JWT auth, password hashing, role-based access

---

## Next Steps

1. ✅ Complete the 6-step setup above
2. ✅ Login and explore all three roles
3. ✅ Create your own employees
4. ✅ Assign points and tasks
5. ✅ Check the leaderboard
6. ✅ Customize for your needs!

---

## Need Help?

📖 **More Details:** Check `SETUP.md` for troubleshooting

🐛 **Found a Bug:** Review the code - it's well commented!

💡 **Want to Customize:** All code is yours to modify

---

## Have Fun! 🚀

The system is fully functional and ready to use!

Login → Explore → Customize → Deploy

**Login now:** http://localhost:5173

---

Made with ❤️ using React, Node.js, and MongoDB
