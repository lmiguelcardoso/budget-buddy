# Budget Buddy — Claude Code Context

## Project

Personal finance net worth tracker. Users add assets (stocks, crypto, treasuries, cash) and liabilities (debt), see live market prices, and track their net worth over time via snapshots.

## Stack

- Next.js 15, TypeScript, Tailwind v4, App Router
- Prisma + PostgreSQL 16
- Redis 7
- shadcn/ui + lucide-react

## Git Workflow

- `master` — production only
- `develop` — integration branch
- `feature/<name>` — branched from develop, PR back to develop
- Never commit directly to develop or master

## Local Dev

```bash
cp .env.example .env      # fill DATABASE_URL
make up                   # start postgres + redis
make migrate              # run Prisma migrations
make dev                  # start Next.js dev server
```

## Key Files

| Path | Purpose |
|------|---------|
| `prisma/schema.prisma` | DB schema — assets, liabilities, net_worth_snapshots |
| `lib/db.ts` | Prisma singleton |
| `lib/response.ts` | API response envelope helpers |
| `lib/prices.ts` | Live price fetching (Yahoo Finance, CoinGecko) |
| `lib/logger.ts` | Structured JSON logging |
| `app/api/health/route.ts` | GET /api/health |
| `app/api/assets/route.ts` | GET/POST /api/assets |
| `app/api/assets/[id]/route.ts` | PUT/DELETE /api/assets/:id |
| `app/api/assets/refresh-prices/route.ts` | POST /api/assets/refresh-prices |
| `app/api/liabilities/route.ts` | GET/POST /api/liabilities |
| `app/api/liabilities/[id]/route.ts` | PUT/DELETE /api/liabilities/:id |
| `app/api/networth/route.ts` | GET /api/networth |
| `app/api/networth/snapshot/route.ts` | POST /api/networth/snapshot |

## Plan Files

Index of every implementation plan created for this project. Add a row here each time a new plan is created.

Plans live in `~/.claude/plans/`. Each plan file follows this structure:
- **Context** — why the change is being made
- **Implementation Steps** — ordered, actionable steps
- **Acceptance Criteria** — checklist to verify the feature is done

| Plan | Feature / Branch | Created |
|------|-----------------|---------|
| [~/.claude/plans/i-want-to-change-vectorized-pixel.md](~/.claude/plans/i-want-to-change-vectorized-pixel.md) | Net worth tracker / `feature/invoice-upload` | 2026-05-20 |
