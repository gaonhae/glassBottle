# Repository Guidelines

## Project Structure & Module Organization
This repository is a Next.js 16 App Router app for GlassBottle. Keep route files in `app/`, shared business logic in `lib/`, and tests in `tests/`. Reusable UI lives in `app/components/` and low-level primitives live in `app/components/ui/`. Supabase helpers are grouped under `lib/supabase/`. Product and planning notes belong in `docs/`, and database changes should be reflected in `supabase-schema.sql`.

## Build, Test, and Development Commands
- `npm install`: install dependencies from `package-lock.json`.
- `npm run dev`: start the local development server.
- `npm run build`: create the production build.
- `npm run start`: run the production server from the build output.
- `npm run test`: run the Vitest suite once.
- `npm run test:watch`: rerun tests during development.
- `npm run lint`: currently mapped to `next lint`, which fails under the current Next.js 16 setup and should be updated before relying on it.

## Coding Style & Naming Conventions
Use TypeScript with strict types and the `@/` path alias. Match the existing style: 2-space indentation, semicolons, and double quotes. Use `PascalCase` for React components, `camelCase` for functions and utilities, and lowercase route segment folders such as `app/inbox` or `app/letters/[id]`. Keep server-only logic in `lib/*-server.ts` or `lib/supabase/*`, not inside client components.

## Testing Guidelines
Vitest runs in a Node environment and loads files from `tests/**/*.test.ts`. Name tests after the module or behavior they cover, for example `tests/invite-links.test.ts`. Add or update tests whenever you change scheduling rules, invite flows, Supabase-side logic, or utility behavior. Coverage reporting is currently disabled, so focus on meaningful assertions over percentage targets.

## Commit & Pull Request Guidelines
Recent commits use short, imperative subjects such as `Add invite-link onboarding and sharing flow` and `Refactor lazy scheduling flow and expand MVP PRD`. Follow that pattern, and use a small prefix only when it adds clarity, for example `style:`. Pull requests should include a concise summary, linked issue or task, test results, and screenshots for changes under `app/`. Call out any `.env` or `supabase-schema.sql` changes explicitly.

## Security & Configuration Tips
Do not commit `.env.local` or service-role secrets. Update `.env.example` when configuration changes, and keep contributor-facing documents in English. When checking external library behavior, prefer current official docs through Context7 before changing framework-level patterns.
