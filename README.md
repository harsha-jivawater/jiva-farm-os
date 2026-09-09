# Jiva Farm OS

Internal operating system for managing Jiva Water farmer leads, dealers, institutional partners, primary and secondary sales, targets, forecasts, pilots, inventory, dispatches, installations, follow-ups, marketing material, users, regions, daily work, operations control, and KPIs.

## Project documentation

- [Project status](docs/PROJECT_STATUS.md)
- [Operations guide](docs/OPERATIONS_GUIDE.md)
- [Sales operations guide](docs/SALES_OPERATIONS_GUIDE.md)
- [Role-based usage manual](docs/ROLE_BASED_USAGE_MANUAL.md)
- [Current engineering state](docs/engineering/CURRENT_STATE.md)
- [Engineering roadmap](docs/engineering/ROADMAP.md)
- [Changelog](docs/CHANGELOG.md)

## What is included

- Next.js App Router with TypeScript
- Tailwind CSS styling
- Supabase authentication and database structure
- Protected dashboard area
- Responsive sidebar navigation
- Production modules for sales, operations, pilots, inventory, follow-ups, marketing workflows, internal users, regions, reporting, and management control
- Production deployment on Vercel with Supabase Auth, Database, RLS, and Storage

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env.local` from `.env.example` and add your Supabase project values:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   NEXT_PUBLIC_ENABLE_QA_SEED=false
   ```

   Set `NEXT_PUBLIC_ENABLE_QA_SEED=true` only for local QA work. Production should leave it unset or `false`.

3. In Supabase, enable email/password authentication and create internal users from the Supabase dashboard.

4. Start the app:

   ```bash
   npm run dev
   ```

5. Open `http://localhost:3000`.

## Routes

- `/login`
- `/my-pending-work`
- `/my-visits`
- `/notifications`
- `/farmer-leads`
- `/farmer-leads/import`
- `/dealers`
- `/dealers/reporting`
- `/institutional-partners`
- `/payment-links`
- `/sales`
- `/sales/targets`
- `/sales/forecast`
- `/sales/approvals`
- `/pilots`
- `/devices`
- `/devices/import`
- `/dispatches`
- `/installations`
- `/follow-ups`
- `/marketing-requests`
- `/marketing-library`
- `/kpi-dashboard`
- `/operations-control`
- `/data-quality`
- `/system-health`
- `/regions`
- `/internal-users`
- `/help`
- `/account/password`
- `/dashboard` redirects to `/my-pending-work` for compatibility
- `/inventory` redirects to `/devices` for compatibility
