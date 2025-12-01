# TEEDS Design Voting Platform

Full-stack Supabase + Vite starter for the TEEDS Design School showcase. The frontend ships as static assets (GitHub Pages ready) while Supabase covers Auth, Postgres, Storage, and Edge Functions.

## Features

- OTP login restricted to `@asu.edu` addresses via Supabase Edge Functions + SMTP
- Designers can upload up to two designs total, locked to a single modality (TDS Online Student or TDS In-Person Student) straight into the `designs` bucket, and only enter the artwork title + modality because their profile metadata comes from the login flow
- Anonymous voting gallery with configurable per-modality vote limits enforced by a Postgres RPC
- Admin-only analytics dashboard backed by another Edge Function and Chart.js visualizations, plus a roster modal listing everyone who has signed in
- Simple React Router app with protected routes and a lightweight localStorage-backed session context

## Setup

1. **Install deps**

   ```bash
   npm install
   ```

2. **Create a Supabase project** and paste the keys into a new `.env` (see `.env.example`). Keep the service role + SMTP secrets out of the frontend build.
3. **Run the SQL migration** via the Supabase SQL editor or CLI to create tables, policies, and the `cast_vote` RPC:

   ```bash
   supabase db push --file sql/migrations.sql
   ```

4. **Configure Storage**: create a public bucket named `designs` and allow public read access (design images only).
5. **Deploy Edge Functions**. Make sure each function has access to `SUPABASE_*`, `SENDGRID_*`, and `OTP_SALT` environment variables.

   ```bash
   supabase functions deploy request-otp
   supabase functions deploy verify-otp
   supabase functions deploy record-design
   supabase functions deploy delete-design
   supabase functions deploy admin-analytics
   ```

6. **Seed admins** by inserting email rows into the `admins` table. Those exact addresses are what the admin dashboard asks for when unlocking analytics. Verify `settings` has the vote-limit keys you want.
7. **Run locally**

   ```bash
   npm run dev
   ```

8. **Ship the frontend** to GitHub Pages (or any static host). Set `GH_PAGES_URL` so Vite builds with the right base path.

## Scripts

- `npm run dev` – Vite dev server
- `npm run build` – type-check + production build
- `npm run preview` – preview the built site
- `npm run format` – Prettier across the repo

## Environment variables

`VITE_*` variables are exposed to the browser. Everything else stays server-side for Edge Functions. Duplicate Supabase URL/keys are kept so both environments (browser + functions) work off the same `.env` template.

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OTP_SALT=
SENDGRID_API_KEY=
SENDGRID_SENDER_EMAIL=
SENDGRID_SENDER_NAME=
GH_PAGES_URL=
```

## Notes

- Replace `submitter_hash_secret` in `settings` with a long random string so design hashes cannot be reversed.
- Consider adding rate limiting or CAPTCHA around the OTP request endpoint before production.
- The UI sticks to simple CSS for clarity—swap in Tailwind or your preferred kit if you want more polish.
