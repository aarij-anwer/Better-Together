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
│   └── replit-auth-web/    # Browser auth hook (useAuth)
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Application: Get Better Together

Social fitness challenge app where users create private, time-bound challenges, invite friends via invite codes, log progress, and compete on leaderboards.

### Features
- **Challenge types**: Daily (per-day targets with backlog filling) and Total (accumulate toward overall goal)
- **Invite system**: 8-character invite codes to join challenges
- **Progress tracking**: Quick-add buttons, progress rings (daily), progress bars (total)
- **Leaderboards**: Ranked by total logged, with streak tracking for daily challenges
- **Dashboard**: Today summary strip + active challenge cards
- **Auth**: Replit Auth via OIDC/PKCE

### DB Schema (lib/db/src/schema/)
- `users` (auth.ts) - Replit Auth users with profile info
- `sessions` (auth.ts) - Session store for auth
- `challenges` (challenges.ts) - Challenge definitions with invite codes
- `participations` (participations.ts) - User-challenge join table
- `progress_logs` (progressLogs.ts) - Raw progress log entries with date and value

### API Routes (artifacts/api-server/src/routes/)
- `GET /api/healthz` - Health check
- `GET/POST /api/auth/*` - Replit Auth endpoints
- `GET /api/challenges` - List user's challenges with progress
- `POST /api/challenges` - Create new challenge
- `GET /api/challenges/preview/:inviteCode` - Public challenge preview
- `POST /api/challenges/join/:inviteCode` - Join a challenge
- `GET /api/challenges/:id` - Challenge detail with user progress + leaderboard
- `POST /api/challenges/:id/log` - Log progress
- `GET /api/challenges/:id/progress` - User's progress data
- `GET /api/challenges/:id/leaderboard` - Full leaderboard
- `GET /api/dashboard/summary` - Dashboard summary stats

### Key Business Logic (api-server/src/lib/challengeUtils.ts)
- Challenge state derived from dates (never stored): not_started, active, completed
- Daily progress: aggregates logs by actual calendar date, overflow from today spills to unfilled days
- Streak computation: consecutive completed days ending at today (or yesterday if today incomplete)
- Unit auto-derived from activity type (pushups→reps, running→km, etc.)

### Frontend Pages (artifacts/get-better-together/src/pages/)
- `/` - Welcome (unauthenticated) or Dashboard (authenticated)
- `/challenge/new` - Create challenge form
- `/challenge/:id` - Challenge detail with progress ring/bar, quick-add, leaderboard
- `/challenge/:id/leaderboard` - Full leaderboard view
- `/join/:inviteCode` - Join challenge preview

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
- Codegen: `pnpm --filter @workspace/api-spec run codegen`
