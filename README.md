# AWA/OS

The operating system for Te Wairama Digital: clients, projects, pipeline, invoices,
calendar and email in one internal app, plus a portal for clients.

Next.js 16 · Supabase (Postgres, Auth, Storage) · Resend · Stripe · deployed on Vercel.

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in your values
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Internal users are Supabase Auth users.

Database changes live in `supabase/migrations`. Apply them with `supabase db push`.

| Command         | What it does               |
| --------------- | -------------------------- |
| `npm run dev`   | Start the dev server       |
| `npm run build` | Production build           |
| `npm run lint`  | ESLint                     |

## How it fits together

**Internal app** (`src/app/(internal)`) — anyone logged in through Supabase Auth. Protected by
`src/proxy.ts`, by RLS, and by `requireUser()`, which every Server Action calls first.

**Client portal** (`src/app/portal`) — clients don't have Supabase logins. They get a one-time
setup link, set a password, and hold a signed `portal_session` cookie. Portal code uses the
service role client, so every page, route and action must start with `requirePortalClient(slug)`,
and only query that client's rows. The logged-in pages sit in the `(portal)` route group so
`/portal/[clientSlug]/setup` stays outside their auth layout.

In `npm run dev`, portal pages render without logging in, for previewing. This never applies in production.

## Money

Invoice amounts (`invoices.amount`, `line_items`) are **integer cents**. Project values
(`projects.value`) are **dollars**. Use `formatNZD` for cents and `formatDollars` for dollars,
both from `src/lib/format.ts`.

## Stripe

Invoices are paid through Payment Links. Point a webhook at `/api/webhooks/stripe` and subscribe to:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
