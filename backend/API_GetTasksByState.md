# Get Tasks By State API Documentation

## API Specification

| Name | Method | Parameters | Behaviour | Expected Output Format |
|------|--------|------------|-----------|------------------------|
| **GetTasksByState** | `GET` | JWT token (from cookie) | Mandatory (via authentication) | JSON object: |
| | | `Task_state` (query param) | Mandatory | `{` |
| | | `Task_app_Acronym` (query param) | Optional | `"success": true,` |
| | | | | `"count": 3,` |
| | | | | `"tasks": [` |
| | | | | `{` |
| | | | | `"Task_id": "DEMO_5",` |
| | | | | `"Task_name": "Implement login",` |
| | | | | `"Task_state": "Open",` |
| | | | | `"Task_app_Acronym": "DEMO",` |
| | | | | `...` |
| | | | | `}` |
| | | | | `]` |
| | | | | `}` |

---

## Usage

**URL/Endpoint:** `GET http://localhost:5000/api/GetTaskbyState`

**Authentication:** Requires JWT token stored in HTTP-only cookie

**Authorization:** Any authenticated user can retrieve tasks (no specific permission required)

---

## Example

### 1. JavaScript Example (Using Axios) - Filter by State Only

**Code:**
```javascript
const axios = require('axios');

// Get all tasks in "Open" state from all applications
const getTasksByState = async () => {
  try {
    const response = await axios.get('http://localhost:5000/api/GetTaskbyState', {
      params: {
        Task_state: 'Open'
      },
      withCredentials: true // Include cookies for JWT authentication
    });

    return response.data;
  } catch (error) {
    // Error response will contain error code
    // Example: { code: "TMS_007" }
    console.error('Error code:', error.response?.data?.code);
    throw error;
  }
};

// Call the function
getTasksByState().then(result => {
  console.log(`Found ${result.count} tasks in Open state`);
  console.log('Tasks:', result.tasks);
});
```

**Output:**
```json
{
  "success": true,
  "count": 3,
  "tasks": [
    {
      "Task_id": "DEMO_5",
      "Task_name": "Implement login feature",
      "Task_description": "Create user authentication with JWT tokens",
      "Task_notes": [
        {
          "username": "john_pl",
          "state": "Open",
          "timestamp": "2025-11-10T10:30:00.000Z",
          "note": "Task created"
        }
      ],
      "Task_plan": "Sprint 1",
      "Task_app_Acronym": "DEMO",
      "Task_state": "Open",
      "Task_creator": "john_pl",
      "Task_owner": null,
      "Task_createDate": "2025-11-10T10:30:00.000Z"
    },
    {
      "Task_id": "PROJ_12",
      "Task_name": "Database migration",
      "Task_description": "Migrate to new schema",
      "Task_notes": [...],
      "Task_plan": null,
      "Task_app_Acronym": "PROJ",
      "Task_state": "Open",
      "Task_creator": "jane_pm",
      "Task_owner": null,
      "Task_createDate": "2025-11-09T15:20:00.000Z"
    }
  ]
}
```

---

### 2. JavaScript Example (Using Axios) - Filter by State and Application

**Code:**
```javascript
const axios = require('axios');

// Get all tasks in "Done" state for a specific application
const getTasksByStateAndApp = async () => {
  try {
    const response = await axios.get('http://localhost:5000/api/GetTaskbyState', {
      params: {
        Task_state: 'Done',
        Task_app_Acronym: 'DEMO'
      },
      withCredentials: true
    });

    return response.data;
  } catch (error) {
    console.error('Error:', error.response?.data);
    throw error;
  }
};

// Call the function
getTasksByStateAndApp().then(result => {
  console.log(`Found ${result.count} tasks in Done state for DEMO`);
  console.log('Tasks:', result.tasks);
});
```

**Output:**
```json
{
  "success": true,
  "count": 2,
  "tasks": [
    {
      "Task_id": "DEMO_8",
      "Task_name": "Fix login bug",
      "Task_description": "Resolve authentication timeout issue",
      "Task_notes": [...],
      "Task_plan": "Sprint 1",
      "Task_app_Acronym": "DEMO",
      "Task_state": "Done",
      "Task_creator": "john_pl",
      "Task_owner": "mike_dev",
      "Task_createDate": "2025-11-08T09:15:00.000Z"
    },
    {
      "Task_id": "DEMO_3",
      "Task_name": "Update documentation",
      "Task_description": "Add API documentation",
      "Task_notes": [...],
      "Task_plan": "Sprint 1",
      "Task_app_Acronym": "DEMO",
      "Task_state": "Done",
      "Task_creator": "jane_pm",
      "Task_owner": "sarah_dev",
      "Task_createDate": "2025-11-05T14:30:00.000Z"
    }
  ]
}
```

---

### 3. cURL Example - Filter by State Only

**Code:**
```bash
curl -X GET "http://localhost:5000/api/GetTaskbyState?Task_state=Doing" \
  -b "token=YOUR_JWT_TOKEN_HERE"
```

**Output:**
```json
{
  "success": true,
  "count": 5,
  "tasks": [...]
}
```

---

### 4. cURL Example - Filter by State and Application

**Code:**
```bash
curl -X GET "http://localhost:5000/api/GetTaskbyState?Task_state=ToDo&Task_app_Acronym=DEMO" \
  -b "token=YOUR_JWT_TOKEN_HERE"
```

**Output:**
```json
{
  "success": true,
  "count": 4,
  "tasks": [...]
}
```

---

## Error Codes

All errors return a standardized error code. Use the Error Code Reference below to understand the meaning of each code.

### Error Code Reference

| Error Code | HTTP Status | Meaning |
|------------|-------------|---------|
| `TMS_001` | 400 | Required input field(s) missing. |
| `TMS_002` | 404 | Referenced application does not exist. |
| `TMS_003` | 403 | Authenticated user does not exist or is inactive. |
| `TMS_007` | 400 | Invalid task state filter supplied. |
| `TMS_010` | 500 | Unexpected server-side failure. |

### Error Response Examples

**TMS_001:** Missing Task State
```json
{
  "code": "TMS_001"
}
```

**TMS_007:** Invalid Task State
```json
{
  "code": "TMS_007"
}
```

**TMS_002:** Application Does Not Exist
```json
{
  "code": "TMS_002"
}
```

**TMS_003:** User Does Not Exist or Is Inactive
```json
{
  "code": "TMS_003"
}
```

**TMS_010:** Server Error
```json
{
  "code": "TMS_010"
}
```

---

## Additional Information

### Business Logic

1. **State Filtering:**
   - Retrieves all tasks matching the specified state
   - Valid states: `Open`, `ToDo`, `Doing`, `Done`, `Closed`
   - State names are case-sensitive

2. **Optional Application Filtering:**
   - If `Task_app_Acronym` is provided, results are filtered to that application only
   - If `Task_app_Acronym` is omitted or null, returns tasks from all applications
   - Application acronym must match exactly (case-sensitive)

3. **Task Ordering:**
   - Tasks are returned in descending order by creation date (newest first)
   - Most recently created tasks appear at the beginning of the array

4. **Task Notes Parsing:**
   - Task notes are stored as JSON strings in the database
   - The API automatically parses notes into JavaScript objects/arrays
   - If parsing fails, an empty array is returned for that task's notes

### Use Cases

**1. Dashboard Views:**
- Get all tasks in "Doing" state to show current work
- Get all tasks in "Done" state for review queue

**2. Application-Specific Views:**
- Get all "Open" tasks for a specific application
- Get all "Closed" tasks for project completion reports

**3. Workflow Management:**
- Monitor tasks in each state across all applications
- Track task progression through states

**4. Reporting:**
- Generate reports on task distribution by state
- Analyze task completion rates per application

### Query Parameters Schema

| Field | Type | Required | Valid Values | Description |
|-------|------|----------|--------------|-------------|
| `Task_state` | string | Yes | `Open`, `ToDo`, `Doing`, `Done`, `Closed` | The state of tasks to retrieve |
| `Task_app_Acronym` | string | No | Any existing application acronym or null | Filter by specific application (optional) |

### Response Schema

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Indicates if the request was successful |
| `count` | integer | Number of tasks returned |
| `tasks` | array | Array of task objects matching the filters |

### Task Object Fields

Each task object in the response contains:

| Field | Type | Description |
|-------|------|-------------|
| `Task_id` | string | Unique task identifier (e.g., "DEMO_5") |
| `Task_name` | string | Name of the task |
| `Task_description` | string | Detailed description (may be null) |
| `Task_notes` | array | Audit trail of all notes (parsed JSON) |
| `Task_plan` | string | Associated plan/MVP name (may be null) |
| `Task_app_Acronym` | string | Application the task belongs to |
| `Task_state` | string | Current state of the task |
| `Task_creator` | string | Username who created the task |
| `Task_owner` | string | Username who owns the task (null if unassigned) |
| `Task_createDate` | datetime | When the task was created |

### Performance Considerations

- The query uses an indexed `Task_state` field for efficient filtering
- JOIN with application table ensures only valid tasks from existing applications are returned
- Results ordered by creation date (indexed field)
- Empty result set (count: 0) is valid when no tasks match the criteria

### Security Notes

- Requires authentication but no specific authorization
- All authenticated users can view tasks in any state
- Does not expose sensitive system information or application permissions
- User must exist and be active to access this endpoint

### Error Code System

- All errors return only a `code` field
- HTTP status codes are preserved and align with error codes
- Clients should implement error code lookup for user-friendly messages
- Error codes are consistent across all TMS APIs
