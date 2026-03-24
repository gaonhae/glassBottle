# GlassBottle MVP

GlassBottle is a web MVP for emotionally honest family communication.
A sender writes an anonymous letter to a family member, and the system delivers it after a uniformly random delay between 5 and 72 hours.

## Stack

- Next.js (App Router)
- Supabase Auth + Postgres + RLS
- Vercel deployment + cron trigger

## Product constraints in this MVP

- Web responsive only
- One family per user
- Family max members: 8
- Anonymous sender identity to recipient
- Text-only letters
- No notifications
- No safety/moderation tools
- Sender can edit/cancel only within 5 minutes

## Setup

1. Install dependencies.

```bash
npm install
```

2. Create `.env.local` from `.env.example` and fill values.

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `CRON_SECRET`

Auth setup for this MVP:

- Enable `Email` provider in Supabase Auth.
- Disable `Confirm email` to allow immediate sign-in after sign-up.

3. Apply database schema in Supabase SQL editor.

- Run [`supabase-schema.sql`](./supabase-schema.sql).

4. Start development server.

```bash
npm run dev
```

## Scheduler

- Cron endpoint: `POST /api/scheduler/deliver`
- Protected by `CRON_SECRET`
- Vercel cron configured in [`vercel.json`](./vercel.json) to run every minute

## Main routes

- `/auth` email/password login + sign-up
- `/onboarding` create/join family
- `/inbox` recipient delivered letters
- `/outbox` sender status and 5-minute edits/cancel
- `/letters/new` compose delayed letter
- `/letters/[id]` detail view (recipient read marks automatically)
- `/settings` profile + family info

## Tests

```bash
npm run test
```

Current tests cover:

- random delay bounds
- status transition rules
