**# CRM Contact Workspace**



A simplified CRM contact workspace: browse, search, filter, sort, and paginate contacts; view and

edit a contact; manage tags (including bulk assignment); and see a contact's recent activity.

Built for the SDE2/SDE3 full-stack take-home assignment (domain: CRM – Contacts).



Two independent, separately-runnable projects:



\`\`\`

backend/    Node.js + TypeScript + Express + SQLite (node:sqlite) — the REST API

frontend/   Next.js (pages router) + React 19 + TypeScript — the UI

\`\`\`



See [\`PROJECT_IMPLEMENTATION_PLAN.md\`]\(PROJECT_IMPLEMENTATION_PLAN.md) for the full requirement

analysis, architecture, and task breakdown this was built from.



**## Tech stack**



**\*\*Backend:\*\*** Node.js, TypeScript, Express, Zod (validation), Node's built-in \`node:sqlite\`

(\`DatabaseSync\`) for persistence — see [Why not Prisma?]\(#why-not-prisma) below. Tests: Vitest +

Supertest.



**\*\*Frontend:\*\*** Next.js (pages router), React 19, **\*\*TypeScript\*\***, SCSS Modules. No data-fetching

library (TanStack Query, SWR, etc.) and no form library (React Hook Form, Zod on the client) — see

[Why does the frontend look like this?]\(#why-does-the-frontend-look-like-this) below. Tests:

Vitest, scoped to \`models/\`, \`services/\`, \`utils/\`.



**## Running it**



Requires **\*\*Node.js ≥ 22.5\*\*** (the backend uses the built-in \`node:sqlite\` module, which needs it).



**### Backend**



\`\`\`bash

cd backend

npm install

cp .env.example .env

npm run seed      # creates backend/data/dev.db with 220 seeded contacts + 6 tags

npm run dev       # http\://localhost:4000

\`\`\`



\`\`\`bash

npm test          # 18 tests: filtering/sorting/pagination, concurrency, tags, activity log

\`\`\`



**### Frontend**



In a second terminal:



\`\`\`bash

cd frontend

npm install

npm run dev        # http\://localhost:3100

\`\`\`



By default the frontend talks to \`http\://localhost:4000/api/v1\`. To point it elsewhere, copy

\`.env.local.example\` to \`.env.local\` and set \`NEXT_PUBLIC_API_BASE_PATH\`.



\`\`\`bash

npm test           # 19 tests: models, services, utils (logic layer — see "Known issues")

npm run build      # static export to frontend/build/

\`\`\`



**## Data model**



\`\`\`

Contact

  id, firstName, lastName, email (unique when present), phone, company,

  version (optimistic-concurrency token), createdAt, updatedAt



Tag

  id, name (unique)



ContactTag  (many-to-many join)

  contactId, tagId, createdAt



Activity

  id, contactId, type (CONTACT_UPDATED | TAG_ADDED | TAG_REMOVED), metadata (JSON), createdAt

\`\`\`



Full SQL schema: [\`backend/src/db/client.ts\`]\(backend/src/db/client.ts).



**## API**



Base path \`/api/v1\`. Full design in

[\`PROJECT_IMPLEMENTATION_PLAN.md\` §7]\(PROJECT_IMPLEMENTATION_PLAN.md#7-api-design).



\| Method & path | Purpose |

\|---|---|

\| \`GET /contacts\` | List with \`q\`, \`tags\`, \`company\`, \`sortBy\`, \`sortDir\`, \`page\`, \`pageSize\` — all server-side |

\| \`GET /contacts/:id\` | Single contact with tags |

\| \`PATCH /contacts/:id\` | Update (validated, email-unique, optimistic-concurrency) |

\| \`POST /contacts/:id/tags\` | Add a tag (creates it if new) |

\| \`DELETE /contacts/:id/tags/:tagId\` | Remove a tag |

\| \`POST /contacts/bulk/tags\` | Assign one tag to many contacts, idempotent per contact |

\| \`GET /contacts/:id/activity\` | Recent activity, newest first |

\| \`GET /tags\` | All tags |



**## Concurrent-update approach**



Each contact has a \`version\` integer. \`GET\` returns it; a \`PATCH\` must include the version the

client last read. The update is a single atomic SQL statement:



\`\`\`sql

UPDATE contacts SET ..., version = version + 1 WHERE id = ? AND version = ?

\`\`\`



If no row matches (someone else already updated it), the server responds \`409 VERSION_CONFLICT\`

with the latest row attached. The frontend shows a side-by-side diff (your draft vs. the latest

server values) with two choices: **\*\*Reload latest\*\*** (discard your draft) or **\*\*Overwrite anyway\*\***

(resubmit your draft against the refreshed version). This is deliberately not a full merge tool

or a distributed lock — the brief asks for "a reasonable way to detect or prevent accidental

overwrites," not either of those.



Email uniqueness is enforced the same way at the database level (\`UNIQUE\` constraint) as a second

line of defense behind the application-level pre-check, so a race between two concurrent requests

with the same new email still can't produce duplicate emails.



**## Key technical decisions**



**#### Why not Prisma?**



The original plan used Prisma + SQLite. On this machine, \`prisma generate\`/\`migrate\` failed —

corporate network policy blocks the binary download from \`binaries.prisma.sh\` (TLS cert error),

while the npm registry itself is reachable. Rather than fight network policy mid-assignment, the

backend was rebuilt on Node 22's built-in \`node:sqlite\` (\`DatabaseSync\`) — zero external binaries,

zero native modules to compile, nothing beyond the npm registry. The data-access layer is plain

parameterized SQL instead of a generated query builder; the service layer's public shape

(\`listContacts\`, \`updateContact\`, etc.) is unchanged.



**#### Why a query-param route (\`/contacts/view?id=\`) instead of \`/contacts/[id]\`?**



The frontend builds as a static export (\`output: 'export'\`, matching the Next.js convention this

project's structure is based on). A dynamic Pages Router segment needs \`getStaticPaths\` to know

every path at build time — but contact ids are runtime/DB-driven and unknowable at build time. A

query-string route sidesteps that requirement entirely while staying just as shareable/bookmarkable,

at the minor cost of a slightly less "RESTful-looking" URL.



**#### Why does the frontend look like this?**



Its structure and several specific patterns (the callback-based \`apiService\` singleton, \`messageBus\`

pub/sub for the modal/toast instead of Context, hand-rolled form validation instead of a library, no

data-fetching library) were deliberately carried over from an existing internal project's

conventions, at the candidate's request, in favor of the brief's own stated preference for Vue.

Trade-offs of that choice:



\- **\*\*No TanStack Query/SWR.\*\*** Each data hook (\`use-contacts\`, \`use-contact\`, \`use-activity\`) manages

  its own loading/error state and guards against stale responses by hand: an \`AbortController\`

  per request plus a request-id ref checked when the response arrives.

\- **\*\*No React Hook Form / Zod on the client.\*\*** Contact form state is plain \`useState\` +

  \`utils/validation.ts\`'s small schema-based \`validateForm\`.

\- **\*\*\`messageBus\` pub/sub\*\***, not Context, drives the global modal (conflict resolution, bulk-tag

  confirm) and the save-feedback toast.



The frontend started out as plain JavaScript + JSDoc type-checking (mirroring that internal

project's own hard constraint against TypeScript), then was converted to real TypeScript on

request — the same \`pages/\`/\`components/\`/\`hooks/\`/\`services/\`/\`models/\`/\`utils/\` structure and

every pattern above carried over unchanged; only the language/type-checking mechanism changed.

Domain types live in \`frontend/types/index.ts\` (\`Contact\`, \`Tag\`, \`ActivityItem\`,

\`ContactsQueryState\`, the \`apiService\` handler/error types, …).



**#### Second filter attribute**



The brief asks for "at least two" filterable attributes without naming them: this app filters by

**\*\*tags\*\*** (multi-select) and **\*\*company\*\*** (partial match).



**#### Contact creation**



The brief lists browse/search/filter/view/**\*\*update\*\*** and tag management as the required user

actions — it never asks for a "create contact" flow. Contacts come from the seed script instead;

building a create UI was treated as explicitly out of scope rather than an oversight.



**## Known issues / incomplete functionality**



\- **\*\*No component-level UI tests.\*\*** Following the ported frontend convention, Vitest is scoped to

  \`models/\`, \`services/\`, and \`utils/\` (business logic), not components/pages — there's no React

  Testing Library setup. The logic most likely to have a bug (conflict diffing, URL-param

  parsing/building, the validation schema, the API request-building) is unit-tested; the wiring of

  that logic to the DOM (does clicking "Save" actually call the right thing) was checked manually

  against every requirement in the brief, including the exact two-browser-tabs conflict scenario,

  rather than by an automated test. See the full manual regression notes in

  \`PROJECT_IMPLEMENTATION_PLAN.md\`.

\- **\*\*No contact-creation UI\*\*** (see above — not required by the brief).

\- **\*\*No deployment / video walkthrough.\*\*** Not requested by this brief's Submission Guidelines

  (only a GitHub repo + this README); treated as out of scope.

\- **\*\*Search matching is ASCII-case-insensitive, not full case-insensitive.\*\*** SQLite's default

  \`LIKE\` behavior; fine for the seeded data, would need \`COLLATE NOCASE\` or a different engine for

  non-ASCII names at scale (see below).

\- **\*\*Tag autocomplete, not tag merging.\*\*** Typing an existing tag name reuses it; there's no

  detection of near-duplicate tags (e.g. "VIP" vs "Vip") beyond the \`\<datalist>\` suggestion.

\- **\*\*Developing on a OneDrive-synced folder\*\*** occasionally produced a transient

  \`EBUSY\`/filesystem-cache error from Vitest/OneDrive's on-demand sync during a test run; re-running

  the command always succeeded. Not a code issue — worth knowing if this repo is cloned into a

  similarly synced folder.



**## Scale considerations**



*\*(Write-up only, per the brief — none of this is implemented.)\**



\- **\*\*Millions of contacts per account:\*\*** move from SQLite to Postgres; replace offset pagination

  (\`LIMIT/OFFSET\`) with keyset/cursor pagination on \`(createdAt, id)\`; add composite indexes for

  the actual filter+sort combinations in use; move free-text search (name/email/phone) to Postgres

  trigram indexes (\`pg_trgm\`) or an external search index (OpenSearch/Meilisearch) once \`LIKE\`

  scans stop being viable.

\- **\*\*Millions of updates per day:\*\*** the optimistic-concurrency check still works, but "hot" contacts

  see more 409s under load — a retry-with-backoff policy for automated callers would help; move

  activity-log writes off the critical request path (a queue or async secondary write) so logging

  never blocks the user-facing update.

\- **\*\*Frequent searches and filters:\*\*** cache common/paginated query results (Redis) with a short TTL,

  invalidated on write; precompute facet counts (tag counts, company counts) instead of recomputing

  them per request.

\- **\*\*Many simultaneous users:\*\*** a stateless API behind a load balancer, scaled horizontally;

  connection pooling (PgBouncer) once on Postgres; read replicas for list/search traffic, primary

  reserved for writes; per-account rate limiting.



**## AI usage disclosure**



Built with **\*\*Claude (Anthropic)\*\*** acting as the implementer, working from a human-approved

implementation plan (\`PROJECT_IMPLEMENTATION_PLAN.md\`) derived from the assignment brief.



\- **\*\*What it was used for:\*\*** reading and analyzing the assignment PDF; drafting the architecture,

  data model, and task breakdown; writing the backend (routes/services/SQL/tests) and frontend

  (pages/components/hooks/services/tests); running the test suites, a production build, and a live

  manual walkthrough in a browser (including simulating the two-tab concurrent-edit scenario via a

  direct API call) to verify the end-to-end behavior; fixing a real bug it found in that walkthrough

  (saving a contact edit wasn't refreshing the activity feed); converting the frontend from

  JavaScript+JSDoc to TypeScript on request (same files/structure, added \`types/index.ts\`); and

  fixing a table-checkbox vertical-alignment bug (table cells default to \`vertical-align: baseline\`,

  which doesn't line a checkbox up with adjacent text) found from a screenshot during that pass.

\- **\*\*A suggestion that was changed/rejected:\*\*** the original plan specified Prisma as the ORM. When

  \`prisma generate\` failed against this machine's network policy, the plan was revised mid-build to

  drop Prisma entirely in favor of Node's built-in \`node:sqlite\`, rather than working around the

  network restriction (e.g., vendoring the engine binary) — the built-in driver has zero external

  dependencies, which is a better fit for an assignment meant to run on an unknown reviewer's

  machine anyway.
