# Kanban Board - Complete Guide

## 🎉 What's Been Built

The Kanban Board is now fully functional with all features from the PDF requirements!

### Features Implemented

✅ **5-Column Kanban Layout**
- Open, ToDo, Doing, Done, Closed columns
- Visual task cards with color-coded plans
- Task counts per column

✅ **Task Management**
- Create tasks (Open state) - requires App_permit_Open permission
- View task details with full audit trail
- Add notes to tasks
- Assign tasks to plans
- Task owner updates on "last touch"

✅ **Workflow State Transitions**
- Open → ToDo (Release) - requires App_permit_toDoList
- ToDo → Doing (Start) - requires App_permit_Doing
- Doing → Done - requires App_permit_Doing
- Doing → ToDo (Backtrack) - requires App_permit_Doing
- Done → Closed (Approve) - requires App_permit_Done
- Done → Doing (Reject) - requires App_permit_Done

✅ **Permission-Based UI**
- State transition buttons only show if user has required permissions
- Create task button only visible if user can create tasks

✅ **Plan Management**
- Create plans with color coding
- Assign tasks to plans
- Visual plan chips on task cards

✅ **Audit Trail**
- All task notes stored with username, state, and timestamp
- Chronological display (newest first)
- Read-only audit history

## 🚀 Getting Started

### Step 1: Set Up Database

```bash
# Open MySQL Workbench
# Run the schema file: backend/schema_tms.sql
```

This creates sample data:
- Application: "DEMO"
- Plans: "Sprint 1" and "Sprint 2"
- Permissions: admin group for all actions

### Step 2: Configure User Groups

Before testing, you need to set up user groups and assign users:

```sql
-- Create user groups (if not already created)
INSERT INTO user_groups (group_name) VALUES ('developer');
INSERT INTO user_groups (group_name) VALUES ('project_lead');

-- Assign groups to your test user
-- Replace 'your_username' with your actual username
UPDATE users
SET user_groups = JSON_ARRAY('admin', 'developer', 'project_lead')
WHERE username = 'your_username';
```

### Step 3: Start the Application

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Step 4: Navigate to Kanban Board

1. Login to the application
2. Go to "Applications" page (http://localhost:5173/applications)
3. Click "View Tasks" on the DEMO application
4. You should see the Kanban board with 5 columns

## 📋 Testing the Complete Workflow

### Test Case 1: Create a Task (Project Lead)

**Prerequisites**: User must be in the group specified in `App_permit_Open` (default: "admin")

1. On the Kanban board, click "Create Task"
2. Fill in:
   - Task Name: "Implement login feature"
   - Description: "Add user authentication"
   - Plan: "Sprint 1" (optional)
3. Click "Create"
4. Task appears in the "Open" column with Task_id "DEMO_1"

**Expected Result**:
- Task created with auto-generated ID
- Task shows in Open column
- Audit trail shows "Task created" by your username

### Test Case 2: Release to ToDo (Project Manager)

**Prerequisites**: User must be in the group specified in `App_permit_toDoList`

1. Find the task in "Open" column
2. Click the "Release" button on the task card
3. Task moves to "ToDo" column

**Expected Result**:
- Task state changes to "ToDo"
- Task owner updated to your username (last touch)
- Audit trail shows state transition

### Test Case 3: Start Working (Developer)

**Prerequisites**: User must be in the group specified in `App_permit_Doing`

1. Find the task in "ToDo" column
2. Click the "Start" button
3. Task moves to "Doing" column

**Expected Result**:
- Task state changes to "Doing"
- Task owner updated to your username
- Audit trail updated

### Test Case 4: Mark as Done (Developer)

**Prerequisites**: User must be in the group specified in `App_permit_Doing`

1. Find the task in "Doing" column
2. Click on the task card to open details
3. Add a note: "Completed implementation and testing"
4. Click the "Done" button
5. Task moves to "Done" column

**Expected Result**:
- Task state changes to "Done"
- Note added to audit trail
- Email notification sent (when implemented)

### Test Case 5: Approve Task (Project Lead)

**Prerequisites**: User must be in the group specified in `App_permit_Done`

1. Find the task in "Done" column
2. Click the "Approve" button
3. Task moves to "Closed" column

**Expected Result**:
- Task state changes to "Closed"
- Task is now read-only (no more state transitions)

### Test Case 6: Reject Task (Project Lead)

**Prerequisites**: User must be in the group specified in `App_permit_Done`

1. Find a task in "Done" column
2. Click the "Reject" button
3. Task moves back to "Doing" column

**Expected Result**:
- Task state changes back to "Doing"
- Developer can continue working on it

### Test Case 7: Backtrack from Doing (Developer)

**Prerequisites**: User must be in the group specified in `App_permit_Doing`

1. Find a task in "Doing" column
2. Click the "Back" button
3. Task moves back to "ToDo" column

**Expected Result**:
- Task state changes back to "ToDo"
- Another developer can pick it up

## 🎨 UI Features

### Task Cards Display
- **Task ID**: Top-left (e.g., DEMO_1)
- **Plan Chip**: Top-right with plan color
- **Task Name**: Bold title
- **Description**: Truncated to 2 lines
- **Owner**: Bottom-left chip
- **Date**: Bottom-right (creation date)

### Task Detail Dialog
Shows when you click on a task card:
- Full task information
- Add notes section
- Complete audit trail
- State transition buttons

### Color Coding
- **Plan Colors**: Each plan has a unique color (left border on task cards)
- **State Colors**:
  - Open: Grey (#9e9e9e)
  - ToDo: Blue (#2196f3)
  - Doing: Orange (#ff9800)
  - Done: Green (#4caf50)
  - Closed: Dark Grey (#607d8b)

## 🔒 Permission Testing

### To Test Permissions Properly:

1. **Create Multiple User Accounts** with different groups:
   ```sql
   -- Project Lead (can create tasks and approve)
   UPDATE users SET user_groups = JSON_ARRAY('admin', 'project_lead')
   WHERE username = 'lead_user';

   -- Developer (can work on tasks)
   UPDATE users SET user_groups = JSON_ARRAY('developer')
   WHERE username = 'dev_user';

   -- Project Manager (can release tasks)
   UPDATE users SET user_groups = JSON_ARRAY('project_manager')
   WHERE username = 'pm_user';
   ```

2. **Configure Application Permissions**:
   ```sql
   UPDATE application
   SET
     App_permit_Open = 'project_lead',
     App_permit_toDoList = 'project_manager',
     App_permit_Doing = 'developer',
     App_permit_Done = 'project_lead'
   WHERE App_Acronym = 'DEMO';
   ```

3. **Test with Each User**:
   - Login as each user
   - Verify buttons show/hide based on permissions
   - Verify state transitions fail/succeed appropriately

## 🐛 Troubleshooting

### "Create Task" Button Not Showing
- Check if your user has the group specified in `App_permit_Open`
- Check MySQL: `SELECT user_groups FROM users WHERE username = 'your_username'`

### State Transition Buttons Not Showing
- Each state transition requires specific group membership
- Check application permissions: `SELECT * FROM application WHERE App_Acronym = 'DEMO'`

### Task Not Moving to New State
- Check browser console for error messages
- Verify user is in the required group
- Check backend logs for permission errors

### Tasks Not Loading
- Verify backend is running on port 5000
- Check MySQL connection in `.env` file
- Verify tables were created successfully

## 📊 Database Queries for Testing

### View All Tasks
```sql
SELECT Task_id, Task_name, Task_state, Task_owner, Task_plan
FROM task
WHERE Task_app_Acronym = 'DEMO'
ORDER BY Task_createDate DESC;
```

### View Task Audit Trail
```sql
SELECT Task_id, Task_notes
FROM task
WHERE Task_id = 'DEMO_1';
```

### Check Application Permissions
```sql
SELECT App_permit_Open, App_permit_toDoList, App_permit_Doing, App_permit_Done
FROM application
WHERE App_Acronym = 'DEMO';
```

### View User Groups
```sql
SELECT username, user_groups
FROM users;
```

## 🎯 Next Steps

Now that the Kanban board is complete, you can proceed with:

1. **Assignment 3: REST API Implementation**
   - CreateTask API
   - GetTaskbyState API
   - PromoteTask2Done API

2. **Assignment 4: Docker Containerization**
   - Create Dockerfile
   - Build container image
   - Deploy application

3. **Optional Enhancements**:
   - Email notifications for "Done" state
   - Task filtering and search
   - Application settings page
   - Database connection pooling
   - Drag-and-drop for task cards

## 🔑 Key Implementation Details

### Task ID Generation
- Format: `[App_Acronym]_[App_Rnumber]`
- Auto-incremented per application
- Transaction-safe (uses database transaction)

### Audit Trail Format
```json
[
  {
    "username": "john_doe",
    "state": "Doing",
    "timestamp": "2025-01-22T10:30:00.000Z",
    "note": "Started working on this task"
  },
  ...
]
```

### State Transition Rules
```
Open → ToDo (Only)
ToDo → Doing (Only)
Doing → Done, ToDo (Forward or backtrack)
Done → Closed, Doing (Approve or reject)
Closed → (No transitions)
```

## 🎓 Learning Outcomes

By completing this implementation, you've learned:

1. ✅ Workflow state machines with business rules
2. ✅ Role-based access control (RBAC)
3. ✅ Audit trail implementation
4. ✅ Transaction management
5. ✅ Permission-based UI rendering
6. ✅ RESTful API design
7. ✅ React hooks and state management
8. ✅ Material-UI component library

Congratulations! Your Task Management System is now fully functional! 🎉
