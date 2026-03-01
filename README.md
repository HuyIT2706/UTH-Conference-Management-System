# UTH Conference Management System (ConFMS)

A comprehensive conference management system built with microservices architecture, designed to streamline the process of organizing academic conferences, managing paper submissions, and facilitating peer reviews.

##  Overview

UTH ConFMS is a full-stack application providing an end-to-end solution for academic conference management. The system supports multiple user roles (Admin, Reviewer, Author) and handles the complete lifecycle from Call for Papers (CFP) to final publication decisions.

##  Architecture

The system is built using a **microservices architecture** to ensure scalability and maintainability:

```text
┌─────────────┐
│   Client    │ (React + Vite)
│  Port: 5173 │
└──────┬──────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│                 API Gateway (Port 3000)                  │
└──────────────────────────────────────────────────────────┘
       │
       ├──────────┬──────────┬──────────┬──────────┬──────────┐
       ▼          ▼          ▼          ▼          ▼          ▼
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ Identity │ │Conference│ │Submission│ │  Review  │ │    AI    │
│ Service  │ │ Service  │ │ Service  │ │ Service  │ │ Service  │
│Port: 3001│ │Port: 3002│ │Port: 3003│ │Port: 3004│ │Port: 3005│
└────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘
     │            │            │            │            │
     └────────────┴────────────┴────────────┴────────────┘
                               ▼
                     ┌──────────────────┐
                     │    PostgreSQL    │
                     │  (Micro-DBs)     │
                     └──────────────────┘
```
### Service Responsibilities

- API Gateway: Centralized entry point, routes requests to appropriate microservices.
- Identity Service: User authentication (JWT), authorization, and user management.
- Conference Service: Conference creation, CFP configurations, and track management.
- Submission Service: Paper submission, versioning, and file management (via Supabase).
- Review Service: Peer review workflow, assignments, grading, and decision management.
- AI Service: AI-assisted grammar checking and abstract summarization for authors.

## ✨ Features

* **For Admin:** Create conferences, configure deadlines (CFP), manage users, and view statistics.
* **For Authors:** Browse conferences, submit papers, track status, and receive notifications.
* **For Reviewers:** View assigned submissions, grade papers, and submit reviews.

## 🛠️ Tech Stack

* **Backend:** NestJS, Node.js, PostgreSQL, TypeORM, RESTful APIs.
* **Frontend:** ReactJS, TypeScript, TailwindCSS, Redux Toolkit (RTK Query), Vite.
* **DevOps:** Docker, Docker Compose, GitHub Actions (CI/CD), Vercel.
* **Integrations:** Supabase (Cloud Storage), AI APIs.

---

## 🚀 Quick Start

Get the system running in 2 simple steps.
### 1. Environment Configuration (Important)
Before running, create a .env file in the root directory (or copy from example if available):
```bash
# --- APPLICATION ---
# --- APPLICATION ---
APP_NAME=UTH ConfMS
APP_BASE_URL=http://localhost:5173
PORT_API_GATEWAY=3000

# --- DATABASE (Default) ---
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=admin
DB_PASSWORD=admin123
DB_DATABASE_IDENTITY=db_identity
DB_DATABASE_CONFERENCE=db_conference
DB_DATABASE_SUBMISSION=db_submission
DB_DATABASE_REVIEW=db_review
DB_DATABASE_AI=db_ai

# --- JWT AUTH (Dev defaults) ---
JWT_ACCESS_SECRET=uth-confms-dev-access-secret-123
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=uth-confms-dev-refresh-secret-123
JWT_REFRESH_EXPIRES_IN=7d

# 1. Supabase (File Storage)
SUPABASE_URL=YOUR_SUPABASE_URL
SUPABASE_KEY=YOUR_SUPABASE_KEY
SUPABASE_BUCKET_NAME=submission

# 2. Email (Gmail App Password)
EMAIL_USER=YOUR_EMAIL
EMAIL_PASS=YOUR_APP_PASSWORD
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587

# --- SYSTEM FLAGS ---
TYPEORM_SYNCHRONIZE=true
TYPEORM_LOGGING=false
DOCKER_ENV=false
```

### 2. Start Backend (Docker)

All backend microservices and databases are containerized.

**Requirement:** Ensure you have `Docker` and `Docker Compose` installed.

```bash
# Start all backend services and databases
docker-compose up --build -d

# Check status
docker-compose ps
```
### 3. Start Frontend
```bash
cd Frontend 

npm install

npm run dev
```
### 4. Accout test
```bash
       Chair: huybv1477@gmail.com/ huybv123

       Reviewer: buivanhuy2706tb@gmail.com / huybv123

       Student: huybv1177@gmail.com/ huyech123

       Các tài khoản test deploy
```
## 🌐 Access Points

After starting the services:

- **Frontend**: http://localhost:5173
- **API Gateway**: http://localhost:3000
- **Identity Service**: http://localhost:3001
- **Conference Service**: http://localhost:3002
- **Submission Service**: http://localhost:3003
- **Review Service**: http://localhost:3004
- **Al Service**: http://localhost:3005
- **Swagger API Docs**: 
  - http://localhost:3001/api (Identity)
  - http://localhost:3002/api (Conference)
  - http://localhost:3003/api (Submission)
  - http://localhost:3004/api (Review)
  - http://localhost:3005/api (AI)

## 📁 Project Structure

```
uth-confms/
├── Backend/                       # Backend microservices workspace
│   ├── api-gateway/              # Centralized API routing
│   ├── identity-service/         # Authentication & User management
│   ├── conference-service/       # Conference & Track management
│   ├── submission-service/       # Submissions & Storage management
│   ├── review-service/           # Review logic & Assignments
│   └── ai-service/               # AI integration (Grammar, Summary)
├── Frontend/                      # Frontend React application
│   ├── src/
│   │   ├── api/                  # Axios & Interceptors
│   │   ├── components/           # Reusable UI Components (Admin, Reviewer, Student)
│   │   ├── pages/                # Role-based pages
│   │   ├── redux/                # Store config & RTK Query APIs
│   │   ├── routing/              # RoleProtectedRoute configurations
│   │   └── utils/                # Constants & Helpers
├── database/                      # Database initialization scripts (SQL)
├── docker-compose.yml            # Docker orchestration config
├── package.json                  # Workspace dependencies
└── README.md                     # Project documentation
```

## Support

buivanhuy2706@gmail.com
---

## Happy Coding!
