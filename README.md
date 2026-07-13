# Onc Regimens

An interactive oncology cross-highlighter, modeled on the interaction of
[bugdrugdx.com](https://bugdrugdx.com/). Hover, tap, or focus any entity and the
related entities across a four-tier chain light up:

```
Cells  →  Diseases  →  Regimens  →  Drugs
```

A hematopoietic cell-lineage diagram sits across the top; below it are columns
for Diseases, Regimens, and Drugs, plus an Info panel showing the selected
drug's mechanism of action and toxicities. Every relationship is many-to-many,
and selecting anything expands the highlight both up and down the chain.

There is also a protected **editor** for adding, editing, and connecting all
four entity types.

## Stack

- **Next.js (App Router) + React + TypeScript**, Tailwind CSS v4, shadcn/ui
- **Neon Postgres + Drizzle ORM** — real join tables for the many-to-many edges
- **Zustand** for selection state, **Zod** for validation, **Vitest** for tests
- Deploys to **Vercel**

## Getting started

```bash
pnpm install
cp .env.example .env.local   # then fill in the values (see below)
pnpm dev                     # http://localhost:3000
```

Without a `DATABASE_URL`, the app runs against the checked-in sample data
(`src/db/seed-data.json`) in **read-only** mode — great for a first look. The
viewer is fully functional; the editor renders but saving is disabled until a
database is configured.

### Environment variables (`.env.local`)

| Variable         | Purpose                                                        |
| ---------------- | -------------------------------------------------------------- |
| `DATABASE_URL`   | Neon Postgres connection string. Enables persistence.          |
| `ADMIN_PASSWORD` | Password required to reach `/edit` and mutate data.            |
| `SESSION_SECRET` | Secret for signing the admin session cookie (`openssl rand -base64 32`). |

## Setting up the database (Neon)

1. Create a Neon Postgres database (via the Vercel Neon integration or
   [neon.tech](https://neon.tech)) and copy its connection string into
   `DATABASE_URL`.
2. Apply the schema and seed the sample data:

   ```bash
   pnpm db:migrate   # create tables from drizzle/ migrations
   pnpm db:seed      # load the sample oncology dataset
   ```

   (`pnpm db:generate` regenerates migrations after editing `src/db/schema.ts`.
   `pnpm db:push` is a quick alternative to migrate for local iteration.)

## Editing data

1. Go to `/edit` (or click **Edit** in the top bar). You'll be redirected to
   `/login`; enter `ADMIN_PASSWORD`.
2. Each column has an **Add** button; each row has edit/delete.
3. Relationships are set with searchable multi-selects (a disease picks its
   cells, a regimen its diseases, a drug its regimens). Cells pick a lineage
   parent; lineage cycles and self-parenting are rejected.
4. Deleting an entity cascades cleanly: its join-table edges are removed, and a
   deleted cell's children have their parent cleared.

## Testing & verification

```bash
pnpm test        # Vitest — graph engine + mutation helpers
pnpm typecheck   # tsc --noEmit
pnpm lint        # ESLint
pnpm build       # production build
```

## Deploying to Vercel

1. Push the repo to GitHub and import it in Vercel.
2. Add the Neon integration (or set `DATABASE_URL` manually), plus
   `ADMIN_PASSWORD` and `SESSION_SECRET`, in the Vercel project's environment
   variables.
3. Run `pnpm db:migrate` and `pnpm db:seed` once against the production
   `DATABASE_URL` (locally with the prod connection string, or via a one-off
   job).
4. Deploy. The viewer is public; editing requires the admin password.

## Architecture notes

- **`src/lib/graph.ts`** — the pure, unit-tested bidirectional highlight engine
  (`buildIndex` + `computeHighlights`). No React or DB dependencies.
- **`src/lib/dataStore.ts`** — the single data-access seam. Reads assemble
  ID-array edges from the join tables; writes run in transactions that
  diff-replace an entity's edges. Falls back to the seed JSON when no DB is set.
- **`src/lib/lineageLayout.ts`** — deterministic tree layout for the SVG lineage
  diagram; the one place to change the diagram's shape.
- **Auth** is intentionally lightweight (one shared admin password). The
  `dataStore` interface and `requireAdmin()` gate are clean seams to swap in a
  hosted DB variant or real per-user accounts later.
