# UTH Conference Management System (ConFMS)

A comprehensive conference management system built with microservices architecture, designed to streamline the process of organizing academic conferences, managing paper submissions, and facilitating peer reviews.

##  Overview

UTH ConFMS is a full-stack application providing an end-to-end solution for academic conference management. The system supports multiple user roles (Admin, Reviewer, Author) and handles the complete lifecycle from Call for Papers (CFP) to final publication decisions.

##  Architecture

The system is built using a **microservices architecture**:

```
┌─────────────┐
│   Client    │ (React + Vite)
│  Port: 5173 │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│          API Gateway (Port 3000)            │
└─────────────────────────────────────────────┘
       │
       ├──────────┬──────────┬──────────┬──────────┐
       ▼          ▼          ▼          ▼          ▼
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ Identity │ │Conference│ │Submission│ │  Review  │
│ Service  │ │ Service  │ │ Service  │ │ Service  │
│Port: 3001│ │Port: 3002│ │Port: 3003│ │Port: 3004│
└────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘
     │            │            │            │
     └────────────┴────────────┴────────────┘
                      ▼
            ┌──────────────────┐
            │   PostgreSQL     │
            │  (4 Databases)   │
            └──────────────────┘
```

### Service Responsibilities

- **API Gateway**: Routes requests to appropriate microservices
- **Identity Service**: User authentication, authorization, and user management
- **Conference Service**: Conference creation, CFP management, and notifications
- **Submission Service**: Paper submission and file management (via Supabase)
- **Review Service**: Peer review workflow and decision management

## ✨ Features

* **For Admin:** Create conferences, configure deadlines (CFP), manage users, and view statistics.
* **For Authors:** Browse conferences, submit papers, track status, and receive notifications.
* **For Reviewers:** View assigned submissions, grade papers, and submit reviews.

## 🛠️ Tech Stack

* **Backend:** NestJS, PostgreSQL, TypeORM, Redis (Cache), Docker.
* **Frontend:** React 19, TypeScript, TailwindCSS v4, Redux Toolkit, Vite.
* **DevOps:** Docker & Docker Compose, GitHub Actions.

---

## 🚀 Quick Start

Get the system running in 2 simple steps.
### 1. Environment Configuration (Important)
Before running, create a .env file in the root directory (or copy from example if available):
```bash
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

# --- JWT AUTH (Dev defaults) ---
JWT_ACCESS_SECRET=uth-confms-dev-access-secret-123
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=uth-confms-dev-refresh-secret-123
JWT_REFRESH_EXPIRES_IN=7d

# 1. Supabase (File Storage)
SUPABASE_URL=
SUPABASE_KEY=
SUPABASE_BUCKET_NAME=submission

# 2. Email (Gmail App Password)
EMAIL_USER=
EMAIL_PASS=
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
cd client 

npm install

npm run dev
```
### 4. Accout test
```bash
       Chair: huybv1477@gmail.com/ huybv123

       Reviewer: buivanhuy2706tb@gmail.com / huybv123

       Student: huybv1177@gmail.com/ huyech123
```
## 🌐 Access Points

After starting the services:

- **Frontend**: http://localhost:5173
- **API Gateway**: http://localhost:3000
- **Identity Service**: http://localhost:3001
- **Conference Service**: http://localhost:3002
- **Submission Service**: http://localhost:3003
- **Review Service**: http://localhost:3004
- **Swagger API Docs**: 
  - http://localhost:3001/api (Identity)
  - http://localhost:3002/api (Conference)
  - http://localhost:3003/api (Submission)
  - http://localhost:3004/api (Review)

## 📁 Project Structure

```
uth-confms-private/
├── apps/                          # Backend microservices
│   ├── api-gateway/              # API Gateway service
│   ├── identity-service/         # Authentication & user management
│   ├── conference-service/       # Conference management
│   ├── submission-service/       # Paper submission handling
│   └── review-service/           # Review workflow
├── client/                        # Frontend React application
│   ├── src/
│   │   ├── api/                  # API client configurations
│   │   ├── components/           # Reusable React components
│   │   ├── pages/                # Page components
│   │   │   ├── admin/           # Admin pages
│   │   │   ├── auth/            # Authentication pages
│   │   │   ├── reviewer/        # Reviewer dashboard
│   │   │   └── student/         # Author/student pages
│   │   ├── redux/               # Redux store & slices
│   │   ├── routing/             # Route configurations
│   │   └── utils/               # Utility functions
├── database/                      # Database initialization scripts
├── docker-compose.yml            # Docker orchestration
├── package.json                  # Backend dependencies
└── README.md                     # This file
```

## Support

-buivanhuy2706@gmail.com
---

## Happy Coding!
