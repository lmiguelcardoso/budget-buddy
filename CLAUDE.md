# Budget Buddy — Claude Code Context

## Project

Personal finance management app. Users upload credit card invoices (PDF/image), extract transactions via OCR (GPT-4 Vision), review/edit them, and get spending insights.

Full spec: `~/study/budgetly/NEXTJS_MIGRATION_CONTEXT.md` — single source of truth for stack, schema, API routes, OCR details, and feature backlog.

## Stack

- Next.js 15, TypeScript, Tailwind v4, App Router
- Prisma + PostgreSQL 16
- Redis 7
- shadcn/ui + lucide-react
- GPT-4 Vision for OCR

## Git Workflow

- `master` — production only
- `develop` — integration branch
- `feature/<name>` — branched from develop, PR back to develop
- Never commit directly to develop or master

## Local Dev

```bash
cp .env.example .env      # fill DATABASE_URL etc.
make up                   # start postgres + redis
make migrate              # run Prisma migrations
make seed                 # seed default categories
make dev                  # start Next.js dev server
```

## Key Files

| Path | Purpose |
|------|---------|
| `prisma/schema.prisma` | DB schema — invoices, transactions, categories |
| `prisma/seed.ts` | 9 default categories |
| `lib/db.ts` | Prisma singleton |
| `lib/response.ts` | API response envelope helpers |
| `lib/file.ts` | File validation + save/delete |
| `lib/ocr.ts` | GPT-4V OCR extraction |
| `app/api/health/route.ts` | GET /api/health |

## Plan Files

Index of every implementation plan created for this project. Add a row here each time a new plan is created.

Plans live in `plans/`. Each plan file follows this structure:
- **Goal** — what the feature does
- **Scope** — API routes, pages, and components in scope
- **Files to Create** — new files only
- **Files Already in Place** — dependencies that exist and won't change
- **Implementation Steps** — ordered, actionable steps
- **Acceptance Criteria** — checklist to verify the feature is done

| Plan | Feature / Branch | Created |
|------|-----------------|---------|
| [plans/feature-invoice-upload.md](plans/feature-invoice-upload.md) | Invoice upload / `feature/invoice-upload` | 2026-03-30 |
