# Vienna AI Business Platform

Reusable, multi-business website and automation starter for Vienna local businesses. The first demo tenant is **FORM & FADE**, a fictional barber atelier in Vienna's 7th district.

## First milestone

- Premium, responsive German-language landing page with a real booking form for the fictional demo business.
- Semantic landmarks, keyboard skip link, focus states, reduced-motion support and responsive mobile navigation.
- Booking options and availability come from Supabase; server derives the appointment end from the catalog duration and PostgreSQL rejects overlapping writes.
- Clearly marked fictional business details and legal placeholders; no real customer data is present.
- Next.js App Router, TypeScript, Tailwind CSS, Vitest and Playwright scaffolding.

## Run locally

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Checks

```bash
npm test
npm run typecheck
npm run lint
npx playwright install chromium
npm run test:e2e
npm run build
```

## Planned architecture

- `src/lib/business.ts`: first demo tenant content; move into tenant records/config once the multi-business data model is introduced.
- `src/app/`: shared Next.js application shell and tenant-facing pages.
- `supabase/migrations/`: tenant, catalog, memberships, appointment schema and RLS policies; applied to the private development project.
- `src/app/api/booking/route.ts`: server-side catalog/availability API and validated booking writer; booking writes and availability reads require `SUPABASE_SECRET_KEY`.
- `src/app/booking/BookingForm.tsx`: accessible service, barber, date, free-time and minimal-contact form.
- `supabase/tests/booking_constraints.sql`: synthetic-data test for overlapping and adjacent appointments.
- `supabase/tests/public_booking_flow.sql`: synthetic-data checks for time-zone availability, service-derived end times, overlap handling and opening hours.
- `scripts/test-booking-race.mjs`: two-request race test; requires a server-only Supabase secret key in `.env.local`.
- `src/lib/supabase/`: shared Supabase clients can be extracted here as owner auth and other server data access are added.
- `src/app/api/chat/`: planned server-only OpenAI integration, bilingual EN/DE, with rate limiting and strict data minimization.
- `n8n/`: planned workflow exports with signed webhooks and no customer payloads in logs.
- `e2e/`: browser regression coverage.

## Booking and production status

The booking form uses the development database's service catalog, per-tenant opening hours and available slots. The database derives end times from the service duration and uses an exclusion constraint to reject concurrent overlaps. Set `.env.local` from `.env.example` and add the private `SUPABASE_SECRET_KEY` before testing bookings end to end. The key is used only in the Next.js server route and is never returned to the browser. Email/SMS confirmation, production rate limiting, owner authentication/dashboard, chatbot, n8n workflows, retention automation and production security review remain future milestones. Do not expose the booking endpoint publicly until the remaining abuse controls, legal copy, tests and security review are complete.

## Environment

Copy `.env.example` to `.env.local` for local development. Never put Supabase secret/service-role keys or the OpenAI API key in `NEXT_PUBLIC_*` variables. The database race test creates and removes only synthetic `example.invalid` test records. Do not add real customer information to this demo.
