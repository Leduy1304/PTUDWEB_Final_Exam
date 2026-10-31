# ⚡ TaskFlow — Task Management App (MERN)

A full-stack productivity app: personal to-do lists, reminders, project management
with Kanban boards, team collaboration, and calendar integrations.

- **Backend:** Node.js + Express + MongoDB (Mongoose) + JWT auth + node-cron reminder engine
- **Frontend:** React 18 + Vite + React Router + Axios + Tailwind CSS

---

## ✨ Features

**Tasks & productivity**
- Create, edit, delete, and check off tasks; priorities, due dates, labels/tags, subtasks
- Filter/search by status, priority, project, assignee, due date; overdue & due-today views
- Dashboard with stats: total / open / completed / overdue + due-today list

**Reminders**
- Set reminders on tasks (date/time + note); a server-side cron job checks every minute,
  marks them sent, and logs them. No external service is wired by default.

**Projects & Kanban**
- Projects with owner + members, drag-and-drop Kanban board (To Do / In Progress / Done)

**Team collaboration**
- Invite members to projects by email; assign tasks to members; Team page shows each
  member's open assigned tasks; organization field on user profiles

**Calendar integration**
- Export all due tasks as an `.ics` file (import into Google/Apple/Outlook calendars)
- Per-task "Add to Google Calendar" link (🗓️ button on each task card)

**Role-based access (Admin / Người dùng)**
- Every account has a `role`: `user` (regular) or `admin` (system administrator)
- Admins get an extra **Quản trị** area: system-wide stats, manage all users
  (change role, delete accounts), and read-only views of all projects & tasks
- See [Phân quyền (Admin / Người dùng)](#-phân-quyền-admin--người-dùng) below

---

## 📁 Folder structure

```
task-manager/
├── README.md
├── server/                        # Express API
│   ├── package.json
│   ├── .env.example               # copy to .env and fill in
│   └── src/
│       ├── index.js               # entry: middleware, routes, cron, graceful DB failure
│       ├── config/db.js           # MongoDB connection (clear error when MONGO_URI missing)
│       ├── middleware/auth.js     # JWT auth → req.user
│       ├── middleware/requireAdmin.js  # 403 unless req.user.role === "admin"
│       ├── middleware/errorHandler.js
│       ├── utils/asyncHandler.js
│       ├── models/                # User (role), Project, Task (subtasks), Reminder
│       ├── routes/                # auth, projects, tasks, reminders, calendar, admin
│       └── jobs/reminderJob.js    # node-cron: fires due reminders every minute
└── client/                        # React + Vite frontend
    ├── package.json
    ├── vite.config.js             # dev proxy: /api → http://localhost:5000
    ├── index.html                 # Tailwind via CDN
    └── src/
        ├── main.jsx / App.jsx     # router + protected routes
        ├── api/client.js          # axios instance + JWT interceptor
        ├── context/AuthContext.jsx
        ├── utils/format.js        # date helpers, badge styles
        ├── components/            # ProtectedRoute, Layout, TaskCard, TaskModal
        ├── pages/                 # Login, Register, Dashboard, MyTasks,
        │                          # Projects, ProjectDetail (Kanban), CalendarView,
        │                          # Reminders, Team, Admin (admin only)
        └── styles/index.css
```

---

## 🚀 Setup

### 1. Backend

```bash
cd server
cp .env.example .env
# Edit .env:
#   MONGO_URI  → mongodb://localhost:27017/taskmanager
#                 ...or a MongoDB Atlas connection string
#   JWT_SECRET → any long random string
#   PORT       → 5000 (default)
npm install
npm start        # or: npm run dev (nodemon)
```

The API listens on `http://localhost:5000`. If `MONGO_URI` is missing or MongoDB is
unreachable, the server still boots and prints a clear warning; data endpoints will
fail until the database is configured. Health check: `GET /api/health`.

### 2. Frontend

```bash
cd client
npm install
npm run dev     # → http://localhost:5173 (proxies /api to the backend)
npm run build   # production build → client/dist
```

To serve the production build from Express, copy `client/dist` into the backend's
static folder of choice (or deploy the two parts separately and point the axios
`baseURL` in `src/api/client.js` at the API URL).

### 3. Wiring real notifications (optional)

The reminder engine (`server/src/jobs/reminderJob.js`) currently logs due reminders
to the console and marks them `sent` so each fires once. To send real notifications,
replace the `console.log` in the cron callback with your provider — e.g. nodemailer /
SendGrid for email, Firebase Cloud Messaging for push, or a Slack webhook.

---

## 🔌 API endpoints

All `/api/*` routes except auth register/login and `/api/health` require
`Authorization: Bearer <JWT>`.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register `{name, email, password, organization?}` → `{token, user}` |
| POST | `/api/auth/login` | Login `{email, password}` → `{token, user}` |
| GET | `/api/auth/me` | Current user profile |
| PATCH | `/api/auth/me` | Update profile `{name?, organization?}` |
| GET | `/api/projects` | My projects (owned or member) |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/:id` | Project detail with members |
| PATCH | `/api/projects/:id` | Edit project |
| DELETE | `/api/projects/:id` | Delete project + its tasks (owner only) |
| POST | `/api/projects/:id/members` | Invite member `{email}` |
| DELETE | `/api/projects/:id/members/:userId` | Remove member (owner, or self to leave) |
| GET | `/api/tasks` | List tasks; filters: `status, priority, project, assignee, dueBefore, dueAfter, overdue=true, dueToday=true, q, includeShared=true` |
| POST | `/api/tasks` | Create task (validates project membership + assignee) |
| GET | `/api/tasks/:id` | Task detail |
| PATCH | `/api/tasks/:id` | Update task (status, assign, edit…) |
| DELETE | `/api/tasks/:id` | Delete task (owner only) |
| POST | `/api/tasks/:id/subtasks` | Add subtask `{title}` |
| PATCH | `/api/tasks/:id/subtasks/:subId` | Toggle subtask `{done}` |
| DELETE | `/api/tasks/:id/subtasks/:subId` | Remove subtask |
| GET | `/api/reminders?upcoming=true` | List reminders |
| POST | `/api/reminders` | Create `{task, remindAt, note?}` |
| DELETE | `/api/reminders/:id` | Delete reminder |
| GET | `/api/calendar/export.ics` | Download tasks as `.ics` file |
| GET | `/api/calendar/google-link/:taskId` | `{url}` — "Add to Google Calendar" link |
| GET | `/api/admin/stats` | **Admin only** — system-wide counters |
| GET | `/api/admin/users` | **Admin only** — all users (no password hashes) |
| PATCH | `/api/admin/users/:id/role` | **Admin only** — set role `{role: "user"\|"admin"}` |
| DELETE | `/api/admin/users/:id` | **Admin only** — delete user + cascade cleanup (see below) |
| GET | `/api/admin/projects` | **Admin only** — all projects + member counts |
| GET | `/api/admin/tasks` | **Admin only** — all tasks, optional `?status=` filter |

---

## 🛡️ Phân quyền (Admin / Người dùng)

Every account carries a `role` field:

- **`user`** — a regular account. Sees exactly their own data plus projects
  shared with them. This is what every new registration gets.
- **`admin`** — a system administrator. Everything a user has, **plus** the
  **Quản trị** section (`/admin` in the UI, `/api/admin/*` on the API):
  system-wide stats (users / projects / tasks / by status / overdue), a table
  of **all** users where an admin can change anyone's role or delete an
  account, and read-only lists of all projects and all tasks.

**How does the first admin come to exist?** Two ways, checked automatically:

1. **Startup auto-promotion** — on every boot, after the database connects,
   if *no* user has role `admin`, the **earliest-registered user** is promoted
   and the server logs `👑 Promoted <email> to admin (no admin existed)`.
   On an existing install this means the app owner's account (the first one
   ever created) becomes admin the next time the server restarts.
2. **`ADMIN_EMAIL`** — set it in `server/.env` and any *new* registration with
   that exact email (case-insensitive) is created as admin. Any `role` value
   sent by a client during registration is always ignored otherwise.

**Safety guards**

- The **last admin cannot be demoted or deleted** — the system always keeps
  at least one administrator.
- An admin **cannot delete their own account** from the admin area.
- `/api/admin/*` always requires a valid JWT **and** `role: "admin"`
  (regular users get `403 Admin access required`).

**What happens when an admin deletes a user?** (cascade, also commented in
`server/src/routes/admin.js`): projects the user **owns** are deleted together
with all tasks inside them; the user's own tasks and reminders are deleted;
tasks in *other people's* projects that were only assigned to this user are
kept but unassigned; and the user is removed from every project's member list.

---

## 🔐 Security notes

- Passwords are hashed with bcrypt; JWTs expire after 7 days.
- No secrets are committed — only `.env.example` ships with the repo.
- Project/task access is enforced server-side: members-only reads, owner-only deletes.
