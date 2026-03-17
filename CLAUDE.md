# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Recipe Catalogue — a mobile-first family recipe web app with auth, recipe CRUD, photo uploads, ratings/favorites, filtered search, URL-based recipe import, shopping lists, meal planning, and admin user management.

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript (strict)
- **Styling**: Tailwind CSS v4 + shadcn/ui (base-ui primitives)
- **ORM**: Prisma 7 with `@prisma/adapter-pg`
- **Auth**: Auth.js v5 (next-auth@beta) + Resend magic links, JWT strategy
- **Storage**: AWS S3 (presigned URLs via @aws-sdk/client-s3)
- **Scraping**: cheerio (JSON-LD extraction)
- **Forms**: react-hook-form + zod v4
- **Dates**: date-fns
- **Icons**: lucide-react

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # ESLint
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Run Prisma migrations
npm run db:push      # Push schema to database
npm run db:seed      # Seed dietary tags + admin user
```

## Project Structure

```
src/
  app/
    (auth)/login/, auth/verify/    # Public auth pages
    (main)/                        # Authenticated layout with header/nav
      page.tsx                     # Browse/search recipes
      recipes/new/, import/, [id]/, [id]/edit/
      favorites/, shopping-list/, meal-plan/
      admin/users/
    api/
      auth/[...nextauth]/          # Auth.js handler
      recipes/, recipes/[id]/, recipes/[id]/rating|favorite|photos/
      recipes/import/              # URL scraping
      ingredients/, tags/, dietary-tags/
      upload/                      # S3 presigned URLs
      shopping-list/, shopping-list/export/
      meal-plan/
      admin/users/, admin/users/[id]/
  components/
    ui/           # shadcn/ui components
    auth/         # Login form
    layout/       # Header, Providers
    recipes/      # Recipe form, detail, card, grid, browser, filters, import, photos, rating, favorite, servings
    shopping-list/ # Shopping list view, recipe selector
    meal-plan/    # Weekly calendar, meal slot, add meal dialog
    admin/        # User table, invite form
  lib/
    auth.ts, auth.config.ts    # Auth.js config (split for edge middleware)
    prisma.ts                  # Prisma singleton
    s3.ts                      # S3 presigned URL helpers
    scraper.ts                 # JSON-LD recipe extraction
    utils.ts                   # cn(), toTitleCase()
    validators/                # Zod schemas (recipe, shopping-list, meal-plan)
  hooks/
    use-debounce.ts
  types/
    next-auth.d.ts             # Auth.js type augmentation
prisma/
  schema.prisma                # Full data model
  seed.ts                      # Dietary tags + admin user seeding
```

## Environment Variables

See `.env.example` for all required variables:
- `DATABASE_URL` — PostgreSQL connection string
- `AUTH_SECRET` — Auth.js secret
- `RESEND_API_KEY` / `EMAIL_FROM` — Magic link emails
- `S3_BUCKET` / `S3_REGION` / `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` — Photo uploads

## Key Patterns

- **Auth**: JWT strategy with edge-compatible middleware (`auth.config.ts` has no Prisma imports)
- **Prisma 7**: Uses `@prisma/adapter-pg` driver adapter; datasource URL in `prisma.config.ts`
- **shadcn/ui v4**: Uses `@base-ui/react` primitives; `render` prop instead of `asChild`; `buttonVariants()` for link-as-button patterns
- **Recipe search**: API-side filtering with Prisma `where` + client-side post-query rating sort/filter
- **Shopping list**: Deduplication/aggregation by ingredient+unit; single active list per user
- **Meal plan**: Weekly calendar with 4 meal types × 7 days; supports main + side course types
