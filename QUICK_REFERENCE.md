# 🚀 Quick Reference Card

## 🔐 Login Credentials

### Team Lead (Your Account)
```
Email: shreyachouhan0702@gmail.com
Password: password123
```

### Admin
```
Email: admin@ems.com
Password: password123
```

### Sample Employee
```
Email: alice@ems.com
Password: password123
```

---

## 🎯 Quick Actions

### Start the App
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev

# Open: http://localhost:5173
```

### Check Database
```bash
cd server
node checkUsers.js
```

### Assign Employees to TL
```bash
cd server
node assignTeam.js <tl-email> <employee-emails...>
```

---

## 👔 Team Lead Features

### What You Can Do:
✅ View your team members (My Team page)
✅ Assign points to YOUR team only
✅ View all employees and TLs (not Admin)
✅ View leaderboards and rankings
✅ View analytics and statistics

### What You Cannot Do:
❌ View Admin profiles
❌ Assign points to other teams
❌ Delete or edit employees
❌ Change user roles

---

## 📊 Point Tiers

| Points | Tier |
|--------|------|
| 0-499 | Bronze |
| 500-999 | Silver |
| 1000-1999 | Gold |
| 2000-2999 | Platinum |
| 3000+ | Diamond |

---

## 🏆 Shreya's Current Team

1. **Alice Brown** (alice@ems.com)
   - Department: Engineering
   - Points: 2600
   - Tier: Platinum

2. **Frank Anderson** (frank@ems.com)
   - Department: Marketing
   - Points: 3200
   - Tier: Diamond

---

## 📝 Useful Commands

```bash
# View all users and teams
node checkUsers.js

# Check specific user
node checkUser.js shreyachouhan0702@gmail.com

# Assign team members
node assignTeam.js shreyachouhan0702@gmail.com bob@ems.com

# Reset database with demo data
node createAllUsers.js

# Fix admin account
node fixAdmin.js
```

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `GET_STARTED.md` | Quick setup (3 min) |
| `QUICK_START_TL.md` | Team Lead quick start |
| `TEAM_LEAD_GUIDE.md` | Full TL documentation |
| `CURRENT_STATUS.md` | System status |
| `SESSION_SUMMARY.md` | Technical details |
| `QUICK_REFERENCE.md` | This cheat sheet |

---

## 🎯 Test Workflow

1. Start servers (backend + frontend)
2. Login as Shreya
3. Click "My Team" → See Alice & Frank
4. Click 🏆 on Alice → Assign 100 points
5. Click "All Employees" → See everyone (no Admin)
6. Click "Leaderboard" → See rankings

---

## ✅ Everything Works!

Your Employee Management System is **fully functional** with:
- 3 roles (Admin, TL, Employee)
- Team management for TLs
- Point assignment with validation
- Leaderboards and rankings
- Analytics and statistics
- Proper access control

**Start using it now!** 🚀

---

**Need detailed help?** → Read `TEAM_LEAD_GUIDE.md`
**Quick TL start?** → Read `QUICK_START_TL.md`
**Full setup?** → Read `GET_STARTED.md`
