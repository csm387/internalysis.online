## Mistery Backend

Separate API service for Mistery OS.

### Requirements

- Node.js (npm)
- Postgres (local) **or** Docker Desktop (optional)

### Setup

1) Create env:

Copy `.env.example` to `.env` and fill values.

2) Install:

```bash
npm install
```

3) Database:

- If you have Docker Desktop: run from repo root:

```bash
npm run db:up
```

- Or run Postgres manually and set `DATABASE_URL`.

4) Migrate + generate:

```bash
npm run prisma:migrate
```

5) Dev server:

```bash
npm run dev
```

API docs: `http://localhost:4000/docs`\n

