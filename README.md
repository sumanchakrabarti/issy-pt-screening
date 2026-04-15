# IPT ACL Screening App

ACL screening and injury prevention web app for Issaquah Physical Therapy. Clinicians screen soccer athletes, score biomechanics, calculate injury risk, and generate PDF reports.

## Prerequisites

- **Node.js** >= 18.x ([download](https://nodejs.org/))
- **npm** >= 9.x (included with Node.js)
- **Git** (for cloning the repo)
- A modern browser (Chrome, Edge, Firefox, Safari)

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Database**: SQLite + Prisma ORM
- **Auth**: JWT with bcrypt

## Getting Started

```bash
# Install dependencies
npm install

# Run database migration
npm run db:migrate

# Seed with test data
npm run db:seed

# Start API (http://localhost:3001)
npm run api:dev

# Start web app (http://localhost:5173)
npm run web:dev
```

## Test Accounts

| Role | Email | Password | Notes |
|------|-------|----------|-------|
| Admin | `admin@issaquahpt.com` | `admin123!` | Full access — manages users, clinics, all data |
| Clinician | `clinician@issaquahpt.com` | `clinician123!` | Performs screenings, manages athletes |
| Coach | `coach@issaquahpt.com` | `coach123!` | Read-only access to assigned clubs |
| Parent | `parent@issaquahpt.com` | `parent123!` | Read-only access to assigned athletes (Emma Wilson) |

## Project Structure

```
packages/
├── api/          Express REST API
│   ├── src/
│   │   ├── routes/       API endpoints
│   │   ├── middleware/    Auth, role guards
│   │   └── services/     Risk calc, PDF, prescriptions
│   └── prisma/           Schema, migrations, seed
└── web/          React SPA
    └── src/
        ├── components/   Reusable UI components
        ├── pages/        Route pages
        ├── hooks/        Auth context
        ├── services/     API client, test definitions
        └── types/        TypeScript interfaces
```

## API Endpoints

| Group | Endpoints |
|-------|-----------|
| Auth | `POST /api/auth/login`, `POST /api/auth/register`, `GET /api/auth/me` |
| Clinics | `GET/POST/PUT/DELETE /api/clinics` |
| Clubs | `GET/POST/PUT/DELETE /api/clubs` |
| Teams | `GET/POST/PUT/DELETE /api/teams` |
| Athletes | `GET/POST/PUT/DELETE /api/athletes` |
| Sessions | `GET/POST/DELETE /api/sessions`, `POST /api/sessions/:id/scores`, `POST /api/sessions/:id/complete` |
| Reports | `GET /api/reports/sessions/:id/pdf`, `GET /api/reports/sessions/:id/export`, `GET /api/reports/sessions/export/csv` |
| Users | `GET/POST/PUT/DELETE /api/users` (admin only) |
| Relations | `GET/POST/DELETE /api/relations/coaches/:id/clubs/:id`, `GET/POST/DELETE /api/relations/parents/:id/athletes/:id` |
| Stats | `GET /api/stats` |
