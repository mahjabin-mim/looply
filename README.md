# Looply

Lightweight Next.js app: one checklist per month. Tick items as done (with price + date/time),
mark items "not now", edit anything, and unfinished items are automatically copied into the current month.

## Run
```bash
npm install
npm run dev   # http://localhost:3000
```
Forgot-password emails are sent through Gmail when `GMAIL_USER` and `GMAIL_APP_PASSWORD` (an [app password](https://myaccount.google.com/apppasswords)) are set, or through [Resend](https://resend.com) with `RESEND_API_KEY`; otherwise the reset link is printed in the server console. `MAIL_FROM` optionally sets the sender name.

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
The iPhone tests run in WebKit (Safari's engine); install it once with `npx playwright install webkit`.

## iPhone & iPad
Open the site in Safari → Share → **Add to Home Screen**. The home-screen app runs full screen with its own
launch screen, supports Face ID / Touch ID for the app lock, and gets reminders on iOS 16.4+.
