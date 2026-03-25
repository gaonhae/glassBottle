# GlassBottle MVP

GlassBottle is a web MVP for emotionally honest family communication.
A sender writes an anonymous letter to a family member, and the system delivers it after a uniformly random delay between 5 and 72 hours.

## Stack

- Next.js (App Router)
- Supabase Auth + Postgres + RLS
- Vercel deployment

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

Auth setup for this MVP:

- Enable `Email` provider in Supabase Auth.
- Disable `Confirm email` to allow immediate sign-in after sign-up.
- Password requirements are controlled by your Supabase Auth project settings. The app does not hardcode an 8-character minimum during sign-up.

3. Apply database schema in Supabase SQL editor.

- Run [`supabase-schema.sql`](./supabase-schema.sql).

4. Start development server.

```bash
npm run dev
```

## Lazy background behavior

- The daily prompt is created lazily on the first prompt-related request after midnight in `Asia/Seoul`.
- Due letters are promoted lazily to `delivered` when a user visits inbox, outbox, or letter detail pages.
- Lazy letter promotion persists `delivered_at` as the original `scheduled_at` value.

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
- lazy question creation logic
- lazy letter promotion logic
