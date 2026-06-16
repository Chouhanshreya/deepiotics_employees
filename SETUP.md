# Employee Management System - Setup Guide

## Quick Start

Follow these steps to get the application running:

### 1. Install MongoDB

**Windows:**
- Download MongoDB Community Server from https://www.mongodb.com/try/download/community
- Install and start MongoDB service
- MongoDB will run on `mongodb://localhost:27017` by default

**Mac (using Homebrew):**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Linux:**
```bash
sudo apt-get install mongodb
sudo systemctl start mongodb
```

### 2. Backend Setup

Open a terminal and navigate to the server directory:

```bash
cd server
```

Install dependencies:
```bash
npm install
```

The `.env` file is already configured with default settings:
- PORT: 5000
- MONGODB_URI: mongodb://localhost:27017/employee_management
- JWT_SECRET: (change this in production!)

Start the backend server:
```bash
npm run dev
```

You should see:
```
Server is running on port 5000
MongoDB Connected: localhost
```

### 3. Seed the Database (Optional but Recommended)

In a new terminal, while the server is running, seed demo data:

```bash
cd server
node scripts/seed.js
```

This creates:
- 1 Admin account
- 2 Team Leads
- 10 Employees
- Sample tasks and point history

**Demo Login Credentials:**
- Admin: `admin@ems.com` / `password123`
- TL: `john@ems.com` / `password123`
- Employee: `alice@ems.com` / `password123`

### 4. Frontend Setup

Open a NEW terminal and navigate to the client directory:

```bash
cd client
```

Install dependencies:
```bash
npm install
```

Start the frontend development server:
```bash
npm run dev
```

The application will open at `http://localhost:5173`

### 5. Access the Application

Open your browser and go to:
```
http://localhost:5173
```

Login with one of the demo accounts above.

## Troubleshooting

### MongoDB Connection Error
- **Issue**: `MongooseServerSelectionError: connect ECONNREFUSED`
- **Solution**: Make sure MongoDB is running
  - Windows: Check MongoDB service in Services
  - Mac/Linux: Run `brew services list` or `sudo systemctl status mongodb`

### Port Already in Use
- **Issue**: `Error: listen EADDRINUSE: address already in use :::5000`
- **Solution**: 
  - Change PORT in `server/.env` to another port (e.g., 5001)
  - Or stop the process using port 5000

### CORS Errors
- **Issue**: CORS policy blocking requests
- **Solution**: Make sure both frontend (5173) and backend (5000) are running
- The backend is configured to accept requests from `http://localhost:5173`

### Dependencies Not Installing
- **Issue**: npm install fails
- **Solution**: 
  - Make sure you have Node.js v16+ installed: `node --version`
  - Clear npm cache: `npm cache clean --force`
  - Delete `node_modules` and `package-lock.json`, then run `npm install` again

## Testing the Application

### As Admin:
1. Login with `admin@ems.com` / `password123`
2. Navigate to "Employees" to see all users
3. Click "Create Employee" to add new users
4. Assign points by clicking the award icon
5. View "Analytics" for charts and statistics
6. Manage tasks in "Workflow"

### As Team Lead:
1. Login with `john@ems.com` / `password123`
2. See only your team members
3. Create employees and assign to your team
4. Assign points to team members
5. Create and manage team tasks

### As Employee:
1. Login with `alice@ems.com` / `password123`
2. View your dashboard with stats
3. Check the leaderboard for your rank
4. View your team members
5. See your personal statistics

## Development Commands

### Backend (server directory)
```bash
npm run dev     # Start development server with nodemon
npm start       # Start production server
```

### Frontend (client directory)
```bash
npm run dev     # Start Vite development server
npm run build   # Build for production
npm run preview # Preview production build
```

## Production Deployment

### Environment Variables
Before deploying, update these in `server/.env`:

```env
NODE_ENV=production
JWT_SECRET=<generate-a-secure-random-string>
MONGODB_URI=<your-production-mongodb-uri>
```

### Frontend Build
```bash
cd client
npm run build
```

The `dist` folder contains the production-ready frontend files.

### Backend Deployment
Make sure to:
1. Set NODE_ENV to "production"
2. Use a strong JWT_SECRET
3. Use MongoDB Atlas or a production database
4. Enable HTTPS
5. Set secure cookie options

## Need Help?

- Check the main README.md for API documentation
- Review the code comments for implementation details
- MongoDB docs: https://docs.mongodb.com/
- Express docs: https://expressjs.com/
- React docs: https://react.dev/

Enjoy building with the Employee Management System! 🚀
