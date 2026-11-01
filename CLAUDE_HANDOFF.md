# Handoff: Open Volunteer Platform

## 1. Problem statement and core rules
- No hackathon problem statement was given in this chat. App = invite-only volunteer event signup + admin management (Next.js 16, Prisma 7, Postgres, Tailwind 4).
- Users: volunteers (phone, via WhatsApp link) and admins (email + password).
- Volunteers: no public event list. Reach an event only via `/join/<inviteCode>` (12 random chars). Give name + phone only. Sign up for the whole event (server fills all days).
- Dedupe by phone digits per event. Capacity enforced with a row lock (`FOR UPDATE`). Full event rejects signups.
- Roles: `super_admin` sees/manages all events and admins; `event_admin` sees only events they created or are assigned to (`eventScope` in `lib/adminAccess.ts`).
- Both roles can delete an event and remove a volunteer. Super admin creates event admins (temp password, forced change at first login; min 8 chars + 1 special).
- Deactivated admins are blocked immediately (DB check on every request).
- Sessions: HMAC-signed cookie `ovp_session`, 8h, needs `SESSION_SECRET` (32+ chars). Login rate-limited (8 tries / 15 min, in-memory).
- No email-domain restriction anymore; the admin table is the allowlist.
- Events auto-archive when their month has passed (admin events page).

## 2. Changed in this chat
- Full UI redesign: Big Shoulders Display + Familjen Grotesk, lilac/ink/marigold, ticket-stub event pages, tally-mark slots.
- Gateway `/` (Volunteer paste-link tab, Admin sign-in tab); old public calendar and `/admin/login` removed.
- Security: signed sessions replace the forgeable email cookie; `/api/events` removed; signup by `inviteCode` not numeric id; CSV formula guard; secure temp passwords.
- Schema: `Event.inviteCode` (unique, backfilled); `VolunteerSignup.phone`, `locationOrDepartment` now optional.
- WhatsApp share (`wa.me`) + Copy link; warns on localhost; `NEXT_PUBLIC_SITE_URL` sets public base.
- Delete event / remove volunteer endpoints + buttons; edit route now saves `endDate`.
- `scripts/create-admin.ts` takes email, password, name as arguments.

## 3. Where we stopped
- Local app works: signed in as new super admin, old events visible against DB `volunteer_platform`.
- Not done: custom 404, mobile hamburger menu, per-page titles, footer/copyright, phone-width pass on older admin pages (edit, users, archive).
- No real confirmation messages (email removed). Old signups show blank phone.
- Branch `redesign-gateway-invite-links` pushed (latest `4973e00`); not merged to `main`. Local Windows copy shows line-ending "M" marks only.
- No full `next build` run after the last changes (tsc + lint clean).
- Remove any hardcoded `SESSION_SECRET` fallback from `lib/session.ts` before pushing.

## 4. Setup and run
- `npm install`, `copy .env.example .env`
- `.env`: `DATABASE_URL=postgresql://postgres:<pw>@localhost:5432/volunteer_platform`, `SESSION_SECRET=` (run `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`), `NEXT_PUBLIC_SITE_URL=` blank locally.
- `npx prisma migrate deploy` then `npx prisma generate`
- `npx tsx scripts/create-admin.ts you@gmail.com "password" "Name"`
- `npm run dev` -> http://localhost:3000
- Deploy: Vercel + hosted Postgres (Neon/Supabase/Railway). Set `DATABASE_URL`, new `SESSION_SECRET`, `NEXT_PUBLIC_SITE_URL`; run migrate + create-admin against it.
- Quick public test: `cloudflared tunnel --url http://localhost:3000`, set `NEXT_PUBLIC_SITE_URL`, restart.

## 5. Next steps
- Must: deploy and test WhatsApp share on a real phone; run `next build`; merge to `main`; rotate any exposed passwords.
- Must: 404 page, page titles, mobile nav.
- Nice: reset invite link button, edit-signup, CSV import, SMS/WhatsApp confirmation, email/phone reminder, shared rate limiter, tests.
