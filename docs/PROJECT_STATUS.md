# Project Status

## Overview

- Project name: Jiva Farm OS
- Live domain: https://www.jivawater.org
- GitHub repo: harsha-jivawater/jiva-farm-os
- Vercel project: jiva-farm-os
- Supabase production project ref: mzjmvenyzcnbgykxmjvc
- Current production branch: main

## Completed Modules

- Dashboard/Home
- Farmer Leads
- Dealers
- Institutional Partners
- Contacts/Meetings
- Pilots/Visits/Reports
- Devices
- Dispatches
- Installations
- Post Installation Follow-ups
- KPI Dashboard
- Regions
- Internal Users
- Help/SOP
- Password change/reset
- Force first-login password change
- CSV import for Farmer Leads and Devices

## Branding Status

- Current app branding uses the Jiva Water PNG logo.
- The old leaf/text visual brand block has been removed from the app shell and auth screens.
- The logo is served from `public/jiva-water-logo.png`.

## Deployment Status

- Code is deployed from GitHub to Vercel.
- Supabase is used for database and authentication.
- Supabase GitHub connection is not required for normal app deployment.
- Database schema changes should be made through committed Supabase migration files.

## Operating Notes

- Production branch is `main`.
- Vercel should deploy from `main`.
- Supabase production schema should stay aligned with committed migrations.
- QA seed tools should remain disabled in production unless intentionally enabled for controlled testing.
- CSV import templates are available under `public/templates/`.

## Documentation Habit

Every meaningful code change should update:

- `docs/CHANGELOG.md`
- `docs/PROJECT_STATUS.md` if the project state changes

This keeps future developers and Codex sessions aligned with the actual production state.
