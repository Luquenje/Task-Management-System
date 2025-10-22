# Getting Started with Task Management System

## What We've Built

I've implemented **Assignment 2: Task Management Features** from your PDF specification. Here's what's ready:

### Backend (Express.js)
✅ **Database Schema** (`backend/schema_tms.sql`)
- `application` table - Stores project information with permissions
- `plan` table - Stores MVP plans with dates
- `task` table - Stores tasks with workflow states (Open → ToDo → Doing → Done → Closed)

✅ **API Endpoints** (`backend/app.js`)
- **Application Management**: GET, POST, PUT for applications
- **Plan Management**: GET, POST, PUT for plans
- **Task Management**: GET, POST, PATCH for tasks with state transitions
- **Workflow State Transitions** with permission checks
- **Audit Trail** for task notes (username, state, timestamp)
- **Task ID Generation**: Format `[App_Acronym]_[Running_Number]`

### Frontend (React)
✅ **API Client** (`frontend/src/apis/api.js`)
- Functions for applications, plans, and tasks

✅ **Application Dashboard** (`frontend/src/pages/ApplicationsDashboard.jsx`)
- View all applications in a grid
- Create new applications (admin only)
- Navigate to Kanban board

## Next Steps to Run Your Application

### Step 1: Set Up the Database

1. Open MySQL Workbench and connect to your database

2. Run the schema script:
   ```bash
   # Navigate to backend folder
   cd backend

   # Run the SQL file in MySQL Workbench
   # Open: backend/schema_tms.sql
   # Execute all statements
   ```

3. The script will create:
   - `application` table
   - `plan` table
   - `task` table
   - Sample data (DEMO application with 2 plans)

### Step 2: Start the Backend

```bash
cd backend
npm run dev
```

The backend should start on `http://localhost:5000`

### Step 3: Start the Frontend

```bash
cd frontend
npm run dev
```

The frontend should start on `http://localhost:5173`

### Step 4: Test the Application

1. **Login** with your existing user credentials

2. **Navigate to Applications page**:
   - Click on "Applications" in the navigation

3. **Create an Application** (if you're an admin):
   - Click "Create Application"
   - Fill in:
     - Acronym (e.g., "DEMO", "PROJ1")
     - Description
     - Start/End dates
   - Click "Create"

4. **View Application**:
   - Click "View Tasks" on any application card
   - This will navigate to the Kanban board (not yet implemented)

## What Still Needs to Be Built

### Immediate Priority: Kanban Board Page

The Kanban board page (`/applications/:acronym/kanban`) needs to be created. This should include:

1. **Kanban Board Layout**:
   - 5 columns: Open, ToDo, Doing, Done, Closed
   - Drag-and-drop between columns (or buttons for state transitions)
   - Task cards showing Task_id, Task_name, owner, plan

2. **Task Creation**:
   - Create new tasks (requires App_permit_Open group)
   - Task name, description, assign to plan

3. **Task Details View**:
   - View/edit task description
   - View audit trail (Task_notes)
   - Add notes
   - Change task state (with permission checks)

4. **Plan Management**:
   - Create/edit plans for the application
   - Assign tasks to plans

5. **Permission Checks**:
   - Only show state transition buttons if user is in required group
   - Open → ToDo: App_permit_toDoList
   - ToDo → Doing: App_permit_Doing
   - Doing → Done: App_permit_Doing
   - Done → Closed: App_permit_Done
   - Doing → ToDo: App_permit_Doing (backtrack)
   - Done → Doing: App_permit_Done (reject)

### Future Enhancements

1. **Application Settings Page**:
   - Configure user group permissions (App_permit_Open, etc.)
   - Edit application details

2. **Email Notifications**:
   - Send email when task moves to "Done" state
   - Requires email configuration

3. **Task Filtering/Searching**:
   - Filter by state, plan, owner
   - Search by task name/description

4. **REST API** (Assignment 3):
   - CreateTask API
   - GetTaskbyState API
   - PromoteTask2Done API

## Current Workflow Implementation

The system implements the workflow as specified in the PDF:

```
Open → ToDo → Doing → Done → Closed
         ↑      ↓      ↑      ↓
         ← backtrack  ← reject
```

**Permissions** (configured per application):
- **App_permit_Open**: Can create tasks (Open state)
- **App_permit_toDoList**: Can release tasks to ToDo
- **App_permit_Doing**: Can work on tasks (Doing/Done states)
- **App_permit_Done**: Can approve/close tasks (Closed state)

**Features Implemented**:
- ✅ Task ID auto-generation
- ✅ Audit trail in Task_notes (JSON format)
- ✅ Last touch = Task_owner update
- ✅ State transition validation
- ✅ Group permission checks
- ✅ Transaction support for task creation

## Troubleshooting

### Backend Issues

**Error: "Cannot find module"**
```bash
cd backend
npm install
```

**Error: "Database connection failed"**
- Check your `.env` file in `backend/` folder
- Ensure MySQL is running
- Verify database credentials

**Error: "ER_NO_SUCH_TABLE"**
- Run the `schema_tms.sql` script in MySQL Workbench

### Frontend Issues

**Error: "Module not found"**
```bash
cd frontend
npm install
```

**Blank page or routing issues**
- Check browser console for errors
- Ensure backend is running on port 5000
- Check CORS configuration

## File Structure

```
Task-Management-System/
├── backend/
│   ├── app.js               # Main server file with all API endpoints
│   ├── jwt.js               # JWT utilities
│   ├── schema_tms.sql       # Database schema for TMS
│   ├── package.json
│   └── .env                 # Database configuration
├── frontend/
│   └── src/
│       ├── apis/
│       │   └── api.js       # API client with all endpoints
│       ├── pages/
│       │   ├── ApplicationsDashboard.jsx  # Applications page
│       │   ├── Home.jsx
│       │   └── UserManagement.jsx
│       ├── components/
│       │   └── NavBar.jsx
│       └── contexts/
│           └── AuthContext.jsx
├── CLAUDE.md                # Project documentation for Claude
└── GETTING_STARTED.md       # This file
```

## API Endpoints Reference

### Applications
- `GET /api/applications` - Get all applications
- `GET /api/applications/:acronym` - Get single application
- `POST /api/applications` - Create application (admin only)
- `PUT /api/applications/:acronym` - Update application (admin only)

### Plans
- `GET /api/applications/:acronym/plans` - Get all plans for app
- `POST /api/applications/:acronym/plans` - Create plan
- `PUT /api/applications/:acronym/plans/:planName` - Update plan

### Tasks
- `GET /api/applications/:acronym/tasks` - Get all tasks for app
- `POST /api/applications/:acronym/tasks` - Create task (requires permission)
- `PATCH /api/applications/:acronym/tasks/:taskId/state` - Update task state
- `PATCH /api/applications/:acronym/tasks/:taskId` - Update task details

## Next Steps for Development

1. **Create Kanban Board Page** - This is the main feature missing
2. **Test Workflow** - Create tasks and test state transitions
3. **Add Application Settings** - Configure permissions
4. **Implement REST APIs** (Assignment 3)
5. **Containerize with Docker** (Assignment 4)

Good luck with your development! 🚀
