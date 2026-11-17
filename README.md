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
- The frontend is a static export build and uses a query-based route pattern to avoid runtime-only dynamic path generation.
- The backend uses plain parameterized SQL instead of an ORM.

## License

This project is for assignment/demo purposes and is not intended as a production-ready CRM system without further review and hardening.
