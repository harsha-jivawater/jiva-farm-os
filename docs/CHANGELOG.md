# Changelog

Simple reverse chronological record of major Jiva Farm OS work.

## 2026-07-08

- Updated project status and operations documentation with the current production architecture, deployment flow, role model, workflows, crop rules, file upload workflow, KPI notes, RLS/security notes, and recent important migrations.
- Documented legacy crop enforcement and the crop-name-only operational UI rule.
- Documented Farmer Lead default Sales Head fallback routing and Device Installed workflow semantics.

## 2026-07-04

- Added preview-first CSV import for Farmer Leads and Devices.
- Added downloadable CSV import templates for Farmer Leads and Devices.
- Added polished loading states for login and app route transitions.
- Cleaned the Jiva Water PNG logo so it renders without a dark background.
- Updated login wording and removed the Supabase authentication note.
- Added first-login password change support for onboarded and future users.
- Added password change and password reset flows.
- Updated Jiva Water branding across app shell and auth screens.
- Added Help/SOP section for daily operations guidance.
- Prepared production base schema export and sanitized production-safe schema file.
- Added secondary role support for internal users.
- Added performance indexes migration draft for common filters, scopes, and list pages.
- Rebuilt KPI Dashboard summary RPC for faster KPI loading.
- Added follow-up fixes for KPI RPC enum/text comparisons.

## 2026-07-03

- Completed Production Supabase setup planning and RLS preparation.
- Added Phase 1 RLS policies for users, regions, farmer leads, dealers, devices, dispatches, installations, and followups.
- Added Phase 2 RLS draft and follow-up review for institutions, pilots, visits, reports, and device movements.
- Built Internal Users and Regions management.
- Added safe user deactivation and ownership transfer support.

## Earlier Completed Work

- Built app shell with protected routes and sidebar navigation.
- Built Farmer Leads module.
- Built Devices module.
- Built Dispatches module.
- Built Installations module.
- Built Post Installation Follow-ups module.
- Built Dealers module.
- Built Institutional Partners, contacts, and meetings.
- Built Pilots, pilot visits, and visit reports.
- Built KPI Dashboard.
