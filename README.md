# Task Management System (TMS)

A full-stack Kanban-style Task Management System built with React and Express.js, implementing complete workflow state transitions, role-based access control, and audit trails.

## 🎯 Project Overview

This project implements a complete task management system following the Kanban methodology with:
- **User Authentication & Authorization** with JWT tokens
- **Role-Based Access Control (RBAC)** with user groups
- **Workflow State Management** (Open → ToDo → Doing → Done → Closed)
- **Audit Trail** for all task activities
- **Plan Management** for organizing tasks into sprints/MVPs

## 🏗️ Architecture

### Backend (Node.js + Express)
- **Framework**: Express.js
- **Database**: MySQL with mysql2 driver
- **Authentication**: JWT tokens in HTTP-only cookies
- **Security**: bcrypt password hashing, IP/browser validation

### Frontend (React + Vite)
- **Framework**: React 19 with Vite
- **UI Library**: Material-UI (MUI)
- **Routing**: React Router v7
- **State Management**: React Context API
- **HTTP Client**: Axios

## 📁 Project Structure

```
Task-Management-System/
├── backend/
│   ├── app.js                 # Main server with all API endpoints
│   ├── jwt.js                 # JWT utilities
│   ├── schema_tms.sql         # Database schema
│   ├── package.json
│   └── .env                   # Environment variables
│
├── frontend/
│   └── src/
│       ├── apis/
│       │   └── api.js         # API client
│       ├── pages/
│       │   ├── Home.jsx               # Login page
│       │   ├── UserManagement.jsx     # User CRUD (admin)
│       │   ├── ApplicationsDashboard.jsx  # Applications list
│       │   └── KanbanBoard.jsx        # Main Kanban board
│       ├── components/
│       │   ├── NavBar.jsx
│       │   ├── ProtectedRoute.jsx
│       │   └── SelectMultiple.jsx
│       └── contexts/
│           └── AuthContext.jsx
│
├── CLAUDE.md                  # Development guide
├── GETTING_STARTED.md         # Setup instructions
├── KANBAN_BOARD_GUIDE.md      # Testing guide
└── README.md                  # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v16+)
- MySQL (v8+)
- npm or yarn

### 1. Database Setup

```bash
# Open MySQL Workbench and run:
backend/schema_tms.sql
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
echo "DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=nodelogin
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=1h
PORT=5000" > .env

# Start development server
npm run dev
```

Backend runs on: http://localhost:5000

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend runs on: http://localhost:5173

## 🔑 Key Features

### User Management
- Create, read, update users (admin only)
- Disable/enable user accounts
- Password hashing with bcrypt
- User group assignment

### Application Management
- Create applications/projects
- Configure per-application permissions
- Track running numbers for task IDs
- Date range planning

### Plan Management
- Create MVP/sprint plans
- Color-coded visual distinction
- Assign tasks to plans
- Date range tracking

### Task Management
- **Create tasks** with auto-generated IDs (`APP_1`, `APP_2`, etc.)
- **5-state workflow**: Open → ToDo → Doing → Done → Closed
- **Permission-based transitions**:
  - Open → ToDo: Project Manager
  - ToDo → Doing: Developer
  - Doing → Done: Developer
  - Done → Closed: Project Lead
  - Backtrack/Reject options
- **Audit trail**: All notes with username, state, timestamp
- **Last touch**: Task owner updates on every interaction

### Security
- JWT tokens in HTTP-only cookies
- IP address and User-Agent validation
- Password complexity requirements
- Group-based authorization

## 📊 Database Schema

### Users Table
- `username` (PK)
- `email` (UNIQUE)
- `password` (bcrypt hashed)
- `user_groups` (JSON array)
- `Is_active` (BOOLEAN)

### Application Table
- `App_Acronym` (PK)
- `App_Description`
- `App_Rnumber` (auto-increment for task IDs)
- `App_startDate`, `App_endDate`
- `App_permit_Open` (group for creating tasks)
- `App_permit_toDoList` (group for releasing tasks)
- `App_permit_Doing` (group for working on tasks)
- `App_permit_Done` (group for approving tasks)

### Plan Table
- `Plan_MVP_name` (PK)
- `Plan_app_Acronym` (FK)
- `Plan_startDate`, `Plan_endDate`
- `Plan_color` (hex color)

### Task Table
- `Task_id` (PK) - Format: `[App_Acronym]_[Number]`
- `Task_name`
- `Task_description`
- `Task_notes` (JSON audit trail)
- `Task_plan` (FK to Plan, nullable)
- `Task_app_Acronym` (FK to Application)
- `Task_state` (ENUM: Open, ToDo, Doing, Done, Closed)
- `Task_creator`, `Task_owner`
- `Task_createDate`

## 🔌 API Endpoints

### Authentication
- `POST /login` - Login user
- `POST /logout` - Logout user
- `GET /me` - Get current user

### Users (Admin Only)
- `GET /api/users` - List all users
- `GET /api/users/:username` - Get user
- `POST /api/users` - Create user
- `PUT /api/users/:username` - Update user

### User Groups (Admin Only)
- `GET /api/user-groups` - List all groups
- `POST /api/user-groups` - Create group
- `DELETE /api/user-groups/:name` - Delete group

### Applications
- `GET /api/applications` - List all applications
- `GET /api/applications/:acronym` - Get application
- `POST /api/applications` - Create application (admin)
- `PUT /api/applications/:acronym` - Update application (admin)

### Plans
- `GET /api/applications/:acronym/plans` - List plans
- `POST /api/applications/:acronym/plans` - Create plan
- `PUT /api/applications/:acronym/plans/:name` - Update plan

### Tasks
- `GET /api/applications/:acronym/tasks` - List tasks
- `POST /api/applications/:acronym/tasks` - Create task
- `PATCH /api/applications/:acronym/tasks/:id/state` - Update task state
- `PATCH /api/applications/:acronym/tasks/:id` - Update task details

## 🧪 Testing

### Test User Setup
```sql
-- Create test users with different roles
UPDATE users SET user_groups = JSON_ARRAY('admin', 'project_lead')
WHERE username = 'lead_user';

UPDATE users SET user_groups = JSON_ARRAY('developer')
WHERE username = 'dev_user';

UPDATE users SET user_groups = JSON_ARRAY('project_manager')
WHERE username = 'pm_user';
```

### Test Application Setup
```sql
UPDATE application
SET
  App_permit_Open = 'project_lead',
  App_permit_toDoList = 'project_manager',
  App_permit_Doing = 'developer',
  App_permit_Done = 'project_lead'
WHERE App_Acronym = 'DEMO';
```

See **KANBAN_BOARD_GUIDE.md** for complete testing instructions.

## 📚 Documentation

- **CLAUDE.md** - Architecture and development guide for AI assistants
- **GETTING_STARTED.md** - Detailed setup and next steps
- **KANBAN_BOARD_GUIDE.md** - Complete testing guide with use cases

## 🎓 Assignment Progress

### ✅ Assignment 1: User Management (Completed)
- Login/logout functionality
- User CRUD operations
- User group management
- Admin privileges
- Password security (bcrypt)

### ✅ Assignment 2: Task Management (Completed)
- Workflow implementation (5 states)
- Data model (Application, Plan, Task)
- Kanban board UI
- Permission-based state transitions
- Audit trail
- Task ID auto-generation

### 🔜 Assignment 3: REST API (To Do)
- CreateTask API
- GetTaskbyState API
- PromoteTask2Done API

### 🔜 Assignment 4: Docker (To Do)
- Dockerfile creation
- Container image optimization (<200MB)
- Deployment configuration

## 🛠️ Technologies Used

### Backend
- Express.js - Web framework
- mysql2 - MySQL driver
- jsonwebtoken - JWT authentication
- bcrypt - Password hashing
- cookie-parser - Cookie parsing
- cors - CORS middleware
- dotenv - Environment variables

### Frontend
- React 19 - UI library
- Vite - Build tool
- Material-UI - Component library
- React Router - Routing
- Axios - HTTP client
- Emotion - CSS-in-JS

## 🤝 Contributing

This is an educational project for the MSS Academy Software Engineer Foundation Assignment.

## 📄 License

This project is for educational purposes.

## 👨‍💻 Author

Built following the MSS Academy Software Engineer Foundation Assignment specifications.

---

For detailed setup instructions, see **GETTING_STARTED.md**
For testing guide, see **KANBAN_BOARD_GUIDE.md**
For development guide, see **CLAUDE.md**
