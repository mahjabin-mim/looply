# Looply

Lightweight Next.js app: one checklist per month. Tick items as done (with price + date/time),
mark items "not now", edit anything, and unfinished items are automatically copied into the current month.

## Run
```bash
npm install
npm run dev   # http://localhost:3000
```
Forgot-password emails are sent via [Resend](https://resend.com) when `RESEND_API_KEY` (and optionally `MAIL_FROM`) is set; otherwise the reset link is printed in the server console.

Data is stored in `data/db.json` (git-ignored). Set `AUTH_SECRET` in production.

> Storage: Upstash Redis or Postgres (Neon) when their env vars are present (hosting); otherwise a local JSON file.

## Mobile app (PWA)
The site is an installable PWA. Open the deployed (HTTPS) URL on your phone:
- **Android / Chrome:** menu → *Install app* / *Add to Home screen*
- **iPhone / Safari:** Share → *Add to Home Screen*

## Google sign-in
1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → *Create credentials* → *OAuth client ID* → type **Web application**.
2. Add authorized redirect URIs: `http://localhost:3000/api/auth/google/callback` and `https://YOUR-SITE/api/auth/google/callback`.
3. Put the client ID/secret in `.env.local` (see `.env.local.example`) and restart. The "Continue with Google" button appears automatically once configured.

Signing in with Google links to an existing account with the same email, or creates a new one.

## Tests
```bash
npm test            # unit tests (Vitest): money maths, voice parsing, formatting, carry-over, app-lock PIN
npm run test:e2e    # end-to-end tests (Playwright) in your installed Google Chrome, desktop + phone sizes
npm run test:all    # both
```
The end-to-end tests start their own server on port 3100 with a throwaway data folder (`.test-data`) and
build folder (`.next-test`), so they never touch your real data or a dev server you already have running.
Speech recognition and the fingerprint sensor are simulated, since a test browser can't hear or touch.
