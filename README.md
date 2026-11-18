# CRM Contact Workspace

A small CRM app for viewing, searching, filtering, sorting, and updating contacts, plus tag management and contact activity tracking.

This repository contains two separate apps:

- `backend/` — Express + TypeScript API backed by SQLite
- `frontend/` — Next.js + React UI for the CRM workspace

## Overview

The app supports:

- Contact list view with search, filtering, sorting, and pagination
- Contact detail and edit form
- Tag management, including bulk tag assignment
- Recent activity feed per contact
- Optimistic concurrency protection using a `version` field

## Tech stack

### Backend

- Node.js 22+
- TypeScript
- Express
- SQLite via Node's built-in `node:sqlite`
- Zod validation
- Vitest + Supertest

### Frontend

- Next.js
- React 19
- TypeScript
- SCSS modules
- Vitest

## Project structure

```text
.
├── README.md
├── backend/
│   ├── data/
│   ├── scripts/
│   ├── src/
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── components/
│   ├── constants/
│   ├── hooks/
│   ├── pages/
│   ├── services/
│   ├── styles/
│   ├── tests/
│   ├── package.json
│   └── tsconfig.json
└── ...
```

## Requirements

- Node.js >= 22.5.0 for the backend
- Node.js >= 20 for the frontend

## Local setup

### 1) Backend

```bash
cd backend
npm install
cp .env.example .env
npm run seed
npm run dev
```

The API runs at `http://localhost:4000`.

Useful commands:

```bash
npm test
npm run build
```

### 2) Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at `http://localhost:3100`.

If you want to point the UI at a different API base URL, create a `frontend/.env.local` file:

```env
NEXT_PUBLIC_API_BASE_PATH=http://localhost:4000/api/v1
```

Useful commands:

```bash
npm test
npm run build
npm run validate
```

## API summary

Base path: `/api/v1`

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/contacts` | List contacts with filtering, sorting, pagination, and search |
| `GET` | `/contacts/:id` | Fetch one contact |
| `PATCH` | `/contacts/:id` | Update a contact |
| `POST` | `/contacts/:id/tags` | Add a tag to a contact |
| `DELETE` | `/contacts/:id/tags/:tagId` | Remove a tag from a contact |
| `POST` | `/contacts/bulk/tags` | Assign one tag to many contacts |
| `GET` | `/contacts/:id/activity` | Fetch recent contact activity |
| `GET` | `/tags` | List available tags |

## Concurrency handling

Contact updates include a `version` value. The backend rejects stale updates with a `409` conflict if the version no longer matches the current row. This prevents accidental overwrites when two users edit the same contact around the same time.

## Database notes

The backend stores data in SQLite at `backend/data/dev.db` after seeding. The schema includes contacts, tags, join records, and an activity log.

## Notes

- The project was intentionally structured as a full-stack monorepo with separate backend and frontend apps.
- The frontend uses a query-based route for contact details and is deployed as a normal Next.js application on Vercel.
- The backend uses plain parameterized SQL instead of an ORM.

## License

This project is for assignment/demo purposes and is not intended as a production-ready CRM system without further review and hardening.

## Known issues / incomplete functionality

- **Deployed link's data is ephemeral.** See "Deployment" above — Render's free tier has no persistent disk, so the SQLite file resets to the seeded dataset on every cold start. Intentional trade-off for a free demo link, not a bug.

## Deployment

Backend → **Render** (requires a persistent Node process, not a static host).

Frontend → **Vercel** (Next.js application).

Deploy in this order because each side requires the other's final URL.

**1. Backend first**

- Push the repository to GitHub.
- Open Render.
- Select New → Blueprint.
- Connect the GitHub repository.
- Render should detect `render.yaml` at the repository root.
- The configuration defines the root directory, build/start commands, and environment variables.
- Render provides a backend URL similar to:
  `https://crm-contacts-backend.onrender.com`

- Verify that `GET /health` returns:

```json
{"status":"ok"}
```

**2. Frontend next**

- Open Vercel.
- Select New Project.
- Import the same GitHub repository.
- Set Root Directory to `frontend`.
- Configure the following environment variable:
  `NEXT_PUBLIC_API_BASE_PATH`

- Set its value to:

  `https://<your-render-url>/api/v1`

- Replace the placeholder with the actual Render backend URL.
- Deploy the frontend.
- Vercel will provide a URL similar to:
  `https://crm-contact-workspace.vercel.app`

**3. Configure CORS**

- Return to the Render dashboard.
- Open the backend service's environment variables.
- Set `CORS_ORIGIN` to the actual deployed Vercel frontend URL.

Example:

```text
https://crm-contact-workspace.vercel.app
```

- Save the environment variable.
- Render should automatically redeploy the backend.
- Verify that frontend API requests work without CORS errors.

### Known limitation of this deployment setup

Render's free tier does not provide a persistent disk by default and may spin down the service after inactivity.

The SQLite database file resets to the seeded 220 contacts whenever the service restarts.

This is expected and useful for a demo deployment because it provides a clean and consistent dataset.

However, edits made through the deployed application will not survive a cold start.

Local development is unaffected because `data/dev.db` persists normally on the local disk.

## Data model

The SQLite database contains:

- `contacts` — contact details and an optimistic-concurrency `version`
- `tags` — unique tag names
- `contact_tags` — many-to-many join records between contacts and tags
- `activity` — contact update, tag-addition, and tag-removal events

The full schema is implemented in `backend/src/db/client.ts`.
