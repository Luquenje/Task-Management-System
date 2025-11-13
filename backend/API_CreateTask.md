# Create Task API Documentation

## API Specification

| Name | Method | Parameters | Behaviour | Expected Output Format |
|------|--------|------------|-----------|------------------------|
| **CreateTask** | `POST` | JWT token (from cookie) | Mandatory (via authentication) | JSON object: |
| | | `Task_app_Acronym` | Mandatory | `{` |
| | | `Task_name` | Mandatory | `"success": true,` |
| | | `Task_description` | Optional | `"message": "Task created successfully",` |
| | | `Task_plan` | Optional | `"task": {` |
| | | | | `"Task_id": "DEMO_5",` |
| | | | | `"Task_name": "Implement login feature",` |
| | | | | `"Task_state": "Open"` |
| | | | | `}` |
| | | | | `}` |

---

## Usage

**URL/Endpoint:** `POST http://localhost:5000/api/CreateTask`

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
    const response = await axios.post('http://localhost:5000/api/CreateTask', {
      Task_app_Acronym: 'DEMO',
      Task_name: 'Implement login feature',
      Task_description: 'Create user authentication with JWT tokens',
      Task_plan: 'Sprint 1'
    }, {
      withCredentials: true // Include cookies for JWT authentication
    });

    return response.data;
  } catch (error) {
    // Error response will contain error code
    // Example: { code: "TMS_001" }
    console.error('Error code:', error.response?.data?.code);
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
curl -X POST http://localhost:5000/api/CreateTask \
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

All errors return a standardized error code. Use the Error Code Reference below to understand the meaning of each code.

### Error Code Reference

| Error Code | HTTP Status | Meaning |
|------------|-------------|---------|
| `TMS_001` | 400 | Required input field(s) missing. |
| `TMS_002` | 404 | Referenced application does not exist. |
| `TMS_003` | 403 | Authenticated user does not exist or is inactive. |
| `TMS_004` | 403 | Authenticated user lacks the necessary application permission. |
| `TMS_005` | 409 | A task ID collision occurred during creation (retry-safe). |
| `TMS_006` | 500 | The system could not generate a unique task ID. |
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

**TMS_005:** Task ID Collision (Retry-Safe)
```json
{
  "code": "TMS_005"
}
```

**TMS_006:** Could Not Generate Unique Task ID
```json
{
  "code": "TMS_006"
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

<!-- ### Business Logic

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
   - Rollback occurs on any error -->

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

### Error Code System

- All errors return only a `code` field
- HTTP status codes are preserved and align with error codes
- Clients should implement error code lookup for user-friendly messages
- Error codes are consistent across all TMS APIs
- **TMS_005** indicates a retry-safe collision - the client can retry the same request
- **TMS_006** indicates a critical failure in ID generation - requires investigation
