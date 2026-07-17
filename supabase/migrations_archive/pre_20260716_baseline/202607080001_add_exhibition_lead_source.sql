-- Adds the exact lead source value used by exhibition lead imports.
-- Safe to apply before deploying code that accepts lead_source = 'Exhibition'.

alter type public.lead_source
add value if not exists 'Exhibition';
