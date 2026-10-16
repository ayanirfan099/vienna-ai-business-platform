# Project progress

## Phase 1 — working responsive homepage

**Status: complete locally.** The fictional FORM & FADE barbershop homepage is built as a structured Next.js App Router project. It includes the responsive editorial landing page, mobile details-menu navigation, service list, telephone booking CTA, business details, and clearly marked legal placeholders.

### Verification

- `npm test` — passed (2 Vitest tests).
- `npm run typecheck` — passed.
- `npm run lint` — passed after fixing one unescaped JSX apostrophe.
- `npm run build` — passed; homepage and both legal pages are statically rendered.
- `npm run test:e2e` — attempted; Playwright could not launch because Chromium was not present. Browser download from the configured CDN returned an empty/truncated archive in this environment. Re-run after installing the Playwright Chromium browser.

### Initial connection checks

- GitHub connector read/search — succeeded; no repository named `vienna-ai-business-platform` was found.
- Supabase connector project list — succeeded; the account initially had no development projects.
- One Supabase organization was available; Phase 2 below records the later development-project creation.
- No public deployment, real business data, or customer data was used.

The owner dashboard, English/German AI chat, n8n workflows and production security review remain unimplemented and are not represented as production ready.

## Phase 2 — private development database and booking foundation

**Status: schema applied and verified.** A private Supabase development project (`vienna-ai-business-platform-dev`) was provisioned in `eu-central-1` and is `ACTIVE_HEALTHY`. The provisioning tool completed without requesting a separate cost confirmation. No secrets were added to the project files.

- Added tenant-scoped `businesses`, `business_members`, `services`, `staff` and `appointments` tables, RLS on all five tables, and a private membership-check helper.
- Seeded only the fictional FORM & FADE business, three demo services and a fictional staff display name.
- Added Postgres exclusion constraint `appointments_staff_time_no_overlap` to reject concurrent overlapping reservations for the same business and staff member; adjacent `[start,end)` appointments remain valid.
- Security advisor returned no findings. Performance advisor no longer reports the composite appointment foreign key or multiple permissive SELECT policies; it reports unused-index INFO findings because the new demo tables are mostly empty.
- `supabase/tests/booking_constraints.sql` passed against the development database: overlapping intervals were rejected and an adjacent interval was accepted; synthetic rows were rolled back by cleanup.
- A live two-request concurrency check was also run against the development project. One request committed and the other received PostgreSQL exclusion violation `23P01`; the synthetic appointment was removed afterward.
- `scripts/test-booking-race.mjs` captures that concurrency check for future repeatable use; it requires a server-only `SUPABASE_SECRET_KEY` in `.env.local`, which has not been retrieved or committed.
- After the schema/test additions, `npm test` (2 passed), `npm run typecheck`, `npm run lint`, `npm run build`, and `node --check scripts/test-booking-race.mjs` all passed.
- The repeatable Node race script has not been run because a server-only key has not been provisioned locally; the equivalent two-request race was run directly through the authenticated database connector and verified.

### Remaining blockers at the end of phase 2

- At that point, GitHub sign-in blocked repository creation. A signed-in session became available later; the private repository and code commit are recorded in Phase 4 below.
- Public booking UI/API, service-derived appointment durations, opening-hours availability, owner authentication/dashboard, bilingual chatbot, n8n workflows, automated data retention and production security review are still ahead.

## Phase 3 — public booking form and server-validated booking API

**Status: implemented locally and applied to development database.** The homepage now contains a responsive accessible form for choosing a catalog service, barber, date, free slot and one customer contact method.

- Added tenant-specific opening-hours records and demo hours for the fictional business.
- Availability slots are calculated in the tenant's `Europe/Vienna` timezone, use 30-minute start intervals, respect the service duration and omit occupied intervals.
- Server-only booking API validates origin, content type, request size, input shape and contact fields. It uses the server secret only; neither booking reads nor writes expose that key to the browser.
- The database function derives end time from the stored service duration, rejects closed/out-of-hours times, bounds booking dates to 60 days, and relies on the exclusion constraint to stop simultaneous overlap.
- Initial advisor review found the availability SECURITY DEFINER RPC was callable by anon/authenticated. Its privileges were restricted to `service_role` in a follow-up migration; the Next.js API now calls it server-side. Follow-up security advisor has no findings.
- Live SQL smoke tests passed for slot availability, service-derived 45-minute duration, slot removal after booking, overlap rejection and out-of-hours rejection. Test inserts were rolled back and used synthetic `.invalid` data.
- `npm run typecheck`, `npm run lint`, `npm test` (2 passed), `npm run build` and the Node script syntax check passed.
- `npm run test:e2e` was run against the new form; both browser cases were blocked before test execution because the Playwright Chromium executable is missing. Earlier Chromium download attempts returned an incomplete archive. The form also needs a local `.env.local` with a server-only Supabase secret to run through the HTTP booking API; no key was retrieved or stored.

### Remaining blockers

- Production use still requires deployment-grade rate limiting/abuse controls, customer notice and retention policy, email/SMS confirmation design, owner dashboard/auth, bilingual chatbot, n8n workflows, full E2E runs and a security review.

## Phase 4 — private GitHub repository

**Status: complete.** Created private repository `ayanirfan099/vienna-ai-business-platform` and verified the `main` branch contains the structured Next.js application, booking API, migrations, SQL tests, and progress/architecture docs. GitHub commit `afbd907` contains the working homepage and secure booking foundation; no secret values or customer data were committed.
