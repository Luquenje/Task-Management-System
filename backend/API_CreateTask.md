# Create Task API Documentation

## API Specification

| Name | Method | Parameters | Behaviour | Expected Output Format |
|------|--------|------------|-----------|------------------------|
| **CreateTask** | `POST` | `username` (from JWT token) | Mandatory (via authentication) | JSON object: |
| | | `password` (from JWT token) | Mandatory (via authentication) | `{` |
| | | `Task_app_Acronym` | Mandatory | `"success": true,` |
| | | `Task_name` | Mandatory | `"message": "Task created successfully",` |
| | | `Task_description` | Optional | `"task": {` |
| | | `Task_plan` | Optional | `"Task_id": "DEMO_5",` |
| | | | | `"Task_name": "Implement login feature",` |
| | | | | `"Task_state": "Open"` |
| | | | | `}` |
| | | | | `}` |

---

## Usage

**URL/Endpoint:** `POST http://localhost:5000/api/tasks`

**Authentication:** Requires JWT token stored in HTTP-only cookie

**Authorization:** User must be in a group specified in the application's `App_permit_Create` permission field

---

## Example

### 1. JavaScript Example (Using Axios)

**Code:**
```javascript
const axios = require('axios');

// Create task
const createTask = async () => {
  try {
    const response = await axios.post('http://localhost:5000/api/tasks', {
      Task_app_Acronym: 'DEMO',
      Task_name: 'Implement login feature',
      Task_description: 'Create user authentication with JWT tokens',
      Task_plan: 'Sprint 1'
    }, {
      withCredentials: true // Include cookies for JWT authentication
    });

    return response.data;
  } catch (error) {
    console.error('Error:', error.response?.data);
    throw error;
  }
};

// Call the function
createTask().then(result => {
  console.log('Task created successfully:', result);
});
```

**Output:**
```json
{
  "success": true,
  "message": "Task created successfully",
  "task": {
    "Task_id": "DEMO_5",
    "Task_name": "Implement login feature",
    "Task_state": "Open"
  }
}
```

---

### 2. cURL Example

**Code:**
```bash
curl -X POST http://localhost:5000/api/tasks \
  -H "Content-Type: application/json" \
  -b "token=YOUR_JWT_TOKEN_HERE" \
  -d '{
    "Task_app_Acronym": "DEMO",
    "Task_name": "Implement login feature",
    "Task_description": "Create user authentication with JWT tokens",
    "Task_plan": "Sprint 1"
  }'
```

**Output:**
```json
{
  "success": true,
  "message": "Task created successfully",
  "task": {
    "Task_id": "DEMO_5",
    "Task_name": "Implement login feature",
    "Task_state": "Open"
  }
}
```

---

## Error Codes

### HTTP 400 - Bad Request

**Error:** Missing Application Acronym
```json
{
  "success": false,
  "error": "Application acronym is required"
}
```

**Error:** Missing Task Name
```json
{
  "success": false,
  "error": "Task name is required"
}
```

---

### HTTP 401 - Unauthorized

**Error:** Not authenticated or JWT token invalid/expired
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

---

### HTTP 403 - Forbidden

**Error:** No permission group configured for application
```json
{
  "success": false,
  "error": "No group is permitted to create tasks for this application"
}
```

**Error:** User not in required group
```json
{
  "success": false,
  "error": "You must be in the 'pl' group to create tasks"
}
```
*Note: The group name in the error message will match the required group from `App_permit_Create`*

---

### HTTP 404 - Not Found

**Error:** Application does not exist
```json
{
  "success": false,
  "error": "Application not found"
}
```

---

### HTTP 500 - Internal Server Error

**Error:** Database connection or query error
```json
{
  "success": false,
  "error": "Database error"
}
```

**Error:** Transaction commit failed
```json
{
  "success": false,
  "error": "Failed to create task"
}
```

**Error:** Failed to update running number
```json
{
  "success": false,
  "error": "Failed to update running number"
}
```

**Error:** Failed to commit transaction
```json
{
  "success": false,
  "error": "Failed to commit transaction"
}
```

---

## Additional Information

### Business Logic

1. **Task ID Generation:**
   - Format: `{App_Acronym}_{App_Rnumber + 1}`
   - Example: If application "DEMO" has `App_Rnumber = 4`, next task ID will be `DEMO_5`
   - Running number is incremented atomically within a database transaction

2. **Initial Task State:**
   - All newly created tasks start in "Open" state
   - `Task_owner` is set to NULL (assigned when task moves to "Doing")
   - `Task_creator` is set to the authenticated username
   - `Task_createDate` is automatically set to current timestamp

3. **Audit Trail:**
   - An initial note is automatically created:
     - Username: The user who created the task
     - State: "Open"
     - Timestamp: Current ISO timestamp
     - Note: "Task created"

4. **Transaction Safety:**
   - Task creation uses database transaction for atomicity
   - Both task insertion and running number update are committed together
   - Rollback occurs on any error

### Permission System

- Permission controlled by `App_permit_Create` field in application table
- Contains comma-separated list of user group names
- Users must belong to at least one group to create tasks

**Example:**
- Application has `App_permit_Create = "pl,pm"`
- User with groups `["pl", "admin"]` → ✅ Allowed
- User with groups `["dev"]` → ❌ Forbidden

### Request Body Schema

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `Task_app_Acronym` | string | Yes | Must exist in database | Application acronym to create task in |
| `Task_name` | string | Yes | Non-empty string | Name of the task |
| `Task_description` | string | No | Can be null or empty | Detailed description of the task |
| `Task_plan` | string | No | Must exist in database or be null | Plan (MVP) to assign task to |

### Database Fields Set

| Field | Value | Source |
|-------|-------|--------|
| `Task_id` | Generated | `{App_Acronym}_{App_Rnumber + 1}` |
| `Task_name` | User input | Request body |
| `Task_description` | User input | Request body (or NULL) |
| `Task_notes` | Auto-generated | JSON array with initial note |
| `Task_plan` | User input | Request body (or NULL) |
| `Task_app_Acronym` | User input | Request body |
| `Task_state` | Fixed | Always "Open" |
| `Task_creator` | Auth context | JWT username |
| `Task_owner` | Fixed | Always NULL |
| `Task_createDate` | Auto-generated | Current timestamp (NOW()) |
