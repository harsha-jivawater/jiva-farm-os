# Jiva Farm Devices OS

Internal web app shell for managing farmer leads, dealers, partners, pilots, installations, pilot devices, and KPIs.

## What is included

- Next.js App Router with TypeScript
- Tailwind CSS styling
- Supabase authentication structure
- Protected dashboard area
- Responsive sidebar navigation
- Placeholder pages for each starting module

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
- `/installations`
- `/kpi-dashboard`
