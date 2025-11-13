# API Test Data Documentation

This document provides comprehensive test data for the three Task Management System APIs, covering valid data, extreme data (boundary cases), and invalid (erroneous) data.

---

## 1. CreateTask API - `POST /api/CreateTask`

### Valid Data Test Cases

#### TC1.1: Minimal Valid Data
**Description:** Create task with only required fields
```json
{
  "Task_app_Acronym": "DEMO",
  "Task_name": "Fix login bug"
}
```
**Expected Result:** ✅ Success (201) - Task created with Task_id like "DEMO_1"

#### TC1.2: Complete Valid Data
**Description:** Create task with all fields populated
```json
{
  "Task_app_Acronym": "DEMO",
  "Task_name": "Implement user authentication",
  "Task_description": "Create JWT-based authentication system with HTTP-only cookies for secure session management",
  "Task_plan": "Sprint 1"
}
```
**Expected Result:** ✅ Success (201) - Task created with all fields

#### TC1.3: Valid Data with Empty Optional Fields
**Description:** Create task with explicit empty strings for optional fields
```json
{
  "Task_app_Acronym": "PROJ",
  "Task_name": "Database migration",
  "Task_description": "",
  "Task_plan": ""
}
```
**Expected Result:** ✅ Success (201) - Task created, empty strings stored as NULL

#### TC1.4: Valid Data with Null Optional Fields
**Description:** Create task with explicit null values
```json
{
  "Task_app_Acronym": "PROJ",
  "Task_name": "Update documentation",
  "Task_description": null,
  "Task_plan": null
}
```
<!-- **Expected Result:** ✅ Success (201) - Task created with NULL values

#### TC1.5: Valid Data with Special Characters
**Description:** Task name and description with special characters
```json
{
  "Task_app_Acronym": "TEST",
  "Task_name": "Fix bug #42: API returns 500 (internal error)",
  "Task_description": "Issue with special chars: @#$%^&*()_+-=[]{}|;':\",./<>?",
  "Task_plan": "Q1-2025"
}
```
**Expected Result:** ✅ Success (201) - Special characters properly stored

#### TC1.6: Valid Data with Unicode Characters
**Description:** Task with international characters
```json
{
  "Task_app_Acronym": "INTL",
  "Task_name": "Localización: Agregar soporte para español",
  "Task_description": "支持中文、日本語、한국어、العربية",
  "Task_plan": "Internationalization"
}
```
**Expected Result:** ✅ Success (201) - Unicode properly stored -->

---

### Extreme Data Test Cases

#### TC1.7: Maximum Length Task Name
**Description:** Task name at or near maximum VARCHAR length (typically 255 characters)
```json
{
  "Task_app_Acronym": "TEST",
  "Task_name": "A very long task name that contains exactly two hundred and fifty five characters to test the boundary limit of the database field which is typically set to VARCHAR two hundred and fifty five in MySQL and this should be accepted without any truncat",
  "Task_description": "Testing max length"
}
```
**Expected Result:** ✅ Success (201) - Task created with full name (if DB allows 255 chars)

#### TC1.8: Maximum Length Description
**Description:** Task description with several thousand characters (assuming TEXT field)
```json
{
  "Task_app_Acronym": "TEST",
  "Task_name": "Test max description",
  "Task_description": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. [... repeat 1000+ times to create ~65,000 character TEXT ...]"
}
```
**Expected Result:** ✅ Success (201) - Very long description stored (up to TEXT limit)

#### TC1.9: Single Character Values
**Description:** Minimum valid length for text fields
```json
{
  "Task_app_Acronym": "A",
  "Task_name": "X",
  "Task_description": "Y",
  "Task_plan": "Z"
}
```
**Expected Result:** ✅ Success (201) - Single character values accepted

#### TC1.10: Application at Maximum Running Number
**Description:** Create task when App_Rnumber is at maximum INT value boundary
```json
{
  "Task_app_Acronym": "MAXTEST",
  "Task_name": "Test max running number"
}
```
**Setup:** Set MAXTEST App_Rnumber to 2147483646 (INT MAX - 1)
**Expected Result:** ✅ Success (201) - Task created with ID "MAXTEST_2147483647"

#### TC1.11: First Task in Application
**Description:** Create first task (App_Rnumber = 0)
```json
{
  "Task_app_Acronym": "NEWAPP",
  "Task_name": "First ever task"
}
```
**Setup:** Application exists with App_Rnumber = 0
**Expected Result:** ✅ Success (201) - Task created with ID "NEWAPP_1"

#### TC1.12: Whitespace Boundaries
**Description:** Task name with leading/trailing spaces
```json
{
  "Task_app_Acronym": "TEST",
  "Task_name": "  Task with spaces  ",
  "Task_description": "\nDescription with newlines\n\n"
}
```
**Expected Result:** ✅ Success (201) - Spaces preserved as entered

---

### Invalid (Erroneous) Data Test Cases

#### TC1.13: Missing Task_app_Acronym
**Description:** Omit required field Task_app_Acronym
```json
{
  "Task_name": "Missing acronym task"
}
```
**Expected Result:** ❌ Error (400) - Code: TMS_001

#### TC1.14: Missing Task_name
**Description:** Omit required field Task_name
```json
{
  "Task_app_Acronym": "DEMO"
}
```
**Expected Result:** ❌ Error (400) - Code: TMS_001

#### TC1.15: Missing Both Required Fields
**Description:** Omit all required fields
```json
{
  "Task_description": "Description only"
}
```
**Expected Result:** ❌ Error (400) - Code: TMS_001

#### TC1.16: Empty String for Task_name
**Description:** Task_name is empty string (should be rejected)
```json
{
  "Task_app_Acronym": "DEMO",
  "Task_name": ""
}
```
**Expected Result:** ❌ Error (400) - Code: TMS_001 (empty string treated as missing)

#### TC1.17: Null for Required Field
**Description:** Task_name is null
```json
{
  "Task_app_Acronym": "DEMO",
  "Task_name": null
}
```
**Expected Result:** ❌ Error (400) - Code: TMS_001

#### TC1.18: Non-Existent Application
**Description:** Task_app_Acronym references application that doesn't exist
```json
{
  "Task_app_Acronym": "NONEXISTENT999",
  "Task_name": "Test task"
}
```
**Expected Result:** ❌ Error (404) - Code: TMS_002

#### TC1.19: Non-Existent Plan
**Description:** Task_plan references plan that doesn't exist
```json
{
  "Task_app_Acronym": "DEMO",
  "Task_name": "Task with invalid plan",
  "Task_plan": "NonExistentPlan123"
}
```
**Expected Result:** Depends on implementation - May succeed (no FK constraint) or fail

#### TC1.20: Inactive User
**Description:** User exists but is inactive (Is_active = 0)
```json
{
  "Task_app_Acronym": "DEMO",
  "Task_name": "Task by inactive user"
}
```
**Setup:** Set JWT user to inactive account
**Expected Result:** ❌ Error (403) - Code: TMS_003

#### TC1.21: User Not in Required Group
**Description:** User doesn't have App_permit_Create permission
```json
{
  "Task_app_Acronym": "RESTRICTED",
  "Task_name": "Unauthorized task creation"
}
```
**Setup:** User not in group specified by RESTRICTED.App_permit_Create
**Expected Result:** ❌ Error (403) - Code: TMS_004

#### TC1.22: No Permission Group Configured
**Description:** Application has no App_permit_Create group set
```json
{
  "Task_app_Acronym": "NOPERM",
  "Task_name": "Task in app without permissions"
}
```
**Setup:** NOPERM.App_permit_Create is NULL or empty
**Expected Result:** ❌ Error (403) - Code: TMS_004

#### TC1.23: Wrong Data Type for Task_name
**Description:** Task_name is number instead of string
```json
{
  "Task_app_Acronym": "DEMO",
  "Task_name": 12345
}
```
**Expected Result:** ⚠️ May succeed (converted to string "12345") or fail depending on validation

#### TC1.24: Array Instead of String
**Description:** Task_name is an array
```json
{
  "Task_app_Acronym": "DEMO",
  "Task_name": ["Task", "Name"]
}
```
**Expected Result:** ❌ Error - Type mismatch or converted to string "[object Object]"

#### TC1.25: Exceeds Maximum Length
**Description:** Task_name exceeds VARCHAR(255) limit
```json
{
  "Task_app_Acronym": "TEST",
  "Task_name": "A".repeat(300)
}
```
**Expected Result:** ❌ Error (500) or truncated - Database constraint violation

<!-- #### TC1.26: SQL Injection Attempt
**Description:** Malicious SQL in input
```json
{
  "Task_app_Acronym": "DEMO",
  "Task_name": "'; DROP TABLE task; --",
  "Task_description": "1' OR '1'='1"
}
```
**Expected Result:** ✅ Success (201) - SQL properly escaped/parameterized, stored as literal string -->

#### TC1.27: No Authentication Token
**Description:** Request without JWT token
```bash
curl -X POST http://localhost:5000/api/CreateTask \
  -H "Content-Type: application/json" \
  -d '{"Task_app_Acronym": "DEMO", "Task_name": "Test"}'
```
**Expected Result:** ❌ Error (401) - Unauthorized

#### TC1.28: Invalid JWT Token
**Description:** Request with expired or tampered token
```bash
curl -X POST http://localhost:5000/api/CreateTask \
  -H "Content-Type: application/json" \
  -b "token=invalid.jwt.token" \
  -d '{"Task_app_Acronym": "DEMO", "Task_name": "Test"}'
```
**Expected Result:** ❌ Error (401) - Unauthorized

---

## 2. GetTasksByState API - `GET /api/GetTaskbyState`

### Valid Data Test Cases

#### TC2.1: Filter by State Only - Open
**Description:** Get all Open tasks from all applications
```
GET /api/GetTaskbyState?Task_state=Open
```
**Expected Result:** ✅ Success (200) - Returns all tasks in "Open" state

#### TC2.2: Filter by State Only - ToDo
**Description:** Get all ToDo tasks
```
GET /api/GetTaskbyState?Task_state=ToDo
```
**Expected Result:** ✅ Success (200) - Returns all tasks in "ToDo" state

#### TC2.3: Filter by State Only - Doing
**Description:** Get all Doing tasks
```
GET /api/GetTaskbyState?Task_state=Doing
```
**Expected Result:** ✅ Success (200) - Returns all tasks in "Doing" state

#### TC2.4: Filter by State Only - Done
**Description:** Get all Done tasks
```
GET /api/GetTaskbyState?Task_state=Done
```
**Expected Result:** ✅ Success (200) - Returns all tasks in "Done" state

#### TC2.5: Filter by State Only - Closed
**Description:** Get all Closed tasks
```
GET /api/GetTaskbyState?Task_state=Closed
```
**Expected Result:** ✅ Success (200) - Returns all tasks in "Closed" state

#### TC2.6: Filter by State and Application
**Description:** Get all Open tasks for specific application
```
GET /api/GetTaskbyState?Task_state=Open&Task_app_Acronym=DEMO
```
**Expected Result:** ✅ Success (200) - Returns Open tasks only from DEMO application

<!-- #### TC2.7: Valid Application with No Tasks
**Description:** Filter by application that exists but has no tasks in that state
```
GET /api/GetTaskbyState?Task_state=Done&Task_app_Acronym=EMPTY
```
**Setup:** EMPTY application exists but has no Done tasks
**Expected Result:** ✅ Success (200) - Returns count: 0, tasks: [] -->

#### TC2.8: State with No Tasks
**Description:** Get tasks in state with zero results
```
GET /api/GetTaskbyState?Task_state=Closed
```
**Setup:** No tasks in Closed state exist
**Expected Result:** ✅ Success (200) - Returns count: 0, tasks: []

---
<!--
### Extreme Data Test Cases

#### TC2.9: Application with Maximum Tasks
**Description:** Get tasks for application with thousands of tasks
```
GET /api/GetTaskbyState?Task_state=Open&Task_app_Acronym=HUGEAPP
```
**Setup:** HUGEAPP has 10,000+ tasks in Open state
**Expected Result:** ✅ Success (200) - Returns all tasks (performance may vary)

#### TC2.10: Single Character Application Name
**Description:** Filter by application with minimal name
```
GET /api/GetTaskbyState?Task_state=Open&Task_app_Acronym=A
```
**Expected Result:** ✅ Success (200) - Returns tasks for application "A"

#### TC2.11: Very Long Application Name
**Description:** Application name at maximum length boundary
```
GET /api/GetTaskbyState?Task_state=Open&Task_app_Acronym=VERYLONGAPPLICATIONNAME123456789
```
**Expected Result:** ✅ Success (200) or TMS_002 if not found

--- -->

### Invalid (Erroneous) Data Test Cases

#### TC2.12: Missing Task_state Parameter
**Description:** Omit required query parameter
```
GET /api/GetTaskbyState
```
**Expected Result:** ❌ Error (400) - Code: TMS_001

#### TC2.13: Empty Task_state Parameter
**Description:** Task_state is empty string
```
GET /api/GetTaskbyState?Task_state=
```
**Expected Result:** ❌ Error (400) - Code: TMS_001

#### TC2.14: Invalid Task State - Wrong Case
**Description:** Task_state with incorrect capitalization
```
GET /api/GetTaskbyState?Task_state=open
```
**Expected Result:** ❌ Error (400) - Code: TMS_007

#### TC2.15: Invalid Task State - Misspelled
**Description:** Task_state is not a valid state value
```
GET /api/GetTaskbyState?Task_state=InProgress
```
**Expected Result:** ❌ Error (400) - Code: TMS_007

#### TC2.16: Invalid Task State - Numeric
**Description:** Task_state is a number
```
GET /api/GetTaskbyState?Task_state=1
```
**Expected Result:** ❌ Error (400) - Code: TMS_007

#### TC2.17: Invalid Task State - Special Characters
**Description:** Task_state contains invalid characters
```
GET /api/GetTaskbyState?Task_state=Open%20State
```
**Expected Result:** ❌ Error (400) - Code: TMS_007

#### TC2.18: Non-Existent Application
**Description:** Task_app_Acronym references application that doesn't exist
```
GET /api/GetTaskbyState?Task_state=Open&Task_app_Acronym=DOESNOTEXIST
```
**Expected Result:** ❌ Error (404) - Code: TMS_002

#### TC2.19: Inactive User
**Description:** Authenticated user is inactive
```
GET /api/GetTaskbyState?Task_state=Open
```
**Setup:** JWT user account has Is_active = 0
**Expected Result:** ❌ Error (403) - Code: TMS_003

#### TC2.20: No Authentication
**Description:** Request without JWT token
```bash
curl -X GET "http://localhost:5000/api/GetTaskbyState?Task_state=Open"
```
**Expected Result:** ❌ Error (401) - Unauthorized

#### TC2.21: Invalid JWT Token
**Description:** Request with corrupted token
```bash
curl -X GET "http://localhost:5000/api/GetTaskbyState?Task_state=Open" \
  -b "token=corrupted.token.here"
```
**Expected Result:** ❌ Error (401) - Unauthorized

<!-- #### TC2.22: SQL Injection in State
**Description:** Attempt SQL injection via Task_state
```
GET /api/GetTaskbyState?Task_state=Open' OR '1'='1
```
**Expected Result:** ❌ Error (400) - Code: TMS_007 (not in allowed list)

#### TC2.23: SQL Injection in Application
**Description:** Attempt SQL injection via Task_app_Acronym
```
GET /api/GetTaskbyState?Task_state=Open&Task_app_Acronym=DEMO' OR '1'='1
```
**Expected Result:** ❌ Error (404) - Code: TMS_002 (application doesn't exist) -->

#### TC2.24: Extra Invalid Parameters
**Description:** Include unexpected query parameters
```
GET /api/GetTaskbyState?Task_state=Open&invalid_param=hack&Task_owner=admin
```
**Expected Result:** ✅ Success (200) - Extra params ignored, valid filtering applied

---

## 3. PromoteTask2Done API - `POST /api/tasks/PromoteTask2Done`

### Valid Data Test Cases

#### TC3.1: Promote with Note
**Description:** Promote task from Doing to Done with completion note
```json
{
  "Task_id": "DEMO_5",
  "Task_notes": "Completed implementation and testing. All unit tests passing. Ready for PL review."
}
```
**Setup:** DEMO_5 is in "Doing" state, user has App_permit_Doing permission
**Expected Result:** ✅ Success (200) - Task promoted to Done, note added, email sent

#### TC3.2: Promote without Note
**Description:** Promote task without providing custom note
```json
{
  "Task_id": "DEMO_8"
}
```
**Setup:** DEMO_8 is in "Doing" state, user has permission
**Expected Result:** ✅ Success (200) - Task promoted with default note "Task promoted to Done"

#### TC3.3: Promote with Empty Note
**Description:** Explicit empty string for Task_notes
```json
{
  "Task_id": "DEMO_12",
  "Task_notes": ""
}
```
**Setup:** DEMO_12 is in "Doing" state
**Expected Result:** ✅ Success (200) - Default note used

#### TC3.4: Promote with Null Note
**Description:** Explicit null for Task_notes
```json
{
  "Task_id": "DEMO_15",
  "Task_notes": null
}
```
**Setup:** DEMO_15 is in "Doing" state
**Expected Result:** ✅ Success (200) - Default note used

#### TC3.5: Promote with Special Characters in Note
**Description:** Note containing special characters
```json
{
  "Task_id": "DEMO_20",
  "Task_notes": "Fixed bug #42: API returns 500 error when input contains @#$%^&*()"
}
```
**Setup:** DEMO_20 is in "Doing" state
**Expected Result:** ✅ Success (200) - Special characters preserved in note

#### TC3.6: Promote with Unicode in Note
**Description:** Note with international characters
```json
{
  "Task_id": "INTL_3",
  "Task_notes": "Tarea completada. 完成任务。タスク完了。"
}
```
**Setup:** INTL_3 is in "Doing" state
**Expected Result:** ✅ Success (200) - Unicode preserved

#### TC3.7: Promote Task with Complex Task_id
**Description:** Task_id with special format
```json
{
  "Task_id": "APP_WITH_UNDERSCORES_999",
  "Task_notes": "Completed successfully"
}
```
**Setup:** Task exists in "Doing" state
**Expected Result:** ✅ Success (200) - Task promoted

---

### Extreme Data Test Cases

#### TC3.8: Maximum Length Note
**Description:** Task_notes with several thousand characters
```json
{
  "Task_id": "DEMO_5",
  "Task_notes": "Lorem ipsum dolor sit amet... [repeat 5000+ characters]"
}
```
**Setup:** DEMO_5 is in "Doing" state
**Expected Result:** ✅ Success (200) - Very long note stored (up to TEXT limit)

#### TC3.9: Minimum Length Task_id
**Description:** Task_id with minimal format
```json
{
  "Task_id": "A_1",
  "Task_notes": "Done"
}
```
**Setup:** A_1 exists in "Doing" state
**Expected Result:** ✅ Success (200) - Task promoted

#### TC3.10: Maximum Running Number
**Description:** Task with very high running number
```json
{
  "Task_id": "TEST_2147483647",
  "Task_notes": "Max running number test"
}
```
**Setup:** Task exists in "Doing" state
**Expected Result:** ✅ Success (200) - Task promoted

#### TC3.11: Single Character Note
**Description:** Minimal valid note
```json
{
  "Task_id": "DEMO_5",
  "Task_notes": "X"
}
```
**Setup:** DEMO_5 is in "Doing" state
**Expected Result:** ✅ Success (200) - Single character note accepted

#### TC3.12: Note with Only Whitespace
**Description:** Task_notes contains only spaces/newlines
```json
{
  "Task_id": "DEMO_5",
  "Task_notes": "   \n\n   "
}
```
**Setup:** DEMO_5 is in "Doing" state
**Expected Result:** ✅ Success (200) - Whitespace note accepted (may use default if trimmed)

#### TC3.13: Task at First Running Number
**Description:** Promote first task in application
```json
{
  "Task_id": "NEWAPP_1",
  "Task_notes": "First task completed"
}
```
**Setup:** NEWAPP_1 exists in "Doing" state
**Expected Result:** ✅ Success (200) - Task promoted

---

### Invalid (Erroneous) Data Test Cases

#### TC3.14: Missing Task_id
**Description:** Omit required field Task_id
```json
{
  "Task_notes": "Missing task ID"
}
```
**Expected Result:** ❌ Error (400) - Code: TMS_001

#### TC3.15: Empty String Task_id
**Description:** Task_id is empty string
```json
{
  "Task_id": "",
  "Task_notes": "Empty ID"
}
```
**Expected Result:** ❌ Error (400) - Code: TMS_001 or TMS_008

#### TC3.16: Null Task_id
**Description:** Task_id is null
```json
{
  "Task_id": null,
  "Task_notes": "Null ID"
}
```
**Expected Result:** ❌ Error (400) - Code: TMS_001

#### TC3.17: Non-Existent Task_id
**Description:** Task_id that doesn't exist in database
```json
{
  "Task_id": "NONEXIST_999",
  "Task_notes": "Task doesn't exist"
}
```
**Expected Result:** ❌ Error (404) - Code: TMS_008

#### TC3.18: Task in Open State
**Description:** Attempt to promote task not in Doing state
```json
{
  "Task_id": "DEMO_10",
  "Task_notes": "Trying to promote from Open"
}
```
**Setup:** DEMO_10 is in "Open" state
**Expected Result:** ❌ Error (400) - Code: TMS_009

#### TC3.19: Task in ToDo State
**Description:** Attempt to promote task in ToDo state
```json
{
  "Task_id": "DEMO_11",
  "Task_notes": "Trying to promote from ToDo"
}
```
**Setup:** DEMO_11 is in "ToDo" state
**Expected Result:** ❌ Error (400) - Code: TMS_009

#### TC3.20: Task Already in Done State
**Description:** Attempt to promote task already in Done state
```json
{
  "Task_id": "DEMO_12",
  "Task_notes": "Already done"
}
```
**Setup:** DEMO_12 is already in "Done" state
**Expected Result:** ❌ Error (400) - Code: TMS_009

#### TC3.21: Task in Closed State
**Description:** Attempt to promote closed task
```json
{
  "Task_id": "DEMO_13",
  "Task_notes": "Trying to promote closed task"
}
```
**Setup:** DEMO_13 is in "Closed" state
**Expected Result:** ❌ Error (400) - Code: TMS_009

#### TC3.22: User Not in Required Group
**Description:** User doesn't have App_permit_Doing permission
```json
{
  "Task_id": "RESTRICTED_5",
  "Task_notes": "Unauthorized promotion"
}
```
**Setup:** User not in group specified by application's App_permit_Doing
**Expected Result:** ❌ Error (403) - Code: TMS_004

#### TC3.23: Inactive User
**Description:** User account is inactive
```json
{
  "Task_id": "DEMO_5",
  "Task_notes": "Promotion by inactive user"
}
```
**Setup:** JWT user has Is_active = 0
**Expected Result:** ❌ Error (403) - Code: TMS_003

#### TC3.24: Application Without Permission Group
**Description:** Application has no App_permit_Doing configured
```json
{
  "Task_id": "NOPERM_5",
  "Task_notes": "App without permissions"
}
```
**Setup:** NOPERM application has NULL or empty App_permit_Doing
**Expected Result:** ❌ Error (403) - Code: TMS_004

#### TC3.25: Application Doesn't Exist
**Description:** Task's application no longer exists
```json
{
  "Task_id": "DELETED_5",
  "Task_notes": "Orphaned task"
}
```
**Setup:** Task exists but its application was deleted (should be prevented by FK)
**Expected Result:** ❌ Error (404) - Code: TMS_002 or TMS_008

#### TC3.26: Wrong Data Type for Task_id
**Description:** Task_id is number instead of string
```json
{
  "Task_id": 12345,
  "Task_notes": "Numeric ID"
}
```
**Expected Result:** ⚠️ May succeed (converted to string "12345") or fail

#### TC3.27: Array for Task_id
**Description:** Task_id is an array
```json
{
  "Task_id": ["DEMO", "5"],
  "Task_notes": "Array ID"
}
```
**Expected Result:** ❌ Error - Type mismatch

<!-- #### TC3.28: SQL Injection in Task_id
**Description:** Malicious SQL in Task_id
```json
{
  "Task_id": "DEMO_5'; DROP TABLE task; --",
  "Task_notes": "SQL injection attempt"
}
```
**Expected Result:** ❌ Error (404) - Code: TMS_008 (task doesn't exist with that exact ID)

#### TC3.29: SQL Injection in Task_notes
**Description:** Malicious SQL in notes
```json
{
  "Task_id": "DEMO_5",
  "Task_notes": "'; UPDATE task SET Task_state='Closed' WHERE '1'='1"
}
```
**Setup:** DEMO_5 is in "Doing" state
**Expected Result:** ✅ Success (200) - SQL properly escaped, stored as literal string -->

#### TC3.30: No Authentication Token
**Description:** Request without JWT token
```bash
curl -X POST http://localhost:5000/api/tasks/PromoteTask2Done \
  -H "Content-Type: application/json" \
  -d '{"Task_id": "DEMO_5", "Task_notes": "Test"}'
```
**Expected Result:** ❌ Error (401) - Unauthorized

#### TC3.31: Invalid JWT Token
**Description:** Request with expired token
```bash
curl -X POST http://localhost:5000/api/tasks/PromoteTask2Done \
  -H "Content-Type: application/json" \
  -b "token=expired.jwt.token" \
  -d '{"Task_id": "DEMO_5", "Task_notes": "Test"}'
```
**Expected Result:** ❌ Error (401) - Unauthorized

#### TC3.32: Malformed JSON
**Description:** Request body is not valid JSON
```bash
curl -X POST http://localhost:5000/api/tasks/PromoteTask2Done \
  -H "Content-Type: application/json" \
  -d '{Task_id: DEMO_5, Task_notes: "Invalid JSON"}'
```
**Expected Result:** ❌ Error (400) - JSON parse error

---

## Test Execution Summary

### Test Categories

| API | Valid Tests | Extreme Tests | Invalid Tests | Total |
|-----|-------------|---------------|---------------|-------|
| CreateTask | 6 | 6 | 16 | 28 |
| GetTasksByState | 8 | 3 | 13 | 24 |
| PromoteTask2Done | 7 | 6 | 19 | 32 |
| **TOTAL** | **21** | **15** | **48** | **84** |

---

## Notes on Test Execution

### Prerequisites
1. Database with test data (applications, plans, users, groups)
2. Valid JWT tokens for different user types (admin, pl, pm, dev)
3. Applications with various permission configurations
4. Tasks in different states

### Recommended Test Users
- `admin_user` - Has admin permissions
- `pl_user` - In "pl" group only
- `pm_user` - In "pm" group only
- `dev_user` - In "dev" group only
- `inactive_user` - Exists but Is_active = 0
- `noperm_user` - Not in any groups

### Recommended Test Applications
- `DEMO` - Standard app with all permissions configured
- `RESTRICTED` - Limited permissions (pl only)
- `NOPERM` - No permissions configured (NULL values)
- `EMPTY` - Exists but has no tasks
- `NEWAPP` - Fresh app with App_Rnumber = 0

### Automation Recommendations
1. Use testing framework (Jest, Mocha, Postman)
2. Set up test database with fixtures
3. Run tests in isolated transactions (rollback after each)
4. Mock email service for PromoteTask2Done tests
5. Verify error codes match specification
6. Check response structure matches documentation
