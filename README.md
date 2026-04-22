# Headroom

Stage 1 MVP for a calendar-aware cognitive load planner for students.

## What is included

- Google-only authentication with NextAuth/Auth.js
- Google Calendar sync for the next 14 days
- 10-question onboarding quiz that produces a Work & Recovery Profile
- Manual task entry with effort estimates, task type, and optional friction fields
- Weekly dashboard with:
  - workload summary
  - detected work windows
  - recovery interpretation
  - recommendation cards
  - event classification overrides
- Deterministic recommendation engine with explainable heuristics
- Prisma schema for PostgreSQL
- Seed data for a demo student

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- PostgreSQL
- Prisma
- NextAuth

## Routes

- `/` landing and sign-in
- `/onboarding` quiz flow
- `/tasks` task CRUD
- `/dashboard` weekly report and recommendations
- `/settings` profile and sync state
- `POST /api/calendar/sync`
- `POST /api/recommendations/generate`

## Local setup

1. Create local env files.

```bash
cp .env.example .env
cp .env.example .env.local
```

Use `.env.local` for your actual local overrides. In Next.js, `.env.local` wins over `.env`, so the clearest local setup is:

- keep `.env` as a shared project baseline
- keep `.env.local` for machine-specific secrets and credential overrides
- if you only want one file locally, `.env.local` is the important one

2. Start PostgreSQL.

```bash
docker compose up -d
```

3. Install dependencies.

```bash
pnpm install
```

4. Generate the Prisma client and push the schema.

```bash
pnpm prisma:generate
pnpm db:push
```

5. Seed demo data if you want a populated local view.

```bash
pnpm db:seed
```

6. Start the app.

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

Local run modes:

- `pnpm dev` is the stable local path. It runs a production build, then serves the app with `next start`.
- `pnpm dev:watch` keeps the direct Webpack dev server available, but on this machine it is still experimental because Next 16 plus the WASM/SWC workaround can leave `.next/dev` missing vendor chunk artifacts.

## Environment variables

Use the values in `.env.example`, then override locally in `.env.local` as needed:

- `DATABASE_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `DEV_AUTH_ENABLED`
- `APP_TIMEZONE`

Notes:

- `NEXTAUTH_SECRET` in `.env.example` is already a valid local development secret. You can keep it for local-only work or replace it with your own random value in `.env.local`.
- If `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are left as placeholders, the app will automatically fall back to local demo auth in non-production.
- Set `DEV_AUTH_ENABLED="false"` if you want to disable demo sign-in and require real Google auth locally.

## Key implementation notes

- Google Calendar is read-only in Stage 1. The app syncs and stores normalized events but does not create calendar blocks.
- Event classification is heuristic by default, with manual override stored per event.
- Recommendation explanations are templated from rule reasons and are intentionally interpretable.
- The calendar sync service in `src/lib/calendar-sync.ts` is the planned seam for future Canvas ingestion.
- Local demo auth seeds or reuses a demo student so the app can be viewed without real Google OAuth credentials.

## Verification

Verified locally:

- `pnpm db:seed`
- `pnpm lint`
- `pnpm exec tsc --noEmit`
- `pnpm build`

Local stability note:

- The default local runtime path is `pnpm dev` because it avoids the broken `.next/dev/server/vendor-chunks/*` path.
- The specific runtime failure you hit, `ENOENT ... .next/dev/server/vendor-chunks/date-fns@4.1.0.js`, comes from the direct `next dev --webpack` path under the current WASM/SWC workaround, not from the app code or the production build.

Known local limitation:

- The test files are present, but `pnpm test:run` is currently blocked on this machine by Rollup/Vitest native binding loading. The app code itself still type-checks and builds successfully.

## Project structure

```text
prisma/
src/app/
src/components/
src/lib/
src/test/
```
