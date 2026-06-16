# Quick Start Guide for Team Leads

## Login as Team Lead

**Shreya Chouhan (Demo Account)**
- **Email:** `shreyachouhan0702@gmail.com`
- **Password:** `password123`

## Your Team Members

You currently have **2 employees** assigned to your team:

1. **Alice Brown** (alice@ems.com) - Engineering, 2600 points
2. **Frank Anderson** (frank@ems.com) - Marketing, 3200 points

## What You Can Do Now

### 1. View Your Team
- Click **"My Team"** in the sidebar
- See Alice and Frank's profiles, points, and tier badges

### 2. Assign Points
- Click the 🏆 award icon on any team member's card
- Enter points (e.g., 100)
- Add a note (e.g., "Great work on the project!")
- Submit

### 3. View All Employees
- Click **"All Employees"** in the sidebar
- See all 10 employees and 2 other Team Leads
- Search and filter by name/department
- View their profiles (but you can't see the Admin)

### 4. Check Leaderboard
- Click **"Leaderboard"** in the sidebar
- See how your team members rank among all employees

### 5. View Your Stats
- Click **"My Stats"** to see your personal statistics

## Adding More Team Members

Want to add more employees to your team? You have 3 options:

### Option 1: Ask Admin
Login as admin and edit an employee's profile to assign them to you.

### Option 2: Use Command Line
From the `server` directory:
```bash
node assignTeam.js shreyachouhan0702@gmail.com bob@ems.com charlie@ems.com
```

### Option 3: Create New Employee
Use the "Create Employee" button - they'll auto-assign to you.

## Testing Point Assignment

1. Go to "My Team"
2. Click 🏆 on Alice Brown's card
3. Enter: **100** points
4. Note: "Excellent work on documentation!"
5. Click "Assign"
6. Watch her points increase from 2600 to 2700! ✨

## Access Limitations

✅ **You CAN:**
- View all Employees and TLs
- Assign points to YOUR team (Alice & Frank)
- View leaderboards and analytics

❌ **You CANNOT:**
- View Admin profiles
- Assign points to employees on other teams
- Delete or edit employee roles

## Other Team Leads

- **John Smith** (john@ems.com) - Engineering, 4 team members
- **Sarah Johnson** (sarah@ems.com) - Marketing, 4 team members

## Need Help?

Check the full **TEAM_LEAD_GUIDE.md** for detailed instructions!
