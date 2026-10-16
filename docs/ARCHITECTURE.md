# Architecture notes

## Tenant model

Treat each business as a tenant from the start. `FORM & FADE` is fictional. Its public visual copy lives in `src/lib/business.ts`; the booking catalog and opening hours are tenant-scoped Supabase records. Every tenant-owned row carries a `business_id`; authenticated owner access must be scoped to an explicit membership record.

## Planned layers

1. **Web** — Next.js App Router, TypeScript, Tailwind CSS. Public business pages are server rendered; interactive booking, chat and owner UI use small client components.
2. **Data and identity** — Supabase Auth and Postgres. Keep RLS enabled for every exposed tenant/customer table. Never trust user-editable JWT metadata for authorization; use database membership relationships.
3. **Booking** — The Next.js form reads services, staff and free slots through `/api/booking`; writes are validated by a server-only RPC using `SUPABASE_SECRET_KEY`. Postgres derives end times from the selected service and enforces non-overlapping staff/time ranges with a GiST exclusion constraint. SECURITY DEFINER booking functions use a pinned empty search path; the write function and availability function are executable only by `service_role`. `supabase/tests/public_booking_flow.sql` covers time zone, duration, hours and overlaps; `scripts/test-booking-race.mjs` exercises simultaneous API inserts. API validation alone is not sufficient against concurrent requests.
4. **AI** — OpenAI calls run server-side only. Keep prompts and context minimal, avoid sending names/contact information unless the user explicitly provides it for a booking flow, and provide predictable non-AI fallback answers in both English and German.
5. **Automation** — n8n receives signed, minimal event payloads. Store no credentials in the browser; do not put customer data into execution logs by default.
6. **Verification** — Vitest for pure logic, Playwright for user journeys, database tests for RLS and contention, plus dependency and security review before production.

## Security and privacy decisions

- No real customer records or API credentials are included.
- `.env.example` separates public Supabase configuration from server-only OpenAI/n8n secrets.
- Google Fonts network imports were removed; the page uses local system fallbacks and CSS-drawn imagery.
- The two legal pages are explicit placeholders, not compliance-ready notices.
- Booking works only after a server-only Supabase secret key is configured. No key is stored in the project.
- The booking API still needs deployment-grade rate limiting/abuse prevention, and does not send email/SMS confirmations.
- Owner authentication, chat, analytics and external automation are not active yet.

## Next implementation phase

Next add server-side owner authentication and an owner dashboard, then bilingual chat and private n8n workflows. Never grant unauthenticated reads for appointment PII. Keep grants/RLS intentional and verify each API surface before adding client-side access.
