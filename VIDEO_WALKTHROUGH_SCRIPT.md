# CRM Contact Workspace — 5–8 Minute Video Walkthrough

## 1. Introduction

**[Screen: Open the deployed CRM Contact Workspace dashboard]**

Hello, and welcome to the CRM Contact Workspace. This project is a full-stack contact management application for browsing, searching, filtering, and updating a seeded CRM contact dataset.

The repository contains two independently deployable applications: a Next.js frontend and an Express and TypeScript backend. The backend uses SQLite through Node.js's built-in `node:sqlite` module. The frontend uses React 19, Next.js static export, TypeScript, and SCSS modules.

## 2. Application Overview

**[Screen: Contact list]**

The main dashboard lists contacts in a responsive layout. A table is used on larger screens, while the card layout provides a more practical mobile experience.

**[Screen action: Type in search and wait for results]**

Search is debounced for 300 milliseconds before it updates the URL and requests new data. This avoids an API call on every individual keystroke. Search works across contact information expected by the application, including names, email, and phone.

**[Screen action: Apply a tag and company filter]**

The list also supports tag and company filtering together with sorting. Because the list state is serialized into the URL, refreshing or sharing the page preserves the current search, filters, sorting, and pagination.

**[Screen action: Change sorting and use pagination]**

Sorting and pagination are handled by the backend and remain synchronized with URL state. Filters reset the page to page one so that a user is not left on an invalid page after changing the view.

**[Screen action: Open a contact]**

Select a contact to open its detail view. The page shows the contact's editable details, assigned tags, and recent activity.

## Contact Editing and Existing CRUD Scope

**[Screen action: Edit a field and save]**

The contact form supports editing first name, last name, email, phone, and company. The form performs client-side validation and the backend applies server-side validation as well. Successful edits update the contact and add an entry to the activity feed.

This assignment implementation does not provide a contact creation or deletion flow. Contact records originate from the backend seed script. Contact management is therefore focused on listing, viewing, editing, tagging, bulk tagging, and activity tracking, rather than creation and deletion.

**[Screen action: Tag and untag a contact]**

Tags can be added or removed on the detail page. The backend creates a missing tag if a new tag name is submitted, while existing tag names reuse the existing tag record.

**[Screen action: Select several contacts and assign a tag]**

The list includes bulk selection and a bulk-tag action. The backend assigns the requested tag idempotently, so already-tagged contacts are skipped rather than duplicated.

**[Screen action: Show the activity feed]**

The activity feed shows contact updates and tag additions or removals. It is presented newest first and refreshed after relevant changes.

## 3. Technical Architecture

**[Screen: Briefly show the frontend and backend folders]**

The frontend follows a conventional Next.js Pages Router structure. Components render presentation, hooks manage request state and page behavior, services construct API requests, models normalize API data, and utility modules handle URL parsing and validation.

The backend is organized around Express route modules, service modules, validation schemas, middleware, and a database client. API routes are grouped under `/api/v1` for contacts and tags.

**[Screen action: Show openapi.yaml or API documentation route]**

The backend provides an interactive OpenAPI documentation interface at `/api-docs` locally, and a JSON OpenAPI document at `/openapi.json`. Core endpoints include contact listing and detail retrieval, contact updates, tag operations, bulk tagging, and activity retrieval.

The SQLite schema represents contacts, tags, a many-to-many contact-tag join table, and an activity table. Contacts include a numeric `version` used for optimistic concurrency. Updates are sent as parameterized SQL operations and email uniqueness is enforced in the database.

## 4. Important Features

**[Screen action: Demonstrate an invalid form field]**

The form reports required, email, phone, and length validation errors next to the relevant fields. The API also validates requests, preventing invalid or duplicate-email updates independently of the frontend.

**[Screen action: Demonstrate unsaved-change navigation]**

If an edit form has unsaved changes, the application warns before in-app navigation and before closing or refreshing the browser. Pending edits remain in the form until the user saves or leaves after confirming the warning.

**[Screen action: Demonstrate the conflict flow with two browser contexts]**

For concurrent editing, the contact page uses a version token. If another request changes the contact before this page saves, the backend returns `409` with `VERSION_CONFLICT` and the latest contact record.

The application opens a conflict dialog that shows the user's draft beside the latest server values. The user can reload the latest record or explicitly overwrite it with the draft. Reload discarding is not automatic, and the user must choose how to resolve the conflict.

**[Screen action: Show tests or run the test commands]**

The backend has Vitest and Supertest coverage for contact filtering, sorting, pagination, concurrency, tags, and activity. The frontend has Vitest coverage for models, API services, query parsing, validation, and utility behavior.

## 5. Deployment

**[Screen: Show the repository deployment configuration files]**

The repository includes `render.yaml` for the backend blueprint and `frontend/vercel.json` for the static Next.js export.

**[Screen: Render dashboard]**

The backend is deployed to Render as a persistent Node web process. Render runs the seed script and TypeScript build before starting `npm start`. `/health` is used as the service health check and returns `{"status":"ok"}`.

The backend deployment URL is then used as the frontend API base URL through `NEXT_PUBLIC_API_BASE_PATH`.

**[Screen: Vercel dashboard]**

The frontend is deployed separately through Vercel with `frontend` set as the project root. Next.js produces the static export in `build/`, and Vercel serves that output.

**[Screen: Environment variable and CORS settings]**

After the frontend URL is available, set Render's `CORS_ORIGIN` environment variable to that exact Vercel origin. Render redeploys and the browser is then allowed to call the deployed API.

Because this demo backend uses Render's free tier and SQLite, the database is not guaranteed to remain persistent. A cold start or restart may reseed the database, resetting edits to the original 220 contacts. Local development uses `backend/data/dev.db` and retains local changes normally.

## 6. Conclusion

**[Screen: Final dashboard and deployed application]**

In summary, the CRM Contact Workspace demonstrates server-side list operations, URL-backed state, responsive contact management, debounced search, validation, optimistic concurrency, tags, bulk actions, and activity tracking.

It combines a maintainable React and Next.js frontend with a compact TypeScript and SQLite backend. The implementation is designed as a clear full-stack assignment demo, with explicit deployment trade-offs documented for GitHub and deployment reviewers.

Thank you for watching the walkthrough.
