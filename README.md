# Adaptive Skill Assessment and Learning Recommendation System

An adaptive learning application that assesses technical skills, identifies weak topics, and produces personalized learning recommendations. It includes a React student/admin frontend, an Express and MySQL API, and a separate Java engine module for assessment logic experiments.

## Problem Solved

Traditional assessments often provide only a score. This project connects assessment answers to topic-level performance so students can see where they need practice and receive targeted recommendations.

## Features

### Student Features

- Register and sign in with JWT authentication.
- Browse subjects and topics.
- Start an assessment with a selected question count.
- Answer questions one at a time and resume in-progress assessments.
- View score, percentage, assessment level, topic performance, answer review, and recommendations.
- Review assessment history and learning-summary metrics.
- View deduplicated recommendations for weak areas.

### Admin Features

- Sign in using an `ADMIN` account.
- View subject, topic, and question counts.
- Create subjects and topics.
- Create, edit, delete, and filter questions by subject, topic, and difficulty.
- Access admin-only routes through role-based protection.

## Technology Stack

- Frontend: React 18, React Router 6, Axios, Vite
- Backend: Node.js, Express, MySQL, `mysql2`, JWT, `bcryptjs`
- Database: MySQL
- Optional engine module: Java 17 Maven project under `java-engine/`

## Architecture

```text
React/Vite client
	-> Axios API client with JWT bearer token
Express server
	-> routes -> controllers -> services
	-> MySQL connection pool
MySQL database
```

The `client/` application owns pages, route guards, authentication context, API clients, and UI state. The `server/` application exposes the REST API. Routes apply authentication and role middleware before controllers call the service layer. The `java-engine/` directory contains a separate Maven module; the current `javaEngineService.js` is a placeholder and is not required to run the main Node/MySQL application.

## Project Structure

```text
client/
	src/
		api/             Axios client and token handling
		components/      Shared layout and error fallback components
		context/         React authentication context
		pages/           Student, admin, login, and registration screens
		routes/          Protected route wrapper
		services/        Student and admin API wrappers
server/
	src/
		config/          MySQL pool configuration
		controllers/     HTTP validation and response handling
		middleware/      JWT authentication and role authorization
		routes/          Express route definitions
		services/        Authentication, assessment, question, subject, and recommendation logic
	scripts/           Development admin bootstrap script
database/
	schema.sql         Database and table definitions
	seed.sql           Development seed data
docs/
	api-design.md      API reference
	er-diagram.md      Database relationships
java-engine/         Separate Maven/Java 17 engine module
```

## Prerequisites

- Node.js 18 or newer
- npm
- MySQL 8 or compatible MySQL server
- Java 17 and Maven only if working on `java-engine/`

## Installation

```powershell
cd "C:\path\to\Assessment learning and recommendation\server"
npm install

cd "C:\path\to\Assessment learning and recommendation\client"
npm install
```

## Database Setup

```powershell
mysql -u root -p < database/schema.sql
mysql -u root -p adaptive_skill_assessment < database/seed.sql
```

`schema.sql` recreates the database with `DROP DATABASE IF EXISTS`; use it only when a reset is intended. The seed file contains development data and should not be used as production data.

## Environment Configuration

Copy `server/.env.example` to `server/.env` and set local values. Do not commit `.env` or put real credentials in documentation.

```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=adaptive_skill_assessment
DB_CONNECTION_LIMIT=10
JWT_SECRET=replace_with_a_long_random_secret
ADMIN_EMAIL=admin@adaptive.com
ADMIN_NAME=Admin User
ADMIN_PASSWORD=
```

`ADMIN_PASSWORD` is used only by the optional development admin bootstrap command. Public registration always creates a `STUDENT` account.

## Run the Backend

```powershell
cd "C:\path\to\Assessment learning and recommendation\server"
npm start
```

The API runs at `http://localhost:5000`. Development mode uses `npm run dev`.

To create or update a development admin account:

```powershell
$env:ADMIN_PASSWORD="choose-a-local-password"
npm run seed:admin
Remove-Item Env:ADMIN_PASSWORD
```

## Run the Frontend

```powershell
cd "C:\path\to\Assessment learning and recommendation\client"
npm run dev
```

Vite normally serves the application at `http://localhost:5173`. The frontend defaults to `http://localhost:5000/api` for backend requests. To use another API URL, copy `client/.env.example` to `client/.env` and set `VITE_API_BASE_URL`; this file is ignored by Git.

## Workflows

### Student Workflow

1. Register or sign in.
2. Open the student dashboard.
3. Choose a subject and question count.
4. Answer and submit the assessment.
5. Review results, weak topics, history, and recommendations.

### Admin Workflow

1. Sign in with an account whose database role is `ADMIN`.
2. Review catalog counts on the admin dashboard.
3. Add subjects and topics.
4. Add questions linked to valid subjects and topics.
5. Edit, filter, or delete question-bank entries.

## API and Database Reference

See [docs/api-design.md](docs/api-design.md) for the route reference and [docs/er-diagram.md](docs/er-diagram.md) for database tables and relationships.

## Validation

```powershell
cd "C:\path\to\Assessment learning and recommendation\client"
npm run build

Invoke-RestMethod http://localhost:5000/api/health
```

The health endpoint reports both server and database status.

## Security Notes

- Passwords are stored as bcrypt hashes.
- JWTs are returned by login and sent as bearer tokens by the frontend.
- `STUDENT` and `ADMIN` roles are enforced in both frontend route guards and backend middleware.
- Environment files, dependency directories, build output, logs, Java targets, and coverage output are ignored by Git.
- Replace development secrets and credentials before deploying.

## Deployment Guidance

This repository is deployment-ready but is not deployed by this project. Deploy the backend and frontend separately, provide environment variables through the hosting provider, and configure the frontend to use the deployed backend URL.

Backend production settings:

- Set `PORT` to the host-provided port when required.
- Set `CORS_ORIGIN` to the frontend origin. Multiple comma-separated origins are supported.
- Set `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, and `DB_CONNECTION_LIMIT` for the managed MySQL instance.
- Set a long, private `JWT_SECRET`.
- Do not run the destructive `database/schema.sql` reset against production data.
- Run `npm start` from `server/`.

Frontend production settings:

- Set `VITE_API_BASE_URL` to the deployed backend API base URL, including `/api`.
- Run `npm run build` from `client/` and serve the generated `dist/` directory with SPA fallback support.
- Configure the host to forward unknown frontend routes to `index.html` so React Router routes continue to work after refresh.

## Resume and Interview Summary

**Project:** Adaptive Skill Assessment and Learning Recommendation System

**Summary:** Built a full-stack assessment platform that converts question-level responses into topic performance and personalized learning recommendations.

**Key contributions:** Implemented JWT authentication, student/admin role protection, assessment lifecycle and scoring, topic-level performance analysis, recommendation generation, admin question-bank CRUD, responsive React workflows, and production-oriented error/loading handling.

**Technical challenges solved:** Kept client and server route contracts aligned, protected answer data from student question responses, handled duplicate assessment actions and expired sessions, and diagnosed stale backend processes during API validation.

**Interview focus:** Explain the request flow from React page to Axios client, Express route/controller/service, MySQL transaction, and result/recommendation response. Be clear that the Java module is currently separate and its Node integration service remains a placeholder.
