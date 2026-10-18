# CollabSphere

CollabSphere is a responsive community and meetup platform concept for distributed student communities. Its Aurora Spatial interface pairs approximate, city-level community signals with Supabase-backed authentication and event proposals.

## What works in this build

- Responsive dashboard and route-based navigation for the map, people discovery, events, VenueVote, Copilot, collaborations, leaderboard, notifications, and profile.
- A Leaflet/OpenStreetMap community map that displays broad, fictional city-level signals, never individual home locations.
- Deterministic interest matching and an editable event-planning template. Copilot is clearly labelled demo mode; it does not call an AI provider or invent real attendance or availability.
- Supabase email/password sign-up and sign-in, profile creation through the database trigger, and server-validated event proposals. Submitted proposals remain private until an authorized review publishes them.
- A standalone `index.html` landing preview that works without Next.js.
- Fictional sample events and polls that are explicitly marked. Temporary demo votes, invitation responses, and sample notifications only affect the current view and are not represented as persistent real activity.

## Run the app

The project uses Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui (Base UI), Leaflet, Zod, and Supabase SSR.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open the local Next.js URL to explore the app. Open `index.html` directly for the independent static preview.

## Supabase configuration

The connected project has already been provisioned with the CollabSphere schema, Supabase Auth profile trigger, and RLS policies. Configure these public application variables for another deployment:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or the project publishable key, using the matching value)

Enable email/password sign-in and set the email redirect URL to `/auth/callback`. The `profiles` row is created by the database trigger when a user signs up. Never put `SUPABASE_SERVICE_ROLE_KEY` in a browser bundle; the application routes use the session-scoped Supabase client and RLS.

## Demo venue data (optional)

The app itself uses fictional in-code event examples so the dashboard remains explorable without seeding student records. To add the three explicitly flagged, fictional venue rows to a connected Supabase project, provide `SUPABASE_URL` (or `NEXT_PUBLIC_SUPABASE_URL`) and `SUPABASE_SERVICE_ROLE_KEY` in the server environment and run:

```sh
pnpm demo:seed
```

The reset command defaults to a dry run. To confirm the narrow reset, run `pnpm demo:reset -- --confirm-demo-reset`; it deletes only rows where `venues.is_demo = true`. It does not target profiles, events, or non-demo venues. The service-role key must remain server-side.

## Checks

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

The unit tests cover demo-data labelling and location precision. E2E coverage for authenticated registration, approvals, venue voting, check-in, and leaderboard credit is not included in this first app-shell phase.

## Security and demo limitations

- Every sample person, event, venue, result, and score shown in the demo is fictional. No live student location is used.
- Event proposals are checked on the server and inserted with the signed-in user's ID; RLS remains the final access-control layer.
- Database credentials and service-role credentials are never exposed to the browser.
- Real venue voting, event registration, QR attendance, notifications, and attendance-derived recognition need their dedicated transactional server workflows before representing production activity. This build labels those screens as examples instead of counting demo interactions as actual participation.
- The Next.js response includes baseline security headers and a report-only CSP to avoid silently blocking the preview while external map tiles are in use.
