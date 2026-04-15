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

## HIPAA Compliance — Encryption at Rest

### Current State (SQLite — Development)

SQLite is used for local development only. The `dev.db` file is **not encrypted**. Do not store real patient data in the development database.

### Production (Azure SQL Server)

The production database will be **Azure SQL Server** in a shared-tier configuration. Prisma supports SQL Server via the `sqlserver` provider.

**Migration steps:**

1. Update `packages/api/prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "sqlserver"
     url      = env("DATABASE_URL")
   }
   ```

2. Set the connection string environment variable:
   ```
   DATABASE_URL="sqlserver://your-server.database.windows.net:1433;database=ipt;user=your-user;password=your-password;encrypt=true;trustServerCertificate=false"
   ```

3. Regenerate and apply migrations:
   ```bash
   npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > init.sql
   npx prisma db push
   ```

**Encryption at rest** — Azure SQL Server enables Transparent Data Encryption (TDE) by default using service-managed keys (AES-256). Customer-managed keys (CMK) are available via Azure Key Vault for additional control.

**Video storage** — In production, migrate video uploads from local disk to **Azure Blob Storage** with server-side encryption enabled by default.

### Additional Recommendations

| Measure | Status | Notes |
|---------|--------|-------|
| Encryption at rest (DB) | ⬜ Production | Azure SQL TDE enabled by default |
| Encryption at rest (files) | ⬜ Production | Azure Blob Storage with SSE |
| Encryption in transit | ✅ | HTTPS required for all API traffic; Azure SQL enforces TLS |
| Password hashing | ✅ | bcrypt with 12 rounds |
| JWT authentication | ✅ | 24-hour token expiry |
| Role-based access control | ✅ | Admin, Clinician, Coach, Parent roles enforced server-side |
| Field-level encryption | ⬜ Optional | Consider for PII fields as defense-in-depth |
| Audit logging | ⬜ Planned | Log access to PHI; Azure SQL has built-in auditing |
| Backup encryption | ⬜ Production | Azure SQL automated backups are encrypted by default |
| BAA with Microsoft | ⬜ Production | Required before storing PHI in Azure |
