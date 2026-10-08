# TaskFlow — Smart Task Manager 🚀

TaskFlow is a modern, production-ready, SaaS-grade Task Management Web Application engineered with **HTML5, CSS3, Vanilla JavaScript (ES6+), Node.js, Express.js**, and **Supabase PostgreSQL** with strict **Row Level Security (RLS)**.

---

## 🌟 Features

- **Dashboard Intelligence:**
  - Real-time counters for **Total, Pending (Todo), In Progress, Completed, Overdue**, and **Due Today**.
  - Dynamic completion velocity progress bar.
  - Priority distribution breakdown (Urgent, High, Medium, Low).
  - Quick widgets for **Today's Tasks** and **Upcoming Deadlines**.
- **Task Management (Full CRUD):**
  - Create, view, edit, and delete tasks.
  - Interactive status transitions (**Todo, In Progress, Completed, Cancelled**).
  - Priority levels with distinct badges (**Low, Medium, High, Urgent**).
  - Due date tracking with automatic overdue calculation.
  - Tags management via interactive chip input.
  - Detailed task modal and standalone inspection view (`/task-details.html`).
- **Organization & Categories:**
  - Create custom categories with custom color themes.
  - One-click category filtering.
- **Search, Filter & Sort:**
  - Instant debounced multi-field search across titles, descriptions, and tags.
  - Multi-filtering by Status, Priority, Category, and Due Date.
  - Dynamic sorting by Newest, Oldest, Due Date, Priority rank, and Alphabetical order.
  - Responsive toggle between **Grid Card View** and **Table View**.
- **Security & Multi-Tenancy:**
  - User authentication powered by **Supabase Auth** (Sign Up, Sign In, Sign Out, Password Recovery).
  - PostgreSQL **Row Level Security (RLS)** ensuring users only query and mutate their own data.
  - Scoped Express client passing authenticated JWT tokens down to PostgreSQL.
  - Zero leakage of administrative service role keys on the frontend.
  - Instant One-Click **Demo Workspace** for rapid offline or sandbox testing.
- **Design & Experience:**
  - Clean SaaS aesthetic, rounded corners, subtle shadows, glassmorphism accents.
  - **Light Mode** default with persistent **Dark Mode** toggle.
  - Toast notification engine with success, warning, error, and info styles.
  - Reusable confirmation modal before destructive deletions.
  - 100% responsive for Desktop (>1024px), Tablet (768px–1024px), and Mobile (<768px) with a slide-out drawer sidebar.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | HTML5, CSS3 (Vanilla Design System), ES6+ Vanilla JavaScript, Fetch API |
| **Backend** | Node.js, Express.js, CORS, Dotenv |
| **Database & Auth** | Supabase PostgreSQL, Supabase Auth, Row Level Security (RLS) |
| **Styling** | Custom Vanilla CSS (Design Tokens, Responsive Breakpoints, Dark Mode) |

---

## 📂 Project Directory Structure

```
task-manager/
├── public/                     # Frontend Client
│   ├── index.html              # Marketing & Application Gateway
│   ├── login.html              # User Authentication Page
│   ├── register.html           # Account Registration Page
│   ├── reset-password.html     # Password Reset & Recovery
│   ├── dashboard.html          # Interactive Dashboard Overview
│   ├── tasks.html              # Full Task Management & Filter View
│   ├── task-details.html       # Deep-dive Task Inspection Page
│   ├── categories.html         # Custom Categories Manager
│   ├── css/
│   │   ├── style.css           # Design tokens, buttons, badges, modals, toasts
│   │   ├── dashboard.css       # App shell, sidebar, metrics, charts, task cards
│   │   └── responsive.css      # Tablet & mobile drawer media queries
│   └── js/
│       ├── utils.js            # Theme toggle, toast system, dates, confirmation
│       ├── auth.js             # Supabase Auth client, sessions, guards, demo
│       ├── api.js              # Authenticated fetch wrapper for Express API
│       ├── dashboard.js        # Dashboard statistics & visual progress charts
│       ├── tasks.js            # Task filtering, debouncing, modals & tag chips
│       └── categories.js       # Category CRUD & color presets
├── server/                     # Backend API
│   ├── server.js               # Express application entry point
│   ├── config/
│   │   └── supabase.js         # Supabase client & scoped JWT injector
│   ├── middleware/
│   │   ├── authMiddleware.js   # Bearer token verification
│   │   └── errorMiddleware.js  # 404 & global exception handling
│   ├── controllers/
│   │   ├── taskController.js   # Task filtering, search, and CRUD
│   │   ├── categoryController.js # Category CRUD
│   │   ├── dashboardController.js # Aggregated statistics and lists
│   │   └── tagController.js    # Tags aggregator
│   ├── routes/
│   │   ├── taskRoutes.js       # /api/tasks
│   │   ├── categoryRoutes.js   # /api/categories
│   │   ├── dashboardRoutes.js  # /api/dashboard
│   │   └── tagRoutes.js        # /api/tags
│   └── utils/
│       └── validation.js       # Payload sanitization & validation rules
├── supabase/
│   └── schema.sql              # Complete PostgreSQL schema, triggers & RLS policies
├── .env.example                # Template for environment variables
├── package.json                # Project dependencies and npm scripts
└── README.md                   # Full documentation
```

---

## 🚀 Getting Started Locally

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (version 18.x or later)
- An active [Supabase](https://supabase.com) account and project (free tier works great)

### 2. Clone and Install Dependencies
```bash
# Navigate to the project directory
cd "c:\Users\shyam\task manager"

# Install dependencies
npm install
```

### 3. Setup Supabase Database & RLS
1. Open your [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to the **SQL Editor** on the left menu.
3. Open `supabase/schema.sql` from this repository, copy all contents, and run it.
4. This script creates:
   - `profiles` table with automatic user creation triggers.
   - `categories` table with default seed categories (Work, Personal, Study, Finance, etc.).
   - `tasks` table with foreign keys, timestamps, and indexes.
   - `tags` and `task_tags` tables.
   - Comprehensive **Row Level Security (RLS)** policies guaranteeing privacy.

### 4. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Open `.env` and configure your credentials:
```env
PORT=3000
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_public_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

> **Security Note:**
> - `SUPABASE_ANON_KEY` is public and used for client token negotiation.
> - `SUPABASE_SERVICE_ROLE_KEY` is **server-only** and never exposed to the frontend.

### 5. Run the Server
For development with auto-reloading:
```bash
npm run dev
```

For production mode:
```bash
npm start
```

Visit the application at: **`http://localhost:3000`**

---

## ⚡ Instant Demo Mode (Zero-Config Testing)

If you wish to test the interface immediately before setting up a Supabase project:
1. Start the server (`npm run dev`).
2. Navigate to `http://localhost:3000/login.html`.
3. Click **"⚡ Explore in Demo Workspace"**.
4. The application will initialize an in-memory test workspace pre-populated with sample tasks, categories, and analytics!

---

## 📡 RESTful API Reference

All `/api/*` endpoints (except `/api/config` and `/api/health`) require the `Authorization: Bearer <JWT>` header.

### Tasks
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/tasks` | Get tasks. Query params: `search`, `status`, `priority`, `category_id`, `due_date_filter`, `sort_by` |
| `POST` | `/api/tasks` | Create task. Body: `{ title, description, status, priority, category_id, due_date, tags }` |
| `GET` | `/api/tasks/:id` | Retrieve single task with tags and category |
| `PUT` | `/api/tasks/:id` | Update task fields, status, or tags |
| `DELETE`| `/api/tasks/:id` | Delete task |

### Categories
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/categories` | Get user categories |
| `POST` | `/api/categories` | Create category `{ name, color }` |
| `PUT` | `/api/categories/:id` | Update category `{ name, color }` |
| `DELETE`| `/api/categories/:id` | Delete category |

### Dashboard & Analytics
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/dashboard` | Get aggregated counters, completion percentage, priority breakdown, today's and upcoming tasks |

### System & Health
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/config` | Exposes client-safe Supabase URL and Anon key |
| `GET` | `/api/health` | System health check and Supabase connectivity status |
| `GET` | `/api/profile` | Returns current user profile details |

---

## 🔒 Row Level Security (RLS) Explanation

In TaskFlow, data protection does not rely solely on the backend API:
1. Every query executed via the scoped Supabase client sends the user's authentic JWT bearer token.
2. PostgreSQL evaluates `auth.uid() = user_id` for every `SELECT`, `INSERT`, `UPDATE`, and `DELETE`.
3. Even if a user attempts to manually request `/api/tasks/another-user-task-id`, Supabase PostgreSQL drops the row at the database engine level, guaranteeing zero unauthorized data access.

---

## 🚢 Production Deployment

### Deploy to Render / Railway / Heroku / DigitalOcean:
1. Push your repository to GitHub.
2. Link your repository in Render or Railway as a **Web Service**.
3. Set build command: `npm install`
4. Set start command: `npm start`
5. Configure Environment Variables in the cloud dashboard:
   - `PORT=3000`
   - `SUPABASE_URL=...`
   - `SUPABASE_ANON_KEY=...`
   - `SUPABASE_SERVICE_ROLE_KEY=...`
6. Deploy! Your TaskFlow instance is live.
#   Y o g i t a  
 