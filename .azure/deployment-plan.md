# Azure Deployment Plan — IPT ACL Screening App

**Status:** In Progress — Generating Artifacts

## Azure Context

| Setting | Value |
|---------|-------|
| Subscription | **IPTScreening** (`789044f6-8d42-4e17-9582-0f1c5ccf028d`) |
| Tenant | `06b0bff6-e8d5-4b97-8f55-54004ccf40a6` |
| Region | **West US 3** (`westus3`) |
| Resource Group | **Existing** `IPTScreening-rg` |

## 1. Workspace Analysis

- **Mode:** MODIFY (existing monorepo, no Azure config yet)
- **Structure:** npm workspaces monorepo — `packages/api`, `packages/web`

## 2. Requirements

- Clinical screening app for Issaquah PT; handles PHI (HIPAA-relevant).
- Two deployable units: REST API + React SPA.
- Persistent storage for SQLite DB and uploaded videos.
- **Database decision (user):** Keep **SQLite on a persistent volume** for now (fastest path). Documented as not ideal for PHI/scale — Azure SQL migration is a planned follow-up.

## 3. Codebase Scan

| Component | Tech | Notes |
|-----------|------|-------|
| `packages/api` | Node 20 + Express + TypeScript + Prisma | Port 3001, JWT auth, PDF (pdfkit), video uploads via multer to local `uploads/` |
| `packages/web` | React 19 + Vite + TypeScript | Static SPA build → `dist/` |
| Database | SQLite (Prisma) | `schema.prisma` hardcodes `file:./dev.db` |

**Hardcoded values that must become configurable:**
- API base URL `http://localhost:3001` in `web/src/services/api.ts`, `components/VideoCapture.tsx`, `pages/SessionDetailPage.tsx`, `pages/SessionsPage.tsx`
- CORS origin `http://localhost:5173` in `api/src/index.ts`
- Uploads dir `../../uploads` in `api/src/routes/videos.ts`
- `DATABASE_URL` hardcoded in `schema.prisma`

## 4. Recipe Selection

**Recipe: AZD (Bicep)**

Rationale: multi-service app, want simple `azd up` deploy, auto build/deploy pipeline, native support for both App Service and Static Web Apps hosts.

## 5. Architecture

| Component | Azure Service | Config |
|-----------|---------------|--------|
| **API** (`packages/api`) | **Azure App Service** (Linux, container) | B1 plan, single instance (SQLite = no concurrent writers). Persistent `/home` storage for SQLite DB + video uploads. Health check `/api/health`. |
| **Web** (`packages/web`) | **Azure Static Web Apps** | Free/Standard tier. Vite build; SPA fallback routing. `VITE_API_URL` set to API host at build time. |
| Logs/metrics | **Log Analytics + App Insights** | Basic monitoring for the API. |

**Persistence strategy (SQLite):**
- App Service Linux with `WEBSITES_ENABLE_APP_SERVICE_STORAGE=true` → `/home` is durable (Azure Files backed).
- SQLite DB at `/home/data/prod.db`; uploads at `/home/data/uploads`.
- App Service plan pinned to **1 instance** (no scale-out) to avoid SQLite lock corruption.

**Networking / CORS:**
- API `CORS_ORIGIN` app setting = Static Web App URL.
- Web `VITE_API_URL` = `https://<api-app>.azurewebsites.net/api`.
- Both hostnames are Bicep outputs, wired automatically.

### Required code changes (Phase 2)

1. **`api/src/index.ts`** — bind `0.0.0.0`; `app.set('trust proxy', 1)` in prod; CORS origin from `CORS_ORIGIN` env (comma-separated, fallback localhost).
2. **`api/prisma/schema.prisma`** — `url = env("DATABASE_URL")`.
3. **`api/src/routes/videos.ts`** — uploads dir from `UPLOAD_DIR` env (fallback to current path).
4. **`web` API URLs** — replace hardcoded `http://localhost:3001` with `import.meta.env.VITE_API_URL` (fallback `http://localhost:3001`). Add central `apiBase` helper.
5. **`packages/api/Dockerfile`** + `.dockerignore` — multi-stage build (install workspace deps, `prisma generate`, `tsc`); entrypoint runs `prisma migrate deploy` then `node dist/index.js`.
6. **`packages/web/staticwebapp.config.json`** — SPA fallback + basic security headers.
7. **`azure.yaml`** — two services: `api` (host: appservice) and `web` (host: staticwebapp).
8. **`infra/`** — Bicep: App Service plan + Web App (container), Static Web App, Log Analytics, App Insights, app settings/outputs. Target existing `IPTScreening-rg`.

### App settings (API)

| Name | Value |
|------|-------|
| `DATABASE_URL` | `file:/home/data/prod.db` |
| `JWT_SECRET` | generated secret (Bicep secure param / azd env) |
| `CORS_ORIGIN` | Static Web App URL |
| `UPLOAD_DIR` | `/home/data/uploads` |
| `NODE_ENV` | `production` |
| `WEBSITES_ENABLE_APP_SERVICE_STORAGE` | `true` |
| `WEBSITES_PORT` | `3001` |

## 6. Cost Estimate (rough, monthly)

| Resource | SKU | Est. |
|----------|-----|------|
| App Service Plan | B1 Linux | ~$13 |
| Static Web App | Free (or Standard ~$9) | $0–9 |
| Log Analytics + App Insights | Pay-as-you-go (low volume) | ~$0–5 |
| **Total** | | **~$13–27/mo** |

## 7. Deployment Flow

1. `azure-prepare` (this) → generate code changes + `infra/` + `azure.yaml`
2. `azure-validate` → validate Bicep + config
3. `azure-deploy` → `azd up` into `IPTScreening-rg`

## 8. Known Limitations / Follow-ups

- SQLite + single instance = **no horizontal scale** and a single point of failure. Migrate to **Azure SQL (TDE)** or **PostgreSQL Flexible Server** before storing real PHI.
- Video uploads on App Service storage → migrate to **Azure Blob Storage** for durability/scale.
- Add **Key Vault** for `JWT_SECRET` and a **BAA with Microsoft** before production PHI.
