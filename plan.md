# ACL Screening App — Implementation Plan

## Problem Statement
Build a web-first ACL screening and injury prevention app for Issaquah Physical Therapy. Clinicians screen soccer athletes, score biomechanics, capture video, calculate injury risk, and generate PDF reports. An admin dashboard provides oversight, referral tracking, and program management. All operations go through a REST API to support a future mobile app.

## Tech Stack
- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript (REST API)
- **Database**: SQLite + Prisma ORM (swap to Postgres for production)
- **Auth**: JWT with bcrypt password hashing, role-based claims
- **PDF generation**: Server-side (pdfkit or puppeteer)
- **Storage**: Local filesystem for MVP (swap to S3/Azure Blob later)
- **Future mobile**: React Native or native apps consuming the same REST API

## Monorepo Structure
```
IPT/
├── packages/
│   ├── api/          — Express REST API
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   ├── middleware/   (auth, roles, validation)
│   │   │   ├── services/     (business logic)
│   │   │   └── index.ts
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   └── package.json
│   └── web/          — React SPA
│       ├── src/
│       │   ├── components/
│       │   ├── pages/
│       │   ├── hooks/
│       │   ├── services/   (API client)
│       │   ├── types/
│       │   └── App.tsx
│       └── package.json
├── package.json       — workspace root
└── plan.md
```

---

## Phase 1 — Project Scaffolding & Auth
1. Initialize monorepo with npm workspaces
2. Scaffold Express API with TypeScript
3. Set up Prisma with SQLite, define User model
4. Implement auth endpoints: POST /auth/register, POST /auth/login
5. JWT middleware + role guard middleware
6. Scaffold React app with Vite + TypeScript
7. Build Login page, wire to API, store JWT
8. Protected route wrapper component

## Phase 2 — Data Model & API
1. Prisma schema for all entities:
   - User (id, email, passwordHash, role, clinicId)
   - Clinic (id, name, address)
   - Club (id, name, clinicId)
   - Team (id, name, clubId)
   - Athlete (id, firstName, lastName, dob, gender, medicalHistory, teamId)
   - ScreeningSession (id, athleteId, teamId, clubId, date, status)
   - ScoreRecord (id, sessionId, type, value, notes)
   - ExercisePrescription (id, sessionId, exercises)
2. REST endpoints for CRUD on each entity
3. Input validation middleware (zod)
4. Seed script for dev data

## Phase 3 — Team & Athlete Management UI
1. Dashboard page (summary cards)
2. Club list page (CRUD)
3. Team list page per club (CRUD)
4. Athlete roster page per team (CRUD)
5. Athlete profile page — demographics, medical history, session list

## Phase 4 — Screening Workflow
1. Create screening session page
2. Video capture component (MediaRecorder API — front + side)
3. Video upload to API endpoint → local storage
4. Movement scoring form (guided entry)
5. Strength & hop symmetry input form
6. Risk calculation service:
   - Low < 30, Moderate 30–49, High 50–69, Very High ≥ 70
   - Color-coded output + non-diagnostic disclaimer
7. Exercise prescription output

## Phase 5 — Reports & Export
1. Athlete report page (in-app summary)
2. PDF generation endpoint (GET /reports/:sessionId/pdf)
3. CSV / JSON export endpoints
4. Download / share UI

## Phase 6 — Admin Features
1. User management (invite, role assignment)
2. Clinic management
3. Analytics dashboard (charts, trends)
4. Audit logging

## Phase 7 — Polish, Testing & Deployment
1. Unit tests for risk calc, services, middleware
2. React component tests
3. E2E tests for screening workflow
4. HIPAA review (encryption, access controls)
5. Docker setup for deployment
6. README & deployment docs

---

## Key Considerations
- **API-first**: All logic lives in the API — frontend is a thin client
- **Non-diagnostic labeling**: All risk outputs must include disclaimer text
- **HIPAA**: Encrypt athlete data, enforce role-based access, audit logging
- **Offline-capable**: Service worker + local cache for field use (future)
- **Multi-session history**: Athletes accumulate sessions for trend tracking
- **Video storage**: Compression + retention policies
