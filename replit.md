# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite + TailwindCSS + shadcn/ui
- **Auth**: Replit Auth (OpenID Connect with PKCE)
- **Routing (frontend)**: wouter
- **Email**: Resend (via Replit integration)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── get-better-together/ # React + Vite frontend app
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   ├── db/                 # Drizzle ORM schema + DB connection
│   ├── shared/             # Shared utilities (generateDailyTargets)
│   └── replit-auth-web/    # Browser auth hook (useAuth)
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Application: Get Better Together

Social fitness challenge app where users create private/public, time-bound challenges, invite friends via invite codes, log progress, and compete on leaderboards with streak tracking and email notifications.

### Features

- **Challenge types**: Daily (per-day targets with backlog filling) and Total (accumulate toward overall goal)
- **Customization**: Randomize reps, Rest days (every 7th day), No Max (log beyond daily target). Customize accordion visible for duration ≥ 10 days. Per-day targets stored as jsonb `daily_targets` column.
- **Public challenges**: Admin-only toggle. Public challenges are discoverable without an invite code.
- **No Max mode**: Participants can log beyond the daily target. Extra reps count toward today's total and the leaderboard. Priority: fill today first → backfill past days → credit extra to today.
- **Duration**: 1–365 days enforced at HTML input, frontend Zod schema, and backend Zod schema.
- **Invite system**: 8-character invite codes to join private challenges.
- **Progress tracking**: Quick-add buttons, progress rings (daily), progress bars (total).
- **Leaderboards**: Ranked by total logged (including noMax extra), with streak tracking for daily challenges.
- **Dashboard**: Today summary strip + active challenge cards.
- **Auth**: Replit Auth via OIDC/PKCE. `/api/auth/user` re-fetches from DB on every call so `isAdmin` is always current.
- **Email notifications**: challengeStarted fires immediately on creation; daily cron at 09:00 UTC sends reminder/completion emails. Admin or challenge creator can trigger `/api/admin/notifications/run` manually.
- **Badges**: "Variable Targets 🔥" (orange) and "No Max ∞" (violet) shown on challenge detail when applicable; clicking shows an info toast.

### DB Schema (lib/db/src/schema/)

- `users` (auth.ts) — Replit Auth users with profile info; `is_admin boolean` column for admin privileges; `is_anonymous boolean` for guest users
- `sessions` (auth.ts) — Session store for auth
- `challenges` (challenges.ts) — Challenge definitions with invite codes; `is_public boolean` and `no_max boolean` columns
- `participations` (participations.ts) — User-challenge join table
- `progress_logs` (progressLogs.ts) — Raw progress log entries with date and value
- `notification_logs` (notificationLogs.ts) — Tracks sent notifications to avoid duplicates

### API Routes (artifacts/api-server/src/routes/)

- `GET /api/healthz` — Health check
- `GET/POST /api/auth/*` — Replit Auth endpoints (user endpoint re-fetches from DB for `isAdmin`)
- `GET /api/challenges` — List user's challenges with progress
- `POST /api/challenges` — Create new challenge (accepts `isPublic` [admin-only] and `noMax`)
- `GET /api/challenges/preview/:inviteCode` — Public challenge preview
- `POST /api/challenges/join/:inviteCode` — Join a challenge
- `GET /api/challenges/:id` — Challenge detail with user progress + leaderboard
- `POST /api/challenges/:id/log` — Log progress (respects noMax; logs raw value, distribution is computed)
- `GET /api/challenges/:id/progress` — User's progress data
- `GET /api/challenges/:id/leaderboard` — Full leaderboard
- `GET /api/dashboard/summary` — Dashboard summary stats
- `GET /api/challenges/public` — List active public challenges with leaderboard (strips sensitive fields)
- `POST /api/challenges/:id/guest-join` — Join a public challenge as guest (name only, no auth, 100 guest cap)
- `POST /api/challenges/:id/guest-log` — Log progress as guest (guestId + value)
- `POST /api/admin/notifications/run` — Manually trigger notification cron (challenge creator or first user)

### Key Business Logic

**challengeUtils.ts:**
- Challenge state derived from dates (never stored): not_started, active, completed
- `computeDailyProgress(logs, startDate, durationDays, targetValue, dailyTargets?, noMax?, clientNow?)`:
  - For each log: (1) fill today first, (2) backfill past days up to their targets, (3) if `noMax`, dump leftover onto today (no cap)
  - Caps loop: past days always capped at target; today uncapped when `noMax`
  - Rest days (target=0) skipped during backfill, auto-completed for streaks
- `computeAllocatedTotal` — sum of capped daily progress (used for `!noMax` remaining check)
- `computeStreak` — consecutive completed days ending at today (or yesterday if today incomplete)
- Unit auto-derived from activity type (pushups→reps, running→km, etc.)

**challenges.ts log endpoint priority (POST /challenges/:id/log):**
1. Reject if rest day (target=0)
2. If `!noMax`: compute remaining (today + backfill capacity); return 400 if none; cap value to remaining
3. If `noMax`: log raw value (computeDailyProgress handles all distribution and extra crediting)
4. All `computeChallengeProgress` calls pass `noMax` so leaderboard and progress show correct values

**notifications.ts:**
- `challengeStarted` email fires immediately (fire-and-forget) when a challenge is created
- Daily cron sends reminder emails on days [2, floor(N/2), N-4] for challenges of N days
- Completion email when all participants finish
- `reminderNumber=0` is sentinel for one-time notifications; deduped via `notification_logs`

### Codegen Workflow

After editing `lib/api-spec/openapi.yaml`:
1. `cd lib/api-spec && pnpm exec orval` — regenerate types and hooks
2. Rebuild stale `.d.ts` files: `cd lib/db && pnpm exec tsc -p tsconfig.json` (and same for `lib/api-zod`, `lib/api-client-react`, `lib/replit-auth-web`)
3. Typecheck: `pnpm --filter @workspace/api-server run typecheck && pnpm --filter @workspace/get-better-together run typecheck`

### Frontend Pages (artifacts/get-better-together/src/pages/)

- `/` — Welcome with "Try it now" CTA (unauthenticated) or Dashboard (authenticated)
- `/challenge/new` — Create challenge form (Public toggle for admins, No Max in Customize)
- `/challenge/:id` — Challenge detail with progress ring/bar, quick-add, leaderboard, badges
- `/challenge/:id/leaderboard` — Full leaderboard view
- `/join/:inviteCode` — Join challenge preview
- `/profile` — User profile

### Guest Mode & Demo Challenge

- **Demo challenge**: "10-Day Pushup Challenge" (slug: `demo-pushup-challenge`) seeded on server startup via `seedDemoChallenge.ts`; idempotent via slug check.
- **Seed data**: 4 dummy anonymous users with pre-logged progress (Alex K., Jamie L., Morgan R., Sam T.)
- **Guest flow**: Visitor clicks "Try it now" → `/challenge/demo-pushup-challenge` → enters name → `POST /guest-join` → guestId stored in `localStorage` as `gbt_guest_{slug}` → can log reps without auth
- **Guest-to-account upgrade**: "Sign up to save progress" button → login with redirect back → auto-claims guest data (transfers participation + logs, updates display name if empty, cleans up guest user)
- **Claim endpoint**: `POST /api/challenges/:id/claim-guest` — authenticated, takes `{ guestId }`, merges guest's participation/logs into auth user
- **Security**: 100-guest cap per challenge; `/challenges/public` strips `inviteCode`/`createdById` from responses; guest identity via UUID (bearer model, acceptable for low-stakes demo)

### Frontend Auth

- `useAuth()` from `@workspace/replit-auth-web` — do NOT use generated hooks for auth
- `AuthUser` type (from generated `@workspace/api-client-react`) includes `isAdmin?: boolean`
- Admin-only UI (e.g. Public challenge toggle) rendered conditionally on `user?.isAdmin`

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.

- **Always typecheck from the root** — run `pnpm run typecheck`
- **`emitDeclarationOnly`** — only `.d.ts` files during typecheck; JS bundling by esbuild/vite
- **Project references** — when package A depends on B, A's `tsconfig.json` must list B in `references`

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly`

## Development

- API server: `pnpm --filter @workspace/api-server run dev` (port from PORT env, default 8080)
- Frontend: `pnpm --filter @workspace/get-better-together run dev` (port from PORT env)
- DB push: `pnpm --filter @workspace/db run push`
- Codegen: `cd lib/api-spec && pnpm exec orval`
