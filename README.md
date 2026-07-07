# Jiva Farm OS

Internal operating system for managing Jiva Water farmer leads, dealers, institutional partners, pilots, devices, dispatches, installations, follow-ups, users, regions, and KPIs.

## Project documentation

- [Project status](docs/PROJECT_STATUS.md)
- [Operations guide](docs/OPERATIONS_GUIDE.md)
- [Changelog](docs/CHANGELOG.md)

## What is included

- Next.js App Router with TypeScript
- Tailwind CSS styling
- Supabase authentication and database structure
- Protected dashboard area
- Responsive sidebar navigation
- Production modules for sales, operations, pilots, devices, follow-ups, internal users, regions, and reporting
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
- `/dashboard`
- `/farmer-leads`
- `/dealers`
- `/institutional-partners`
- `/pilots`
- `/my-visits`
- `/devices`
- `/dispatches`
- `/installations`
- `/follow-ups`
- `/kpi-dashboard`
- `/regions`
- `/internal-users`
- `/help`
- `/account/password`
