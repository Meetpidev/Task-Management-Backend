
---

## Setup Instructions

### 1. Backend
````bash
cd backend
npm install
cp .env.example .env   # then fill in your values
npm run dev             # starts on http://localhost:5000
````

On first run, the backend automatically **seeds an admin account** (see [Admin Panel](#admin-panel) below) if one doesn't already exist in the database.

### 2. Frontend

````bash
cd frontend
npm install
npm run dev              # starts on http://localhost:5173
````

Create a `.env` file in `frontend/` if your API isn't on the default URL:

````
VITE_API_URL=http://localhost:5000/api
````

### 3. Running Tests

````bash
cd backend
npm test
````

---

## Environment Variables (backend/.env)

| Variable          | Description                              |
| ------------------ | ----------------------------------------- |
| `PORT`             | Port the API runs on (default 5000)      |
| `MONGO_URI`        | MongoDB connection string                |
| `JWT_SECRET`       | Secret used to sign JWTs                 |
| `JWT_EXPIRES_IN`   | Token expiry, e.g. `7d`                  |
| `CLIENT_URL`       | Frontend origin, used for CORS           |
| `ADMIN_NAME`       | Admin name used to seed the admin        |
| `ADMIN_EMAIL`      | Email used to seed the admin account     |
| `ADMIN_PASSWORD`   | Password used to seed the admin account  |
| `NODE_ENV`         | development                              |

---

## Admin Panel

Task Manager Pro ships with a built-in **Admin Panel**, accessible after logging in with the seeded admin account. The admin role can:

- View and manage **all users** in the system (not just their own projects)
- View and manage **all projects** across every user
- View, reassign, or delete **any task**
- View system-wide statistics (total users, total projects, total tasks, total hours logged)

The Admin Panel is available at:

````
http://localhost:5173/admin
````

Regular (non-admin) users are automatically redirected away from `/admin` routes.

### Default Demo Credentials

> ⚠️ These are **demo/seed credentials** for local development and evaluation only. Change or remove them before deploying to production.

| Role  | Email               | Password  |
| ----- | ------------------- | --------- |
| Admin | `admin@gmail.com`   | `admin123` |

These credentials are seeded automatically the first time the backend connects to a fresh database (via `utils/seedAdmin.js`, run on server startup). You can override them by setting `ADMIN_EMAIL` and `ADMIN_PASSWORD` in your `.env` file before the first run.

---

## API Documentation

Base URL: `/api`

### Auth

| Method | Endpoint             | Body                          | Description                                  |
| ------ | --------------------- | ------------------------------ | --------------------------------------------- |
| POST   | `/auth/register`      | `{ name, email, password }`   | Register new user, returns `{ user, token }` |
| POST   | `/auth/login`         | `{ email, password }`         | Login, returns `{ user, token }`             |
| GET    | `/auth/me`            | — (Bearer token)               | Get current user                             |

### Projects

| Method | Endpoint                    | Description                                  |
| ------ | ----------------------------- | ---------------------------------------------- |
| GET    | `/projects`                  | List projects owned or joined by user        |
| POST   | `/projects`                  | `{ name, description }` — create project     |
| GET    | `/projects/:id`               | Get project details                          |
| PUT    | `/projects/:id`               | Update project (owner only)                  |
| DELETE | `/projects/:id`               | Delete project + its tasks (owner only)      |
| POST   | `/projects/:id/members`       | `{ email }` — add member (owner only)        |

### Tasks

| Method | Endpoint                          | Query/Body                                                                 | Description                          |
| ------ | ----------------------------------- | ----------------------------------------------------------------------------- | --------------------------------------- |
| GET    | `/projects/:projectId/tasks`       | `?status=&priority=&assignee=&page=&limit=`                                  | List tasks, filtered + paginated     |
| POST   | `/projects/:projectId/tasks`       | `{ title, description, assignee, priority, dueDate, estimatedHours, tags }` | Create task                          |
| GET    | `/tasks/:id`                       | —                                                                              | Get task details                     |
| PUT    | `/tasks/:id`                       | any task field                                                                | Update task                          |
| DELETE | `/tasks/:id`                       | —                                                                              | Delete task                          |

### Time Entries

| Method | Endpoint                          | Body                                | Description                              |
| ------ | ----------------------------------- | -------------------------------------- | ------------------------------------------- |
| GET    | `/tasks/:taskId/time-entries`      | —                                       | List time entries for a task             |
| POST   | `/tasks/:taskId/time-entries`      | `{ hours, description, date }`        | Log time                                 |
| DELETE | `/time-entries/:id`                | —                                       | Delete an entry (owner of entry only)    |

### Dashboard

| Method | Endpoint             | Description                                                                  |
| ------ | ---------------------- | ------------------------------------------------------------------------------- |
| GET    | `/dashboard/stats`    | Returns totals, tasks-by-status, overdue count, recent tasks, hours-by-project |

### Admin (requires admin role)

| Method | Endpoint                | Description                                  |
| ------ | -------------------------- | ----------------------------------------------- |
| GET    | `/admin/users`             | List all registered users                     |
| DELETE | `/admin/users/:id`         | Delete a user account                         |
| GET    | `/admin/projects`          | List all projects (any owner)                 |
| DELETE | `/admin/projects/:id`      | Delete any project                            |
| GET    | `/admin/tasks`             | List all tasks across all projects            |
| DELETE | `/admin/tasks/:id`         | Delete any task                               |
| GET    | `/admin/stats`             | System-wide stats (users, projects, tasks, hours) |

All protected routes require:

````
Authorization: Bearer <token>
````

### Sample Response — `POST /api/auth/login`

````json
{
  "success": true,
  "data": {
    "user": {
      "_id": "...",
      "name": "Admin",
      "email": "admin@gmail.com",
      "role": "admin",
      "avatar": "..."
    },
    "token": "eyJhbGciOi..."
  }
}
````

---

## Authorization Rules

- Users can only view/edit projects they own or are a member of.
- Only the project owner can update/delete the project or add members.
- Only the user who logged a time entry can delete it.
- Only users with `role: "admin"` can access `/api/admin/*` endpoints and the `/admin` frontend routes.
- Admins bypass normal project/task ownership checks for read and moderation purposes.

---

## Testing

````bash
cd backend
npm test
````

Includes:
- Unit tests for utility functions (pagination, etc.)
- Integration tests for auth endpoints using Jest + Supertest + mongodb-memory-server

---
