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

## Frontend Patterns

These conventions apply to every new page and component.

### Component Library
- Use **shadcn/ui** (`base-nova` style, `@base-ui/react` primitives) for all UI elements
- Install new components with `npx shadcn add <name>` — do not hand-roll primitives shadcn provides
- Icon library: **lucide-react** exclusively
- **No `asChild` prop** — `base-nova` uses `@base-ui/react` which doesn't support it; use controlled state with `open`/`onOpenChange` for dialogs, and `buttonVariants()` + `<Link>` instead of `<Button asChild>`

### Styling
- Use **CSS design tokens** (`bg-background`, `text-foreground`, `text-muted-foreground`, `border`, `text-destructive`, etc.) — never hardcode Tailwind palette colors like `bg-gray-50` or `text-gray-700`
- Dark mode is automatic when design tokens are used correctly
- Tailwind utility classes are allowed for layout and spacing only

### Theming
- Dark mode is managed by **`next-themes`** (`ThemeProvider` in `components/providers.tsx`)
- Toggle with `useTheme()` from `next-themes`
- Always add `suppressHydrationWarning` to the `<html>` element

### i18n + Currency
- All user-visible strings go through `t(key)` from `useSettings()` — never hardcode UI strings
- All currency values go through `formatCurrency(value)` from `useSettings()` — never call `Intl.NumberFormat` directly
- Keys live in `lib/i18n.ts`; add new keys to all three languages (`en`, `pt-BR`, `es`) at the same time

### Forms
- Use shadcn `<Input>`, `<Select>`, `<Label>` — never raw `<input>` or `<select>` tags
- Add/edit forms open in `<Dialog>` controlled by local `useState`; the form component receives `onSuccess` + `onCancel` callbacks

### Pages
- Every page is wrapped by `<Navbar />` (rendered in `app/layout.tsx`)
- RSC pattern: page shell = Server Component (Prisma calls), interactive parts = `"use client"` components
- Dashboard: RSC fetches data, passes serialized props to a client `*Client` component that calls `useSettings()`

### Key Files
| Path | Purpose |
|------|---------|
| `lib/i18n.ts` | Translation dictionaries + `LANGUAGES`/`CURRENCIES` arrays |
| `contexts/settings-context.tsx` | Currency + language state (localStorage) |
| `hooks/use-settings.ts` | `t()` + `formatCurrency()` helpers |
| `components/providers.tsx` | `ThemeProvider` + `SettingsProvider` + `TooltipProvider` |
| `components/navbar.tsx` | Sticky nav with dark mode toggle + settings gear |
| `components/settings-modal.tsx` | Settings dialog (appearance, currency, language) |

---

## Plan Files

Index of every implementation plan created for this project. Add a row here each time a new plan is created.

Plans live in `~/.claude/plans/`. Each plan file follows this structure:
- **Context** — why the change is being made
- **Implementation Steps** — ordered, actionable steps
- **Acceptance Criteria** — checklist to verify the feature is done

| Plan | Feature / Branch | Created |
|------|-----------------|---------|
| [~/.claude/plans/i-want-to-change-vectorized-pixel.md](~/.claude/plans/i-want-to-change-vectorized-pixel.md) | Net worth tracker / `feature/invoice-upload` | 2026-05-20 |
| [~/.claude/plans/i-was-wondering-about-eager-puddle.md](~/.claude/plans/i-was-wondering-about-eager-puddle.md) | Finance Assistant chat (RAG + OpenAI) / `feature/chat-assistant` | 2026-06-08 |
