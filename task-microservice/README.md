# Task Management Microservice

A containerized microservice that provides three task management APIs extracted from the main Task Management System.

## APIs Included

1. **POST /api/CreateTask** - Create a new task in Open state
2. **GET /api/GetTaskbyState** - Get tasks filtered by state (with optional application filter)
3. **POST /api/PromoteTask2Done** - Promote a task from Doing state to Done state

## Features

- JWT-based authentication using HTTP-only cookies
- MySQL database integration
- Email notifications for task completions (to PL users)
- Role-based access control via user groups
- Transaction support for data consistency
- Health check endpoint

## Prerequisites

- Node.js 18 or higher
- MySQL database (shared with main application)
- Docker (for containerized deployment)

## Setup

### Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start the service:**
   ```bash
   # Development mode (with auto-reload)
   npm run dev

   # Production mode
   npm start
   ```

The service will run on `http://localhost:5001` by default.

### Docker Deployment

1. **Build the Docker image:**
   ```bash
   docker build -t task-microservice:latest .
   ```

2. **Run the container:**
   ```bash
   docker run -d \
     --name task-microservice \
     -p 5001:5001 \
     -e DB_HOST=your_db_host \
     -e DB_PORT=3306 \
     -e DB_USER=your_db_user \
     -e DB_PASSWORD=your_db_password \
     -e DB_NAME=task_management \
     -e JWT_SECRET=your_jwt_secret \
     -e JWT_EXPIRES_IN=1h \
     -e EMAIL_HOST=smtp.gmail.com \
     -e EMAIL_PORT=587 \
     -e EMAIL_USER=your_email@gmail.com \
     -e EMAIL_PASSWORD=your_app_password \
     -e EMAIL_FROM=your_email@gmail.com \
     -e NODE_ENV=production \
     task-microservice:latest
   ```

3. **Or use Docker Compose:**
   ```yaml
   version: '3.8'
   services:
     task-microservice:
       build: .
       ports:
         - "5001:5001"
       environment:
         DB_HOST: mysql
         DB_PORT: 3306
         DB_USER: root
         DB_PASSWORD: password
         DB_NAME: task_management
         JWT_SECRET: your_jwt_secret
         JWT_EXPIRES_IN: 1h
         EMAIL_HOST: smtp.gmail.com
         EMAIL_PORT: 587
         EMAIL_USER: your_email@gmail.com
         EMAIL_PASSWORD: your_app_password
         EMAIL_FROM: your_email@gmail.com
         NODE_ENV: production
       depends_on:
         - mysql
       restart: unless-stopped
   ```

## API Documentation

### 1. Create Task

**Endpoint:** `POST /api/CreateTask`

**Authentication:** Required (JWT cookie)

**Request Body:**
```json
{
  "Task_app_Acronym": "APP1",
  "Task_name": "Task Name",
  "Task_description": "Task description (optional)",
  "Task_plan": "Plan Name (optional)"
}
```

**Response Codes:**
- `201` - Task created successfully
- `400` - TMS_001 (Missing required fields)
- `403` - TMS_003 (User inactive) or TMS_004 (Permission denied)
- `404` - TMS_002 (Application not found)
- `409` - TMS_005 (Task ID collision)
- `500` - TMS_010 (Database error)

### 2. Get Tasks by State

**Endpoint:** `GET /api/GetTaskbyState`

**Authentication:** Required (JWT cookie)

**Query Parameters:**
- `Task_state` (required) - State to filter by: Open, ToDo, Doing, Done, Closed
- `Task_app_Acronym` (optional) - Filter by specific application

**Example:**
```
GET /api/GetTaskbyState?Task_state=Done&Task_app_Acronym=APP1
```

**Response:**
```json
{
  "success": true,
  "count": 2,
  "tasks": [
    {
      "Task_id": "APP1_1",
      "Task_name": "Task Name",
      "Task_state": "Done",
      "Task_notes": [...],
      ...
    }
  ]
}
```

**Response Codes:**
- `200` - Success
- `400` - TMS_001 (Missing state) or TMS_007 (Invalid state)
- `403` - TMS_003 (User inactive)
- `404` - TMS_002 (Application not found)
- `500` - TMS_010 (Database error)

### 3. Promote Task to Done

**Endpoint:** `POST /api/PromoteTask2Done`

**Authentication:** Required (JWT cookie)

**Request Body:**
```json
{
  "Task_id": "APP1_1",
  "Task_notes": "Completion note (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Task promoted to Done successfully",
  "task": {
    "Task_id": "APP1_1",
    "Task_state": "Done"
  }
}
```

**Response Codes:**
- `200` - Task promoted successfully
- `400` - TMS_001 (Missing Task_id) or TMS_009 (Task not in Doing state)
- `403` - TMS_003 (User inactive) or TMS_004 (Permission denied)
- `404` - TMS_002 (Application not found) or TMS_008 (Task not found)
- `500` - TMS_010 (Database error)

**Note:** This endpoint sends email notifications to all active PL (Project Lead) users when a task is promoted to Done.

### Health Check

**Endpoint:** `GET /health`

**Response:**
```json
{
  "success": true,
  "message": "Task Microservice is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Error Codes

| Code    | Description |
|---------|-------------|
| TMS_001 | Missing required fields |
| TMS_002 | Application not found |
| TMS_003 | User not found or inactive |
| TMS_004 | Permission denied (not in required group) |
| TMS_005 | Task ID collision (duplicate) |
| TMS_007 | Invalid task state |
| TMS_008 | Task not found |
| TMS_009 | Task not in expected state |
| TMS_010 | Database or internal error |

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| DB_HOST | Yes | localhost | MySQL host |
| DB_PORT | Yes | 3306 | MySQL port |
| DB_USER | Yes | - | Database username |
| DB_PASSWORD | Yes | - | Database password |
| DB_NAME | Yes | - | Database name |
| PORT | No | 5001 | Service port |
| NODE_ENV | No | development | Environment (development/production) |
| JWT_SECRET | Yes | - | JWT secret key (must match main app) |
| JWT_EXPIRES_IN | No | 1h | JWT expiration time |
| EMAIL_HOST | No | - | SMTP host (for notifications) |
| EMAIL_PORT | No | 587 | SMTP port |
| EMAIL_USER | No | - | Email username |
| EMAIL_PASSWORD | No | - | Email password |
| EMAIL_FROM | No | - | From email address |

## Database Requirements

This microservice requires access to the same MySQL database as the main Task Management System. It uses the following tables:

- `users` - User authentication and groups
- `application` - Application definitions and permissions
- `task` - Task records
- `user_groups` - Available user groups

## Authentication

The microservice uses JWT tokens stored in HTTP-only cookies. Tokens must be obtained from the main authentication system (`/login` endpoint) and include:

- `username` - User identifier
- `ipAddress` - Client IP (validated on each request)
- `browserType` - User-Agent (for additional security)

The JWT secret must match between the main application and this microservice.

## Security Features

- HTTP-only cookie authentication prevents XSS attacks
- IP address validation on every request
- Role-based access control via user groups
- Transaction support for data consistency
- Prepared statements prevent SQL injection

## Development

### File Structure
```
task-microservice/
├── app.js              # Main application
├── jwt.js              # JWT utilities
├── emailService.js     # Email notification service
├── package.json        # Dependencies
├── Dockerfile          # Docker configuration
├── .dockerignore       # Docker ignore rules
├── .env.example        # Environment template
└── README.md           # This file
```

### Testing

Test the health endpoint:
```bash
curl http://localhost:5001/health
```

Test with authentication (assuming you have a valid JWT cookie):
```bash
curl -X POST http://localhost:5001/api/CreateTask \
  -H "Content-Type: application/json" \
  -H "Cookie: token=your_jwt_token" \
  -d '{
    "Task_app_Acronym": "APP1",
    "Task_name": "Test Task"
  }'
```

## Monitoring

The Docker container includes a health check that runs every 30 seconds:
```bash
docker ps  # Check container health status
docker logs task-microservice  # View logs
```

## Troubleshooting

### Database Connection Issues
- Ensure MySQL is accessible from the container
- Check database credentials in environment variables
- Verify network connectivity (`docker network inspect`)

### Authentication Issues
- Ensure JWT_SECRET matches the main application
- Verify cookies are being sent with requests
- Check IP address validation (especially with proxies)

### Email Issues
- Email configuration is optional; the service works without it
- Check SMTP credentials and host configuration
- Review logs for email sending errors

## License

ISC
