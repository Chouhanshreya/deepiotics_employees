# 🏗️ System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         BROWSER                              │
│                    http://localhost:5173                     │
└────────────────┬────────────────────────────────────────────┘
                 │
                 │ HTTP Requests
                 │ (REST API)
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                    REACT FRONTEND (Vite)                     │
│  ┌──────────────┬──────────────┬──────────────────────────┐ │
│  │  Components  │   Context    │        Pages             │ │
│  │              │              │                          │ │
│  │  • Sidebar   │  • Auth      │  • Login                 │ │
│  │  • Avatar    │              │  • Employee Dashboard    │ │
│  │  • TierBadge │              │  • Admin Dashboard       │ │
│  │  • StatCard  │              │  • Leaderboard           │ │
│  │  • Layout    │              │  • Analytics             │ │
│  └──────────────┴──────────────┴──────────────────────────┘ │
│                          │                                   │
│                          │ Axios HTTP                        │
│                          ▼                                   │
│                    API Utility Layer                         │
└─────────────────────────────────────────────────────────────┘
                 │
                 │ JWT Cookie
                 │ JSON Data
                 ▼
┌─────────────────────────────────────────────────────────────┐
│               EXPRESS.JS BACKEND (Node.js)                   │
│                    http://localhost:5000                     │
│  ┌──────────────┬──────────────┬──────────────────────────┐ │
│  │  Middleware  │   Routes     │      Controllers         │ │
│  │              │              │                          │ │
│  │  • Auth      │  • /auth     │  • authController        │ │
│  │  • CORS      │  • /users    │  • userController        │ │
│  │  • JSON      │  • /tasks    │  • taskController        │ │
│  │  • Cookies   │  • /analytics│  • analyticsController   │ │
│  └──────────────┴──────────────┴──────────────────────────┘ │
│                          │                                   │
│                          │ Mongoose ODM                      │
│                          ▼                                   │
│                    Models (Schemas)                          │
│                • User   • Task   • PointHistory             │
└─────────────────────────────────────────────────────────────┘
                 │
                 │ MongoDB Driver
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                      MONGODB DATABASE                        │
│                  mongodb://localhost:27017                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Collections:                                         │   │
│  │  • users          (employees, TLs, admins)           │   │
│  │  • tasks          (workflow items)                    │   │
│  │  • pointhistories (point assignment logs)            │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Request Flow Example

### User Login Flow

```
1. User enters email/password on Login page
   ↓
2. Frontend: axios.post('/api/auth/login', credentials)
   ↓
3. Backend: authRoutes receives request
   ↓
4. authController.login() validates credentials
   ↓
5. User.findOne({ email }) queries MongoDB
   ↓
6. bcrypt.compare() checks password hash
   ↓
7. jwt.sign() generates token
   ↓
8. res.cookie('token', ...) sets httpOnly cookie
   ↓
9. User data returned to frontend
   ↓
10. AuthContext stores user state
    ↓
11. React Router redirects based on role
    ↓
12. Role-specific dashboard rendered
```

### Protected Route Access

```
1. User navigates to protected page (e.g., /employees)
   ↓
2. ProtectedRoute component checks auth state
   ↓
3. If not authenticated → redirect to /login
   ↓
4. If authenticated but wrong role → redirect to /
   ↓
5. If authorized → render requested page
   ↓
6. Page makes API call with JWT cookie
   ↓
7. Backend: auth middleware verifies token
   ↓
8. authorize() middleware checks user role
   ↓
9. Controller processes request
   ↓
10. MongoDB query executed
    ↓
11. Data returned to frontend
    ↓
12. React component renders data
```

---

## Data Models

### User Schema
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  role: 'Admin' | 'TL' | 'Employee',
  department: String,
  teamLead: ObjectId → User,
  points: Number,
  tasksCompleted: Number,
  activeStreak: Number,
  lastActiveDate: Date,
  joinDate: Date,
  createdAt: Date,
  updatedAt: Date,
  
  // Virtual field (calculated)
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond'
}
```

### Task Schema
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  assignedTo: ObjectId → User,
  status: 'To Do' | 'In Progress' | 'Done',
  points: Number,
  createdBy: ObjectId → User,
  createdAt: Date,
  updatedAt: Date
}
```

### PointHistory Schema
```javascript
{
  _id: ObjectId,
  employee: ObjectId → User,
  points: Number,
  note: String,
  assignedBy: ObjectId → User,
  createdAt: Date,
  updatedAt: Date
}
```

---

## API Endpoints

### Authentication
```
POST   /api/auth/login          Login user
POST   /api/auth/logout         Logout user
GET    /api/auth/me             Get current user
```

### Users
```
GET    /api/users               Get all users (Admin/TL)
POST   /api/users               Create user (Admin/TL)
GET    /api/users/:id           Get user by ID
PUT    /api/users/:id           Update user (Admin)
DELETE /api/users/:id           Delete user (Admin)
GET    /api/users/leaderboard   Get leaderboard (All)
GET    /api/users/team          Get team members (Employee)
POST   /api/users/:id/points    Assign points (Admin/TL)
GET    /api/users/:id/points/history  Get point history (Admin/TL)
```

### Tasks
```
GET    /api/tasks               Get all tasks (Admin/TL)
POST   /api/tasks               Create task (Admin/TL)
GET    /api/tasks/my-tasks      Get my tasks (All)
PUT    /api/tasks/:id           Update task (All)
DELETE /api/tasks/:id           Delete task (Admin/TL)
```

### Analytics
```
GET    /api/analytics/overview           Get overview stats (Admin/TL)
GET    /api/analytics/top-performers     Get top 10 (Admin/TL)
GET    /api/analytics/points-timeline    Get points over time (Admin/TL)
GET    /api/analytics/user-stats/:id     Get user stats (All)
```

---

## Authentication Flow

```
┌──────────────┐
│   Browser    │
└──────┬───────┘
       │
       │ 1. POST /api/auth/login
       │    { email, password }
       ▼
┌──────────────────┐
│  Auth Controller │
│                  │
│  2. Validate     │
│  3. Check DB     │
│  4. Hash compare │
│  5. Generate JWT │
└──────┬───────────┘
       │
       │ 6. Set Cookie: token=JWT (httpOnly)
       │ 7. Return: { user data }
       ▼
┌──────────────┐
│   Browser    │
│              │
│  Stores:     │
│  • Cookie    │ ← Sent automatically on each request
│  • User data │ ← Stored in Context
└──────────────┘
```

---

## Authorization Matrix

| Resource | Admin | TL | Employee |
|----------|-------|-----|----------|
| **Users** |
| View all users | ✅ | Team only | ❌ |
| Create user | ✅ | ✅ Employee only | ❌ |
| Edit user | ✅ | ❌ | ❌ |
| Delete user | ✅ | ❌ | ❌ |
| Assign points | ✅ | Team only | ❌ |
| **Tasks** |
| View all tasks | ✅ | Team only | Own only |
| Create task | ✅ | ✅ | ❌ |
| Update task | ✅ | ✅ | Own only |
| Delete task | ✅ | ✅ | ❌ |
| **Profiles** |
| View own | ✅ | ✅ | ✅ |
| View others | ✅ | Team only | Teammates only |
| View Admin/TL | ✅ | ✅ | ❌ |
| **Analytics** |
| View overview | ✅ | Team only | ❌ |
| View charts | ✅ | Team only | Own only |
| **Leaderboard** |
| View leaderboard | ✅ | ✅ | ✅ |

---

## Frontend Component Tree

```
App
├── AuthProvider (Context)
└── Router
    ├── Login (Public)
    └── Layout (Protected)
        ├── Sidebar
        │   ├── Navigation Links
        │   ├── User Info
        │   └── Logout Button
        │
        └── Routes
            │
            ├── Employee Routes (role: Employee)
            │   ├── Home
            │   │   ├── Greeting
            │   │   ├── Quote Card
            │   │   └── 4x StatCard
            │   ├── Profile
            │   │   ├── Avatar
            │   │   ├── TierBadge
            │   │   └── Info Rows
            │   ├── Leaderboard
            │   │   ├── Progress Card
            │   │   └── Ranked Table
            │   ├── Team
            │   │   └── Grid of Team Cards
            │   └── Stats
            │       ├── 4x StatCard
            │       └── Chart
            │
            └── Admin/TL Routes (role: Admin, TL)
                ├── Overview
                │   ├── 4x StatCard
                │   └── Top Performer Card
                ├── Employees
                │   ├── Search Bar
                │   ├── Table
                │   └── Assign Points Modal
                ├── CreateEmployee
                │   └── Form
                ├── Workflow
                │   ├── 3x Kanban Columns
                │   └── Create Task Modal
                ├── Analytics
                │   ├── Bar Chart
                │   ├── Line Chart
                │   └── Performers List
                └── Settings
                    └── Profile Info
```

---

## State Management

### Global State (Context)
```javascript
AuthContext:
  - user: Current user object
  - loading: Boolean
  - login: Function
  - logout: Function
  - isAuthenticated: Boolean
  - isAdmin: Boolean
  - isTL: Boolean
  - isEmployee: Boolean
```

### Local Component State
```javascript
// Example: Employees page
const [employees, setEmployees] = useState([])
const [searchTerm, setSearchTerm] = useState('')
const [filteredEmployees, setFilteredEmployees] = useState([])
const [showModal, setShowModal] = useState(false)
const [selectedEmployee, setSelectedEmployee] = useState(null)
```

---

## Security Layers

```
1. Frontend Route Protection
   └─ ProtectedRoute component
      └─ Checks auth state
         └─ Checks user role

2. Backend Route Protection
   └─ auth.protect middleware
      └─ Verifies JWT token
         └─ Loads user from DB

3. Backend Role Authorization
   └─ auth.authorize([roles]) middleware
      └─ Checks user.role
         └─ Allows/denies access

4. Database Level
   └─ Mongoose validation
      └─ Schema constraints
         └─ Data integrity
```

---

## Build & Deploy

### Development
```bash
# Terminal 1: Backend
cd server
npm run dev          # Port 5000

# Terminal 2: Frontend  
cd client
npm run dev          # Port 5173
```

### Production
```bash
# Frontend build
cd client
npm run build        # Creates dist/

# Backend (use PM2 or similar)
cd server
NODE_ENV=production npm start
```

### Environment
```
Development:
  - Frontend: Vite dev server
  - Backend: Nodemon auto-reload
  - Database: Local MongoDB

Production:
  - Frontend: Static files (Nginx/Apache)
  - Backend: Node process manager
  - Database: MongoDB Atlas / Managed DB
```

---

## File Organization

```
Root
├── client/               React app
│   ├── public/           Static assets
│   └── src/
│       ├── components/   UI components
│       ├── context/      Global state
│       ├── pages/        Route pages
│       ├── utils/        Helpers
│       ├── App.jsx       Root component
│       └── main.jsx      Entry point
│
├── server/               Express app
│   ├── config/           Configuration
│   ├── controllers/      Business logic
│   ├── middleware/       Custom middleware
│   ├── models/           DB schemas
│   ├── routes/           API routes
│   ├── scripts/          Utilities
│   └── server.js         Entry point
│
└── Documentation         Guides
    ├── README.md
    ├── SETUP.md
    ├── START.md
    ├── ARCHITECTURE.md (you are here!)
    └── ...
```

---

This architecture provides:
- ✅ Clear separation of concerns
- ✅ Scalable structure
- ✅ Security at multiple layers
- ✅ Maintainable codebase
- ✅ Easy to understand flow

Ready to build and deploy! 🚀
