# Team Lead Guide

## Overview
As a Team Lead, you have special permissions to manage and motivate your team members.

## What Team Leads Can Do

### 1. View Your Team Members
- Navigate to **"My Team"** in the sidebar
- See all employees assigned to you as their Team Lead
- View their points, tier badges, and profiles

### 2. Assign Points to Your Team
- Click the award icon (🏆) on any team member's card in "My Team"
- Enter the points you want to assign
- Add an optional note explaining why
- Points are immediately added to their total

**Important:** You can only assign points to employees who are **directly assigned to you** as their Team Lead.

### 3. View All Employees and Team Leads
- Navigate to **"All Employees"** in the sidebar
- See complete profiles of all Employees and other Team Leads
- You **cannot** see Admin profiles (for security)
- Search and filter by name, department, or rank

### 4. View Analytics
- Access leaderboards to see top performers
- Monitor your team's progress
- View your own statistics and rank

### 5. Create New Employees (If Permitted)
- New employees you create are automatically assigned to your team

## Getting Started

### Check If You Have Team Members

1. **Via Web Interface:**
   - Login with your credentials
   - Go to **"My Team"** in the sidebar
   - If you see "No team members assigned yet", continue to step 2

2. **Via Command Line** (server directory):
   ```bash
   node checkUser.js <your-email>
   ```

### Assign Employees to Your Team

There are three ways to add team members:

#### Option 1: Ask an Admin
- Request that an Admin edit employee profiles
- Admin can change their "Team Lead" field to your name

#### Option 2: Use the assignTeam Script
From the `server` directory, run:
```bash
node assignTeam.js <your-email> <employee1-email> <employee2-email> ...
```

**Example:**
```bash
node assignTeam.js shreyachouhan0702@gmail.com alice@ems.com bob@ems.com
```

This will assign Alice and Bob to your team.

#### Option 3: Create New Employees
- Use the **"Create Employee"** page
- New employees are automatically assigned to you

## Assigning Points - Best Practices

### When to Assign Points
- Completing a major task or project
- Going above and beyond expectations
- Helping teammates
- Meeting important deadlines
- Demonstrating excellent work quality

### Point Values Guide
- **50-100 points**: Small wins, daily tasks completed well
- **100-250 points**: Weekly goals achieved, good performance
- **250-500 points**: Major milestones, exceptional work
- **500+ points**: Outstanding achievements, critical projects completed

### Adding Notes
Always add a note when assigning points:
- "Great work on the Q1 report!"
- "Excellent collaboration with the design team"
- "Outstanding performance this sprint"

This helps employees understand what they're being recognized for.

## Point Assignment Rules

✅ **You CAN assign points to:**
- Employees where YOU are listed as their Team Lead
- Your direct reports

❌ **You CANNOT assign points to:**
- Employees assigned to other Team Leads
- Other Team Leads
- Admins
- Yourself
- Employees with no team assignment

## Tier System

Points determine employee tiers:
- **Bronze**: 0-499 points
- **Silver**: 500-999 points
- **Gold**: 1000-1999 points
- **Platinum**: 2000-2999 points
- **Diamond**: 3000+ points

Tiers update automatically when points are assigned.

## Access Permissions Summary

| Action | Team Lead Access |
|--------|-----------------|
| View own team members | ✅ Yes |
| Assign points to own team | ✅ Yes |
| View all Employees | ✅ Yes |
| View other Team Leads | ✅ Yes |
| View Admins | ❌ No |
| Assign points to other teams | ❌ No |
| Delete employees | ❌ No |
| Edit employee roles | ❌ No |

## Troubleshooting

### "No team members assigned yet"
**Solution:** Use one of the three methods above to assign employees to your team.

### "You can only assign points to your team members"
**Cause:** The employee belongs to another team or has no team assigned.
**Solution:** Only assign points to employees listed in your "My Team" page.

### Can't see team members after assignment
**Solution:** 
1. Log out and log back in
2. Refresh the page
3. Check that employees were correctly assigned using `node checkUsers.js`

## Useful Commands (Server Directory)

```bash
# Check your user details and team
node checkUser.js <your-email>

# View all users in database
node checkUsers.js

# Assign employees to your team
node assignTeam.js <your-email> <employee1> <employee2> ...

# Check all team assignments
node checkUsers.js
```

## Example Workflow

1. **Login** as Team Lead
2. **Navigate** to "My Team"
3. **View** your team members (if empty, follow assignment steps)
4. **Click** on a team member to view their full profile
5. **Assign Points** by clicking the award icon
6. **Monitor Progress** via "All Employees" and "Leaderboard"

## Demo Team Lead Account

**Shreya Chouhan**
- Email: `shreyachouhan0702@gmail.com`
- Password: `password123`
- Department: Engineering
- Role: TL

## Need Help?

Contact your system administrator if you:
- Need employees assigned to your team
- Have permission issues
- Need to change team assignments
- Experience technical problems
