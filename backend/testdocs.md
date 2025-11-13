# Task Management System – REST API Documentation

## 1. CreateTask

| Name | Method | Parameters | Behaviour | Expected Output format |
|------|---------|-------------|------------|-------------------------|
| **CreateTask** | **POST** | `-u` username – Mandatory<br>`-p` password – Mandatory<br>`-a` application acronym – Mandatory<br>`-n` name of task – Mandatory<br>`-d` description of task – Optional | Creates a new task record in the specified application. The API increments the application's running number and generates a unique `Task_id` (e.g., `DEMO1`). | JSON object:<br>```json<br>{<br>  "task_id": "DEMO1",<br>  "code": "200"<br>}``` |

**Usage:**  
`POST /CreateTask`

### Example (JavaScript)
```js
const response = await fetch("http://localhost:5174/CreateTask", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer <token>" // obtained from login
  },
  body: JSON.stringify({
    Task_name: "Implement login feature",
    Task_description: "Frontend and backend authentication flow",
    Task_app_Acronym: "DEMO1"
  })
});

const data = await response.json();
console.log(data);
```

### Output (JS)

```js
{
    "success": true,
    "message": "Task created",
    "task": {
        "Task_id": "DEMO1_7",
        "Task_name": "Implement login feature",
        "Task_state": "Open",
        "Task_app_Acronym": "DEMO1",
        "Task_plan": null,
        "Task_creator": "root_admin",
        "Task_owner": "root_admin"
    }
}
```

### Example (curl)

```curl
curl -X POST http://localhost:5174/CreateTask \
 -H "Content-Type: application/json" \
 -H "Authorization: Bearer <token>" \
 -d '{
   "Task_name": "Implement login feature",
   "Task_description": "Frontend and backend authentication flow",
   "Task_app_Acronym": "DEMO1"
 }'

```

### Output (curl)

```js
{
  "success": true,
  "message": "Task created",
  "task": { "Task_id": "APPLE_3", "Task_state": "Open" }
}
```


| Code | Condition | Message returned | Error ID |
|------|------------|------------------|-----------|
| 400 | `Task_name` is missing or blank | `Task_name is required.` | **TMS_001** |
| 400 | `Task_app_Acronym` is missing or blank | `Task_app_Acronym is required.` | **TMS_001** |
| 400 | `Task_plan` provided but does not exist for the given application | `Task_plan or Task_app_Acronym not found for this application` | **TMS_001** |
| 500 | Failed to fetch or compute the running number | `Failed to allocate running number.` | **TMS_006** |
| 500 | Database insert error when creating task | `Failed to create task.` | **TMS_010** |

---

## 2. GetTaskbyState

| Name | Method | Parameters | Behaviour | Expected Output format |
|------|---------|-------------|------------|-------------------------|
| **GetTaskbyState** | **GET** | `-s` Task_state – Mandatory (`Open`, `ToDo`, `Doing`, `Done`, `Closed`)<br>`-a` Task_app_Acronym – Optional | Retrieves all tasks currently in the specified state, optionally filtered by a specific application acronym. | JSON object:<br>```json<br>{<br>  "success": true,<br>  "count": 2,<br>  "tasks": [ ... ]<br>}``` |

**Usage:**  
`GET /GetTaskbyState`


### Example (JavaScript)
```js
const response = await fetch("http://localhost:5174/GetTaskbyState?Task_state=Done", {
  method: "GET",
  headers: {
    "Authorization": "Bearer <token>"
  }
});
const data = await response.json();
console.log(data.tasks);
```

### Output (JS)

```js
{
    "success": true,
    "count": 1,
    "tasks": [
        {
            "Task_id": "DEMO_4",
            "Task_name": "Frontend Dashboard UI",
            "Task_description": "Design and implement React-based admin dashboard using MUI.",
            "Task_notes": {
                "log": [
                    {
                        "note": "UI task created.",
                        "user": "admin",
                        "state": "Open",
                        "timestamp": "2025-10-22 16:42:49.000000"
                    },
                    {
                        "note": "UI development in progress.",
                        "user": "developer2",
                        "state": "Doing",
                        "timestamp": "2025-10-22 16:42:49.000000"
                    },
                    {
                        "note": "Submitted for review.",
                        "user": "developer2",
                        "state": "Done",
                        "timestamp": "2025-10-22 16:42:49.000000"
                    },
                    {
                        "to": "Sprint 1",
                        "from": "Sprint 2",
                        "note": "Task plan reassigned.",
                        "user": "projectlead1",
                        "action": "reassign_plan",
                        "timestamp": "2025-11-04T08:01:00.480Z"
                    }
                ]
            },
            "Task_plan": "Sprint 1",
            "Task_app_Acronym": "DEMO",
            "Task_state": "Done",
            "Task_creator": "admin",
            "Task_owner": "developer2",
            "Task_createDate": "2025-10-22T08:42:49.000Z"
        }
    ]
}

```

### Example (curl)

```curl
curl -X GET "http://localhost:5174/GetTaskbyState?Task_state=Done" \
 -H "Authorization: Bearer <token>"


```

### Output (curl)

```js
{
    "success": true,
    "count": 1,
    "tasks": [
        {
            "Task_id": "DEMO_4",
            "Task_name": "Frontend Dashboard UI",
            "Task_description": "Design and implement React-based admin dashboard using MUI.",
            "Task_notes": {
                "log": [
                    {
                        "note": "UI task created.",
                        "user": "admin",
                        "state": "Open",
                        "timestamp": "2025-10-22 16:42:49.000000"
                    },
                    {
                        "note": "UI development in progress.",
                        "user": "developer2",
                        "state": "Doing",
                        "timestamp": "2025-10-22 16:42:49.000000"
                    },
                    {
                        "note": "Submitted for review.",
                        "user": "developer2",
                        "state": "Done",
                        "timestamp": "2025-10-22 16:42:49.000000"
                    },
                    {
                        "to": "Sprint 1",
                        "from": "Sprint 2",
                        "note": "Task plan reassigned.",
                        "user": "projectlead1",
                        "action": "reassign_plan",
                        "timestamp": "2025-11-04T08:01:00.480Z"
                    }
                ]
            },
            "Task_plan": "Sprint 1",
            "Task_app_Acronym": "DEMO",
            "Task_state": "Done",
            "Task_creator": "admin",
            "Task_owner": "developer2",
            "Task_createDate": "2025-10-22T08:42:49.000Z"
        }
    ]
}
```

| Code | Condition | Message returned | Error ID |
|------|------------|------------------|-----------|
| 400 | `Task_state` is missing or blank | `Task_state is required.` | **TMS_001** |
| 400 | `Task_state` is invalid (not one of `Open`, `ToDo`, `Doing`, `Done`, `Closed`) | `Invalid Task_state '<value>'. Must be one of: Open, ToDo, Doing, Done, Closed.` | **TMS_007** |
| 500 | Database query fails | `DB error` or generic server message | **TMS_010** |

> **Note:** When no matching tasks are found, the API returns an empty array instead of an error.

---

## 3. PromoteTask2Done

| Name | Method | Parameters | Behaviour | Expected Output format |
|------|---------|-------------|------------|-------------------------|
| **PromoteTask2Done** | **POST** | `-t` Task_id – Mandatory<br>`-n` note – Mandatory | Promotes a task from **Doing → Done**, appending the review note to the task’s audit trail and notifying the Project Lead. | JSON object:<br>```json<br>{<br>  "success": true,<br>  "message": "Task 'DEMO1_6' sent for review (state set to 'Done').",<br>  "task": { "Task_id": "DEMO1_6", "Task_state": "Done" }<br>}``` |

**Usage:**  
`POST /PromoteTask2Done`


### Example (JavaScript)
```js
const response = await fetch("http://localhost:5174/PromoteTask2Done", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer <token>"
  },
  body: JSON.stringify({
    "Task_id": "DEMO1_5",
    "note" : "Task Completed"
  })
});
const data = await response.json();
console.log(data);

```

### Output (JS)

```js
{
    "success": true,
    "message": "Task 'DEMO1_5' sent for review (state set to 'Done').",
    "task": {
        "Task_id": "DEMO1_5",
        "Task_app_Acronym": "DEMO1",
        "Task_state": "Done",
        "Task_owner": "root_admin"
    }
}


```

### Example (curl)

```curl
curl -X POST http://localhost:5174/PromoteTask2Done \
 -H "Content-Type: application/json" \
 -H "Authorization: Bearer <token>" \
 -d '{
    "Task_id": "DEMO1_5",
    "note" : "Task Completed"
  }'


```

### Output (curl)

```js
{
    "success": true,
    "message": "Task 'DEMO1_5' sent for review (state set to 'Done').",
    "task": {
        "Task_id": "DEMO1_5",
        "Task_app_Acronym": "DEMO1",
        "Task_state": "Done",
        "Task_owner": "root_admin"
    }
}

```

| Code | Condition | Message returned | Error ID |
|------|------------|------------------|-----------|
| 400 | `Task_id` is missing or blank | `Task_id is required.` | **TMS_001** |
| 400 | `note` is missing or blank | `A review note is required.` | **TMS_001** |
| 404 | Task with given `Task_id` not found | `Task not found.` | **TMS_008** |
| 400 | Task is **not** currently in `'Doing'` state | `Only tasks in 'Doing' can be sent for review.` | **TMS_009** |
| 403 | User is **not** the current task owner | `Only the current task owner (<owner>) can request for review.` | **TMS_004** |
| 404 | Related application not found | `Application '<acronym>' not found.` | **TMS_002** |
| 500 | Database update fails while promoting task | `Failed to request review.` | **TMS_010** |

---

## Assignment 3 Error Codes


The Assignment 3 APIs (`CreateTask`, `GetTaskbyState`, `PromoteTask2Done`) now return standardized error payloads:


```json
{
  "errorCode": "TMS_001",
  "details": {
    "missingFields": ["task_name", "task_app_acronym"]
  }
}
```


- `errorCode` is always present and identifies the failure.
- `details` is optional and supplies contextual metadata that callers can display or log without parsing error strings.


### Error Code Reference


| Error Code | HTTP Status | Meaning | APIs |
|------------|-------------|---------|------|
| `TMS_001` | 400 | Required input field(s) missing. `details.missingFields` lists the absent keys. | All |
| `TMS_002` | 404 | Referenced application does not exist. | CreateTask, GetTaskbyState, PromoteTask2Done |
| `TMS_003` | 403 | Authenticated user does not exist or is inactive. | CreateTask, PromoteTask2Done |
| `TMS_004` | 403 | Authenticated user lacks the necessary application permission. `details.action` identifies the attempted operation. | CreateTask, PromoteTask2Done |
| `TMS_005` | 409 | A task ID collision occurred during creation (retry-safe). | CreateTask |
| `TMS_006` | 500 | The system could not generate a unique task ID. | CreateTask |
| `TMS_007` | 400 | Invalid task state filter supplied. `details.allowedStates` lists valid values. | GetTaskbyState |
| `TMS_008` | 404 | Requested task was not found. | PromoteTask2Done |
| `TMS_009` | 400 | Task is not in the correct state for the requested transition. `details.currentState` shows the current state. | PromoteTask2Done |
| `TMS_010` | 500 | Unexpected server-side failure. | All |


### Client Integration Notes


- Success responses are unchanged.
- Error handlers should branch on `errorCode` instead of matching messages.
- The HTTP status code still reflects the error category (4xx for client issues, 5xx for server issues).
- Additional metadata may be added to `details` over time without breaking compatibility; treat it as optional.


---

### Error Codes

#### CreateTask
| Code | Condition | Message returned | Error ID |
|------|------------|------------------|-----------|
| 400 | `Task_name` is missing or blank | `Task_name is required.` | **TMS_001** |
| 400 | `Task_app_Acronym` is missing or blank | `Task_app_Acronym is required.` | **TMS_001** |
| 400 | `Task_plan` provided but does not exist for the given application | `Task_plan or Task_app_Acronym not found for this application` | **TMS_001** |
| 500 | Failed to fetch or compute the running number | `Failed to allocate running number.` | **TMS_006** |
| 500 | Database insert error when creating task | `Failed to create task.` | **TMS_010** |

---

#### GetTaskbyState
| Code | Condition | Message returned | Error ID |
|------|------------|------------------|-----------|
| 400 | `Task_state` is missing or blank | `Task_state is required.` | **TMS_001** |
| 400 | `Task_state` is invalid (not one of `Open`, `ToDo`, `Doing`, `Done`, `Closed`) | `Invalid Task_state '<value>'. Must be one of: Open, ToDo, Doing, Done, Closed.` | **TMS_007** |
| 500 | Database query fails | `DB error` or generic server message | **TMS_010** |

> **Note:** When no matching tasks are found, the API returns an empty array instead of an error.

---

#### PromoteTask2Done
| Code | Condition | Message returned | Error ID |
|------|------------|------------------|-----------|
| 400 | `Task_id` is missing or blank | `Task_id is required.` | **TMS_001** |
| 400 | `note` is missing or blank | `A review note is required.` | **TMS_001** |
| 404 | Task with given `Task_id` not found | `Task not found.` | **TMS_008** |
| 400 | Task is **not** currently in `'Doing'` state | `Only tasks in 'Doing' can be sent for review.` | **TMS_009** |
| 403 | User is **not** the current task owner | `Only the current task owner (<owner>) can request for review.` | **TMS_004** |
| 404 | Related application not found | `Application '<acronym>' not found.` | **TMS_002** |
| 500 | Database update fails while promoting task | `Failed to request review.` | **TMS_010** |