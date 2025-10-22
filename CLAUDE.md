# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A full-stack Task Management System built with React (frontend) and Express.js (backend), featuring user authentication with JWT tokens stored in HTTP-only cookies, role-based access control, and MySQL database integration.

## Architecture

### Backend (Express.js)
- **Main entry**: `backend/app.js`
- **JWT utilities**: `backend/jwt.js` - Token generation, verification, and decoding
- **Database**: MySQL with mysql2 driver
- **Authentication flow**:
  - JWT tokens stored in HTTP-only cookies for security
  - Token payload includes: username, IP address, browser type (user-agent)
  - Middleware validates IP and browser on each request to prevent token theft
  - Admin access checked via `user_groups` JSON array in database

### Frontend (React + Vite)
- **Main entry**: `frontend/src/main.jsx` → `frontend/src/App.jsx`
- **State management**: React Context API (`AuthContext`)
- **UI library**: Material-UI (MUI)
- **Routing**: React Router v7
- **API layer**: `frontend/src/apis/api.js` - Centralized axios instance with interceptors

### Key Architectural Patterns

**Authentication Context** (`frontend/src/contexts/AuthContext.jsx`):
- Provides global auth state (user, loading, error)
- Exposes: `login()`, `logout()`, `checkAuth()`, `isAuthenticated`, `isAdmin`, `isRootAdmin`
- Automatically checks auth status on mount via `/me` endpoint

**Protected Routes** (`frontend/src/components/ProtectedRoute.jsx`):
- Wraps pages requiring authentication
- `requireAdmin` prop for admin-only pages

**Middleware Chain** (backend):
1. `authenticateJWT` - Validates JWT from cookie, checks IP/browser
2. `requireAdmin` - Queries database for user groups, checks for 'admin' group or root_admin username

**User Groups System**:
- Stored as JSON array in MySQL `users.user_groups` column
- Hard-coded "root_admin" username has permanent admin access
- Groups stored in separate `user_groups` table (group_name primary key)

## Database Schema

**users table**:
- `username` (PRIMARY KEY)
- `email` (UNIQUE)
- `password` (bcrypt hashed, 12 salt rounds)
- `user_groups` (JSON array, e.g., `["admin", "developer"]`)
- `Is_active` (BOOLEAN)

**user_groups table**:
- `group_name` (PRIMARY KEY, max 10 chars)

## Development Commands

### Backend
```bash
cd backend
npm install              # Install dependencies
npm run dev             # Start with nodemon (auto-reload)
npm start               # Start production server
```

### Frontend
```bash
cd frontend
npm install              # Install dependencies
npm run dev             # Start Vite dev server (default: http://localhost:5173)
npm run build           # Build for production
npm run preview         # Preview production build
npm run lint            # Run ESLint
```

## Environment Configuration

Backend requires `.env` file in `backend/` directory:
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=<your_db_user>
DB_PASSWORD=<your_db_password>
DB_NAME=<your_db_name>
JWT_SECRET=<your_jwt_secret>
JWT_EXPIRES_IN=1h
NODE_ENV=development
PORT=5000
```

## API Endpoints

### Public
- `POST /login` - Authenticate user (sets HTTP-only cookie)
- `POST /logout` - Clear authentication cookie

### Protected (JWT required)
- `GET /me` - Get current user info

### Admin Only
- `GET /api/users` - List all users
- `GET /api/users/:username` - Get single user
- `POST /api/users` - Create user
- `PUT /api/users/:username` - Update user
- `GET /api/user-groups` - List all groups
- `POST /api/user-groups` - Create group
- `DELETE /api/user-groups/:group_name` - Delete group

## Security Implementation

**JWT Storage**: HTTP-only cookies prevent XSS attacks (JavaScript cannot access token)

**Token Binding**: Tokens include IP address and User-Agent, validated on every request to prevent session hijacking

**Password Requirements** (enforced in backend):
- Email: Standard email regex validation
- Password: 8-10 chars, must contain letter, number, and special character
- Regex: `/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,10}$/`

**CORS Configuration**: Whitelist approach, credentials enabled for cookie transmission

**Protected User Operations**:
- Cannot remove admin group from "root_admin" user
- Cannot disable "root_admin" user
- Cannot delete "admin" group

## Page Routes

- `/` - Home/Login page (public)
- `/usermanagement` - User management dashboard (admin only)
- `/applications` - Applications dashboard (authenticated users)

## Important Implementation Notes

1. **user_groups handling**: Database stores as JSON string, but application always works with JavaScript arrays. Conversion happens at DB boundary in backend.

2. **Admin detection logic**: Check if `username === 'root_admin'` OR `user_groups` array includes 'admin'.

3. **Cookie configuration**:
   - `httpOnly: true` - Prevents JavaScript access
   - `secure: true` in production (HTTPS only)
   - `sameSite: 'lax'` - CSRF protection
   - `maxAge: 1 hour` - Auto-expiry

4. **API interceptor**: Frontend automatically redirects to `/` on 401 responses (expired/invalid tokens).

5. **Password updates**: Empty password string in update requests is ignored (doesn't change password).

6. **React Compiler enabled**: Template uses experimental React Compiler for optimizations.
