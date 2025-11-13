# Promote Task to Done API Documentation

## API Specification

| Name | Method | Parameters | Behaviour | Expected Output Format |
|------|--------|------------|-----------|------------------------|
| **PromoteTask2Done** | `POST` | JWT token (from cookie) | Mandatory (via authentication) | JSON object: |
| | | `Task_id` | Mandatory | `{` |
| | | `Task_notes` | Optional | `"success": true,` |
| | | | | `"message": "Task promoted to Done successfully",` |
| | | | | `"task": {` |
| | | | | `"Task_id": "DEMO_5",` |
| | | | | `"Task_state": "Done"` |
| | | | | `}` |
| | | | | `}` |

---

## Usage

**URL/Endpoint:** `POST http://localhost:5000/api/tasks/PromoteTask2Done`

**Authentication:** Requires JWT token stored in HTTP-only cookie

**Authorization:** User must be in a group specified in the application's `App_permit_Doing` permission field

---

## Example

### 1. JavaScript Example (Using Axios)

**Code:**
```javascript
const axios = require('axios');

// Promote task from Doing to Done
const promoteTaskToDone = async () => {
  try {
    const response = await axios.post('http://localhost:5000/api/tasks/PromoteTask2Done', {
      Task_id: 'DEMO_5',
      Task_notes: 'Completed implementation and testing. Ready for review.'
    }, {
      withCredentials: true // Include cookies for JWT authentication
    });

    return response.data;
  } catch (error) {
    // Error response will contain error code
    // Example: { code: "TMS_009" }
    console.error('Error code:', error.response?.data?.code);
    throw error;
  }
};

// Call the function
promoteTaskToDone().then(result => {
  console.log('Task promoted successfully:', result);
});
```

**Output:**
```json
{
  "success": true,
  "message": "Task promoted to Done successfully",
  "task": {
    "Task_id": "DEMO_5",
    "Task_state": "Done"
  }
}
```

---

### 2. JavaScript Example - Without Note

**Code:**
```javascript
const axios = require('axios');

// Promote task without custom note (default note will be added)
const promoteTaskToDone = async () => {
  try {
    const response = await axios.post('http://localhost:5000/api/tasks/PromoteTask2Done', {
      Task_id: 'DEMO_8'
    }, {
      withCredentials: true
    });

    return response.data;
  } catch (error) {
    console.error('Error code:', error.response?.data?.code);
    throw error;
  }
};

// Call the function
promoteTaskToDone().then(result => {
  console.log('Task promoted successfully:', result);
});
```

**Output:**
```json
{
  "success": true,
  "message": "Task promoted to Done successfully",
  "task": {
    "Task_id": "DEMO_8",
    "Task_state": "Done"
  }
}
```

---

### 3. cURL Example

**Code:**
```bash
curl -X POST http://localhost:5000/api/tasks/PromoteTask2Done \
  -H "Content-Type: application/json" \
  -b "token=YOUR_JWT_TOKEN_HERE" \
  -d '{
    "Task_id": "DEMO_5",
    "Task_notes": "Completed implementation and testing. Ready for review."
  }'
```

**Output:**
```json
{
  "success": true,
  "message": "Task promoted to Done successfully",
  "task": {
    "Task_id": "DEMO_5",
    "Task_state": "Done"
  }
}
```

---

### 4. cURL Example - Without Note

**Code:**
```bash
curl -X POST http://localhost:5000/api/tasks/PromoteTask2Done \
  -H "Content-Type: application/json" \
  -b "token=YOUR_JWT_TOKEN_HERE" \
  -d '{
    "Task_id": "DEMO_8"
  }'
```

**Output:**
```json
{
  "success": true,
  "message": "Task promoted to Done successfully",
  "task": {
    "Task_id": "DEMO_8",
    "Task_state": "Done"
  }
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
| `TMS_004` | 403 | Authenticated user lacks the necessary application permission. |
| `TMS_008` | 404 | Requested task was not found. |
| `TMS_009` | 400 | Task is not in the correct state for the requested transition. |
| `TMS_010` | 500 | Unexpected server-side failure. |

### Error Response Examples

**TMS_001:** Missing Required Fields
```json
{
  "code": "TMS_001"
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

**TMS_004:** User Lacks Permission
```json
{
  "code": "TMS_004"
}
```

**TMS_008:** Task Not Found
```json
{
  "code": "TMS_008"
}
```

**TMS_009:** Task Not In Doing State
```json
{
  "code": "TMS_009"
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

1. **State Transition:**
   - Only tasks in "Doing" state can be promoted to "Done"
   - Task state is updated from "Doing" to "Done"
   - No other fields are modified (Task_owner remains unchanged)

2. **Audit Trail:**
   - A new note is automatically added to the task's notes array
   - Note includes:
     - Username: The user who promoted the task
     - State: "Done"
     - Timestamp: Current ISO timestamp
     - Note: User-provided note or default "Task promoted to Done"

3. **Email Notification:**
   - All active users in the "pl" group receive an email notification
   - Email includes task details and the completion note
   - Email failures do not prevent successful task promotion

4. **Permission Requirements:**
   - User must be in a group specified in `App_permit_Doing`
   - This ensures only developers/team members working on tasks can promote them
   - Project leads (PL) will then review and approve/reject from Done state

### Permission System

- Permission controlled by `App_permit_Doing` field in application table
- Contains comma-separated list of user group names
- Users must belong to at least one group to promote tasks to Done

**Example:**
- Application has `App_permit_Doing = "dev"`
- User with groups `["dev", "admin"]` → ✅ Allowed
- User with groups `["pl", "pm"]` → ❌ Forbidden

### Workflow Context

This API is part of the Kanban workflow:
1. **Open** → ToDo (requires App_permit_Open - typically PM)
2. **ToDo** → Doing (requires App_permit_ToDo - typically Dev)
3. **Doing** → **Done** ← **THIS API** (requires App_permit_Doing - typically Dev)
4. **Done** → Closed (requires App_permit_Done - typically PL)
5. **Done** → Doing (requires App_permit_Done - typically PL, rejection)

### Request Body Schema

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `Task_id` | string | Yes | Must exist in database | Unique task identifier (e.g., "DEMO_5") |
| `Task_notes` | string | No | Can be null or empty | Note to add to audit trail when promoting |

### Response Schema

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Indicates if the request was successful |
| `message` | string | Human-readable success message |
| `task` | object | Task information after promotion |
| `task.Task_id` | string | The task ID that was promoted |
| `task.Task_state` | string | New state (always "Done") |

### Task State Requirements

**Valid States for Promotion:**
- ✅ **Doing** - Can be promoted to Done

**Invalid States:**
- ❌ **Open** - Cannot promote (error TMS_009)
- ❌ **ToDo** - Cannot promote (error TMS_009)
- ❌ **Done** - Already in Done state (error TMS_009)
- ❌ **Closed** - Cannot promote (error TMS_009)

### Email Notification Details

When a task is successfully promoted to Done:
- All active users with "pl" group membership receive an email
- Email subject: "Task {Task_id} Completed - Ready for Review"
- Email contains:
  - Task ID and Name
  - Application Acronym
  - Task Owner
  - Completion note from the user
  - Who completed the task (username)
- Email sending is asynchronous and non-blocking
- Email failures are logged but do not affect API response

### Error Code System

- All errors return only a `code` field
- HTTP status codes are preserved and align with error codes
- Clients should implement error code lookup for user-friendly messages
- Error codes are consistent across all TMS APIs
- **TMS_009** indicates the task is not in "Doing" state and cannot be promoted to "Done"

### Security Notes

- Requires authentication via JWT token in HTTP-only cookie
- User must exist and be active in the system
- User must have permission through `App_permit_Doing` group membership
- Task ID is validated to prevent unauthorized access
- Application existence is verified through database JOIN
- Does not expose sensitive system information in errors

### Performance Considerations

- Single database query to fetch task and application data (optimized JOIN)
- Permission check uses existing `checkUserInGroup` helper function
- JSON parsing/stringifying for notes is efficient for typical use cases
- Email notifications are sent asynchronously after successful response
- Transaction-safe update ensures data integrity
- Task state validation prevents invalid transitions

### Use Cases

**1. Developer Completes Task:**
- Developer finishes working on a task in "Doing" state
- Calls this API with task ID and completion notes
- Task moves to "Done" for PL review

**2. Automated Workflow:**
- CI/CD pipeline calls this API when automated tests pass
- Task is automatically promoted to Done for human review

**3. Team Collaboration:**
- Developer adds detailed notes about implementation
- PL receives email notification with context for review
- PL can then approve (Done → Closed) or reject (Done → Doing)
